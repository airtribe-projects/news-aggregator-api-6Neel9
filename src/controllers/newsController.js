const NewsAPI = require('newsapi');
const News = require('../models/News');
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);
const NewsCache = require('../cache/newsCache');

// Helper: build a cache key from preferences
function buildCacheKey({ categories = ['general'], languages = ['en'], country = process.env.DEFAULT_COUNTRY || 'us' }) {
  return `${categories.join(',')}|${languages.join(',')}|${country}`;
}

// GET /api/news - uses cache
exports.getNews = async (req, res, next) => {
  try {
    const prefs = req.user.preferences || { categories: ['general'], languages: ['en'] };
    const country = req.query.country || process.env.DEFAULT_COUNTRY || 'us';
    const key = buildCacheKey({ categories: prefs.categories, languages: prefs.languages, country });

    const cached = NewsCache.get(key);
    if (cached) return res.json({ fromCache: true, count: cached.length, articles: cached, news: cached });


    // pick primary category/language for NewsAPI params
    const category = prefs.categories[0] || 'general';
    const language = prefs.languages[0] || 'en';

    const response = await newsapi.v2.topHeadlines({ category, language, country });
    if (response.status !== 'ok') return res.status(502).json({ message: 'NewsAPI error' });

    const articles = response.articles || [];

    // Upsert articles into DB by URL (idempotent)
    const ops = articles.map(a => ({
      updateOne: {
        filter: { url: a.url },
        update: {
          $set: {
            source: a.source,
            author: a.author,
            title: a.title,
            description: a.description,
            url: a.url,
            urlToImage: a.urlToImage,
            publishedAt: a.publishedAt ? new Date(a.publishedAt) : undefined,
            content: a.content,
            category,
            language,
            country
          }
        },
        upsert: true
      }
    }));
    if (ops.length) await News.bulkWrite(ops, { ordered: false }).catch(() => { /* ignore duplicates */ });

    // store only useful article fields in cache to avoid huge objects
    const slim = articles.map(a => ({
      title: a.title,
      description: a.description,
      url: a.url,
      urlToImage: a.urlToImage,
      publishedAt: a.publishedAt,
      source: a.source
    }));

    NewsCache.set(key, slim);
    res.json({ fromCache: false, count: slim.length, articles: slim, news: slim });

  } catch (err) {
    next(err);
  }
};

// GET /api/news/saved - from DB
exports.getSavedNews = async (req, res, next) => {
  try {
    const docs = await News.find().sort({ publishedAt: -1 }).limit(100);
    res.json({ count: docs.length, articles: docs });
  } catch (err) {
    next(err);
  }
};

// POST /api/news/:id/read
exports.markRead = async (req, res, next) => {
  try {
    const user = req.user;
    const articleId = req.params.id;
    if (!articleId) return res.status(400).json({ message: 'Article id required' });

    // push if not exists
    if (!user.readArticles.includes(articleId)) {
      user.readArticles.push(articleId);
      await user.save();
    }
    res.json({ message: 'Marked read', readArticles: user.readArticles });
  } catch (err) {
    next(err);
  }
};

// POST /api/news/:id/favorite
exports.markFavorite = async (req, res, next) => {
  try {
    const user = req.user;
    const articleId = req.params.id;
    if (!articleId) return res.status(400).json({ message: 'Article id required' });

    if (!user.favoriteArticles.includes(articleId)) {
      user.favoriteArticles.push(articleId);
      await user.save();
    }
    res.json({ message: 'Marked favorite', favoriteArticles: user.favoriteArticles });
  } catch (err) {
    next(err);
  }
};

// GET /api/news/read
exports.getRead = async (req, res, next) => {
  try {
    await req.user.populate('readArticles');
    res.json({ count: req.user.readArticles.length, articles: req.user.readArticles });
  } catch (err) {
    next(err);
  }
};

// GET /api/news/favorites
exports.getFavorites = async (req, res, next) => {
  try {
    await req.user.populate('favoriteArticles');
    res.json({ count: req.user.favoriteArticles.length, articles: req.user.favoriteArticles });
  } catch (err) {
    next(err);
  }
};

// GET /api/news/search/:keyword
exports.search = async (req, res, next) => {
  try {
    const q = req.params.keyword;
    if (!q) return res.status(400).json({ message: 'Keyword required' });

    const page = Number(req.query.page) || 1;
    const response = await newsapi.v2.everything({ q, language: req.query.language || 'en', sortBy: 'relevancy', page });
    if (response.status !== 'ok') return res.status(502).json({ message: 'NewsAPI error' });

    const articles = response.articles || [];

    // Upsert into DB for persistence
    const ops = articles.map(a => ({
      updateOne: {
        filter: { url: a.url },
        update: {
          $set: {
            source: a.source,
            author: a.author,
            title: a.title,
            description: a.description,
            url: a.url,
            urlToImage: a.urlToImage,
            publishedAt: a.publishedAt ? new Date(a.publishedAt) : undefined,
            content: a.content,
            language: a.language || 'en'
          }
        },
        upsert: true
      }
    }));
    if (ops.length) await News.bulkWrite(ops, { ordered: false }).catch(() => { });

    const slim = articles.map(a => ({
      title: a.title,
      description: a.description,
      url: a.url,
      urlToImage: a.urlToImage,
      publishedAt: a.publishedAt,
      source: a.source
    }));

    res.json({ count: slim.length, articles: slim });
  } catch (err) {
    next(err);
  }
};

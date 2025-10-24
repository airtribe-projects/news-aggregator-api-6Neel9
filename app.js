require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const connectDB = require('./src/config/db.js');
const authRoutes = require('./src/routes/authRoutes');
/* NOTE: fix the preference route filename below if your file has a different name */
const prefRoutes = require('./src/routes/prefereceRoute.js'); // <-- fix typo if needed
const newsRoutes = require('./src/routes/newsRoutes');
const NewsCache = require('./src/cache/newsCache');
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

connectDB();

// routes
app.use('/users', authRoutes);   // /users/signup /users/login
app.use('/users', prefRoutes);   // /users/preferences
app.use('/', newsRoutes);        // /news...

app.get('/', (req, res) => res.json({ ok: true, message: 'News API running' }));

// global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// export app for testing (supertest expects this)
module.exports = app;

// --- only start server & background jobs when running directly (not when required by tests)
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

  // Periodic cache refresh (simple): refresh top categories every interval
  const refreshInterval = Number(process.env.CACHE_REFRESH_INTERVAL_SECONDS || 300) * 1000;
  const categoriesToRefresh = ['general', 'business', 'technology', 'sports'];

  async function refreshCache() {
    try {
      for (const category of categoriesToRefresh) {
        const country = process.env.DEFAULT_COUNTRY || 'us';
        const key = `${category}|en|${country}`.replace(',,', ','); // build same format
        // fetch from NewsAPI
        const resp = await newsapi.v2.topHeadlines({ category, language: 'en', country });
        if (resp.status === 'ok' && resp.articles) {
          const slim = resp.articles.map(a => ({
            title: a.title,
            description: a.description,
            url: a.url,
            urlToImage: a.urlToImage,
            publishedAt: a.publishedAt,
            source: a.source
          }));
          NewsCache.set(key, slim);
        }
      }
      console.log('Cache refreshed:', new Date().toISOString());
    } catch (err) {
      console.warn('Cache refresh failed:', err.message);
    }
  }

  // initial fetch + periodic refresh
  (async () => {
    await refreshCache();
    setInterval(refreshCache, refreshInterval);
  })();
}

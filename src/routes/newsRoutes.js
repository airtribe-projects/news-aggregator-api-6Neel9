const express = require('express');
const auth = require('../middleware/auth');
const newsCtrl = require('../controllers/newsController');
const router = express.Router();

router.get('/news', auth, newsCtrl.getNews);
router.get('/news/saved', auth, newsCtrl.getSavedNews);
router.post('/news/:id/read', auth, newsCtrl.markRead);
router.post('/news/:id/favorite', auth, newsCtrl.markFavorite);
router.get('/news/read', auth, newsCtrl.getRead);
router.get('/news/favorites', auth, newsCtrl.getFavorites);
router.get('/news/search/:keyword', auth, newsCtrl.search);

module.exports = router;

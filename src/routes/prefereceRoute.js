// const express = require('express');
// const { body } = require('express-validator');
// const auth = require('../middleware/auth');
// const { getPreferences, updatePreferences } = require('../controllers/preferenceController');

// const router = express.Router();

// router.get('/preferences', auth, getPreferences);
// router.put('/preferences', auth, [
//   body('categories').optional().isArray().withMessage('categories must be array'),
//   body('languages').optional().isArray().withMessage('languages must be array')
// ], updatePreferences);

// module.exports = router;
const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { getPreferences, updatePreferences } = require('../controllers/preferenceController');

const router = express.Router();

router.get('/preferences', auth, getPreferences);
router.put('/preferences', auth, [
  body('preferences').optional().isArray().withMessage('preferences must be array')
], updatePreferences);

module.exports = router;

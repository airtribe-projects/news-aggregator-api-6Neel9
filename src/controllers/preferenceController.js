// const { validationResult } = require('express-validator');

// exports.getPreferences = async (req, res, next) => {
//   try {
//     const prefs = req.user.preferences || { categories: ['general'], languages: ['en'] };
//     res.json({ preferences: prefs });
//   } catch (err) {
//     next(err);
//   }
// };

// exports.updatePreferences = async (req, res, next) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//     const { categories, languages } = req.body;
//     const user = req.user;

//     if (categories) user.preferences.categories = categories;
//     if (languages) user.preferences.languages = languages;

//     await user.save();
//     res.json({ preferences: user.preferences });
//   } catch (err) {
//     next(err);
//   }
// };
const { validationResult } = require('express-validator');
const User = require('../models/User');

exports.getPreferences = async (req, res, next) => {
  try {
    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).select('preferences');
    const prefs = user && Array.isArray(user.preferences?.categories) ? user.preferences.categories : [];
    return res.json({ preferences: prefs });
  } catch (err) {
    next(err);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const prefs = req.body.preferences;
    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const update = {};
    if (Array.isArray(prefs)) update['preferences.categories'] = prefs;

    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('preferences');
    const out = user && Array.isArray(user.preferences?.categories) ? user.preferences.categories : [];
    return res.json({ preferences: out });
  } catch (err) {
    next(err);
  }
};


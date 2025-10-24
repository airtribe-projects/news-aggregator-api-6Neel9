// src/controllers/authController.js
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, preferences } = req.body;

    // find existing user
    const existing = await User.findOne({ email });

    if (existing) {
      // If tests (or clients) sent a preferences array, overwrite categories
      if (Array.isArray(preferences)) {
        existing.preferences = existing.preferences || {};
        existing.preferences.categories = preferences;
        await existing.save();
      }

      // Return 200 with token for idempotent signup behaviour
      return res.status(200).json({
        _id: existing._id,
        name: existing.name,
        email: existing.email,
        token: generateToken(existing._id)
      });
    }

    // create new user (model pre-save will hash password)
    const prefObj = {};
    if (Array.isArray(preferences)) prefObj.categories = preferences;

    const user = await User.create({ name, email, password, preferences: prefObj });

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (err) {
    next(err);
  }
};


exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (err) {
    next(err);
  }
};

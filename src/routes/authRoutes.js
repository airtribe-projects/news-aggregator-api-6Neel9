const express = require('express');
const { body } = require('express-validator');
const { register, login } = require('../controllers/authController');
const router = express.Router();

router.post('/signup', [
  body('name').isLength({ min: 2 }).withMessage('Name at least 2 chars'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password at least 6 chars')
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').exists().withMessage('Password required')
], login);

module.exports = router;

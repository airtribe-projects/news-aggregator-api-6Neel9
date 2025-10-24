const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const preferenceSchema = new mongoose.Schema(
  {
    categories: { type: [String], default: ['general'] },
    languages: { type: [String], default: ['en'] }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    preferences: { type: preferenceSchema, default: () => ({}) },
    readArticles: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'News' }], default: [] },
    favoriteArticles: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'News' }], default: [] }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

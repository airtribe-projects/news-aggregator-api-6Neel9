const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    source: {
      id: { type: String, default: null },
      name: { type: String, default: 'Unknown' }
    },
    author: { type: String, default: '' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    url: { type: String, required: true, unique: true },
    urlToImage: { type: String, default: '' },
    publishedAt: { type: Date },
    content: { type: String, default: '' },
    category: { type: String, default: 'general' },
    language: { type: String, default: 'en' },
    country: { type: String, default: process.env.DEFAULT_COUNTRY || 'us' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('News', newsSchema);

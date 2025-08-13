const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  date: { type: String, unique: true, required: true },
  matches: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Match', MatchSchema);

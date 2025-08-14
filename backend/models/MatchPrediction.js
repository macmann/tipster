const mongoose = require('mongoose');

const MatchPredictionSchema = new mongoose.Schema({
  // Fixture IDs from different data providers can be numeric or
  // alphanumeric (e.g. The Odds API). Store as string to accommodate both.
  fixtureId: { type: String, unique: true, required: true },
  prediction: { type: String, default: '' },
  human: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MatchPrediction', MatchPredictionSchema);

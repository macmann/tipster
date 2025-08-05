const mongoose = require('mongoose');

const MatchPredictionSchema = new mongoose.Schema({
  fixtureId: { type: Number, unique: true, required: true },
  prediction: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MatchPrediction', MatchPredictionSchema);

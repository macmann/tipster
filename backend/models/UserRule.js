const mongoose = require('mongoose');

const UserRuleSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  rules: { type: mongoose.Schema.Types.Mixed, default: {} }
});

module.exports = mongoose.model('UserRule', UserRuleSchema);

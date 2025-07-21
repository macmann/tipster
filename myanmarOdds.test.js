const assert = require('assert');
const { getMyanmarBet } = require('./backend/utils/myanmarOdds');

function buildOdds(value) {
  return [{
    bookmakers: [{
      bets: [{
        name: 'Asian Handicap',
        values: [typeof value === 'object' ? value : { value }]
      }]
    }]
  }];
}

// simple numeric string
let bet = getMyanmarBet(buildOdds('-1.5'));
assert.strictEqual(bet.handicap, -1.5);

// with leading text
bet = getMyanmarBet(buildOdds({ value: 'Home -1.5' }));
assert.strictEqual(bet.handicap, -1.5);

// unknown handicap should still return number
bet = getMyanmarBet(buildOdds('Away +0.25'));
assert.strictEqual(bet.handicap, 0.25);

console.log('All tests passed');

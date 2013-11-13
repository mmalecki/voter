var test = require('tap').test;
var createNetwork = require('./helpers/create-network');

var N = 100;
var VOTING = 'voting';
var QUORUM = Math.floor(N / 2) + 1;

var LOSING = 'losing';
var WINNING = 'winning';

var LOSING_VOTES = N - QUORUM;
var WINNING_VOTES = QUORUM;

test('voter/quorum', function (t) {
  var winningVotes = 0;
  var losingVotes = 0;
  var quorums = 0;

  var net = createNetwork(N, {
    new: function (key, voting) {
      setTimeout(function () {
        if (losingVotes < LOSING_VOTES) {
          losingVotes++;
          this.vote(key, LOSING)
        }
        else {
          winningVotes++;
          this.vote(key, WINNING);
        }
      }.bind(this), 50 + Math.floor(50 * Math.random()));
    },
    vote: function (key, origin, vote) {
      t.equal(key, VOTING, '`vote` event should have correct `key` value');
    },
    quorum: function (key, voting, vote) {
      t.equal(key, VOTING, '`quorum` event should have correct `key` value');
      t.equal(vote, WINNING, '`quorum` event should have correct `vote` value');

      t.equal(voting.quorum, QUORUM);
      t.type(voting.votes, 'object');

      t.ok(winningVotes >= QUORUM, '`quorum` event should occur when no less than `QUORUM` winning votes');

      ++quorums;
      if (N === quorums) {
        t.ok(net.every(function (c) {
          return c.vote(VOTING, WINNING) === false;
        }), 'votings should be removed from all voters');
        t.end();
      }
    },
    timeout: function () {
      t.ok(false, 'Timeout should not occur');
    }
  });

  t.equal(net.length, N);
  net[0].startVoting(VOTING, { quorum: QUORUM, timeout: 1000 });
});

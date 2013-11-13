var Voter = require('../../');

function noop() {}

module.exports = function (n, events) {
  var voters = [];
  var voter, oldVoter, voterStream;

  events = events || {};

  for (var i = 0; i < n; i++) {
    voter = new Voter();

    voter.on('new', events.new || noop);
    voter.on('vote', events.vote || noop);
    voter.on('quorum', events.quorum || noop);

    voterStream = voter.createStream();
    if (oldVoter) {
      voterStream.pipe(oldVoter.createStream()).pipe(voterStream);
    }
    oldVoter = voter;
    voters.push(voter);
  }

  return voters;
};

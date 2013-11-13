var util = require('util');
var uuid = require('node-uuid');
var between = require('between');
var Scuttlebutt = require('scuttlebutt');
var filter = require('scuttlebutt/util').filter;

function order(a, b) {
  return between.strord(a[1], b[1]) || between.strord(a[2], b[2])
}

var Voter = module.exports = function (options) {
  options = options || {};

  Scuttlebutt.call(this);
  this._store = {};
  this._history = {};
  this._hash = JSON.stringify || options.hash;
};
util.inherits(Voter, Scuttlebutt);

Voter.prototype._get = function (key) {
  return this._store['+' + key];
};

Voter.prototype._set = function (key, val) {
  return this._store['+' + key] = val;
};

Voter.prototype._rm = function (key) {
  delete this._store['+' + key];
};

Voter.prototype._checkVotes = function () {
  var self = this;
  Object.keys(self._store).forEach(function (key) {
    var voting = self._store[key];
    var quorum = voting.quorum;
    var votes = {};
    var maxCount = -Infinity;
    var maxKey, actualKey;

    Object.keys(voting.votes).forEach(function (key) {
      var hash = '+' + self._hash(voting.votes[key]);

      if (!votes[hash]) {
        votes[hash] = { count: 0, value: voting.votes[key] };
      }
      ++votes[hash].count;
      if (votes[hash].count > maxCount && votes[hash].count >= quorum) {
        maxKey = hash;
        maxCount = votes[hash].count;
      }
    });

    if (maxCount !== -Infinity) {
      actualKey = key.substr(1);
      self.emit('quorum', key.substr(1), votes[maxKey].value);
      self._rm(actualKey);
      self.localUpdate([actualKey, null]);
    }
  });
};

Voter.prototype.vote = function (key, vote) {
  var voting = this._get(key);
  if (!voting) {
    return false;
  }

  voting.votes[this.id] = vote;
  this.localUpdate([key, voting]);
  this._checkVotes();
  return true;
};

Voter.prototype.startVoting = function (key, voting) {
  if (typeof voting.quorum !== 'number' ||
      typeof voting.timeout !== 'number') {
    throw new Error('`voting.quorum` and `voting.timeout` are required and have to be a number');
  }

  this.localUpdate([key, voting]);
}

Voter.prototype.applyUpdate = function (update) {
  var key = update[0][0];
  var value = update[0][1];
  var origin = update[2];
  var voting = this._get(key);

  if (!voting) {
    // New voting.
    if (value === null || typeof value.quorum !== 'number' ||
        typeof value.timeout !== 'number') {
      // Reject any votings without quorum and timeout.
      return false;
    }

    value.origin = origin;
    value.votes = value.votes || {};
    this._set(key, value);
    this._history['+' + key] = update;
    this.emit('new', key, value);
    this._checkVotes();
    return true;
  }
  else {
    if (value === null) {
      this._rm(key);
      return true;
    }

    voting.votes[origin] = value.votes[origin];
    this._set(key, voting);
    this._history['+' + key] = update;
    this.emit('vote', key, origin, value.votes[origin]);
    this._checkVotes();
    return true;
  }
};

Voter.prototype.history = function (sources) {
  var self = this;
  var r = [];

  Object.keys(self._history).forEach(function (key) {
    var update = self._history[key];
    if (r.indexOf(update) === -1 && filter(update, sources)) {
      r.push(update);
    }
  });

  return r.sort(order);
};

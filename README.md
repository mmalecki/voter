# voter
Distributed voting based on Scuttlebutt

## Installation

```sh
npm install voter
```

## Usage

```js
var Voter = require('voter');

var timeout = 100;

function onNew(key, voting) {
  console.log(this.id + ': voting ' + key + ' with quorum ' + voting.quorum + ' started');
  setTimeout(function () {
    this.vote(key, true);
  }.bind(this), timeout += 100);
}

function onVote(key, origin, vote) {
  console.log(this.id + ': ' + origin + ' voted: ' + JSON.stringify(vote));
}

function onQuorum(key, vote) {
  console.log(this.id + ': voting ' + key + ' reached quorum: ' + JSON.stringify(vote));
}

var a = new Voter();
var b = new Voter();
var c = new Voter();

a.on('new', onNew);
b.on('new', onNew);
c.on('new', onNew);

a.on('vote', onVote);
b.on('vote', onVote);
c.on('vote', onVote);

a.on('quorum', onQuorum);
b.on('quorum', onQuorum);
c.on('quorum', onQuorum);

var ab = a.createStream();
var bc = b.createStream();

ab.pipe(b.createStream()).pipe(ab);
bc.pipe(c.createStream()).pipe(bc);

a.startVoting('voting', { quorum: 4, timeout: 10000 });

setTimeout(function () {
  var d = new Voter();
  var cd = c.createStream();
  cd.pipe(d.createStream()).pipe(cd);

  d.on('new', onNew);
  d.on('vote', onVote);
  d.on('quorum', onQuorum);

}, 4000);
```

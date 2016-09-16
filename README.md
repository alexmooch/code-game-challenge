# code-game-challenge

A simple "Code Game Challenge" running suit written in node.js

#### Typical usage:

```
const CGC = require('cgc');

var rules = new CGC.Rules();
rules.initWorld = function(world) {}
rules.initPlayer = functin(world, playerID, init_intent) {}
rules.movePlayer = function(world, playerID, move_intent) {}
rules.updateWorld = functin(world) {}
// ...

var game = new CGC.Game(rules);
game.addStrategy('var Strategy = { init: function() {}, move: function(world) {} }');
// ...

var game_record = game.run({ ticks: 4000 });
// game_record = [ { world: object, offline: [ bool, ... ] }, ... ]
// game_record.result = rules.getResult(world)
```
Complete *Rock-Paper-Scissors* example see under examples/rps_game.js

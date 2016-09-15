# code-game-challenge

A simple "Code Game Challanges" core.

#### Typical usage:

```
var rules = new Rules();
rules.initWorld = function(world) {}
rules.addPlayer = functin(world) {}
rules.movePlayer = function(world, playerID, intent) {}
rules.updateWorld = functin(world) {}
// ...

var game = new Game(rules);
game.addStrategy('var Strategy = { init: function() {}, move: function() {} }');
// ...

var game_record = game.run(4000);
// game_record = [ { world: object, bots: [ { id: int, offline: bool } ] }, ... ]
// game_record.result = rules.getResult(world)
```
Complete *Rock-Paper-Scissors* example under examples/rps_game.js

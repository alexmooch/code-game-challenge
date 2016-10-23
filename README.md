# code-game-challenge

A simple "Code Game Challenge" running suit written in node.js

#### Typical usage:

```
const CGC = require('cgc');

var rules = new CGC.Rules();
rules.initWorld = function(world) {}
rules.initPlayer = function(world, playerID, init_intent) {}
rules.movePlayer = function(world, playerID, move_intent) {}
rules.updateWorld = function(world) {}
// ...

var game = new CGC.Game(rules);
game.addStrategy('var Strategy = { init: function() {}, move: function(world) {} }');
// ...

var game_record = game.run({ ticks: 4000 });
/*
    game_record = {
        states: [ {
            world: Object,
            offline: [ bot_id, ... ] // [Boolean]
        }, ... ],
        result = rules.getResult(world),
    };
*/
```
Complete *Rock-Paper-Scissors* example see under examples/rps/game.js

More complex usage for volleyball-like game *Headball* see under examples/headball/

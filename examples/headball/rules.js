const CGC = require('../../cgc');
const API = require('./api');

// Create your game API

var globals = {
    RPS: API,
}

// Create CGC.Rules

var rps = new CGC.Rules();

rps.getAPI = function() {
    return globals;
}

rps.initWorld = function(world) {
    this.score = [0, 0, 0];
    this.players = [];
}

rps.initPlayer = function(world, playerID) {
    this.players[playerID] = {};
}

rps.movePlayer = function(world, playerID, intent) {
    this.players[playerID].choice =
        intent instanceof API.Intent ? intent.getValue() : undefined;
}

rps.updateWorld = function(world) {
    if (this.players.length < 2) return;

    var ppl = this.players;
    if (ppl[0].choice === undefined && ppl[1].choice === undefined) {
        // both offline
    }
    else if (ppl[0].choice === undefined) {
        ++this.score[1];
    }
    else if (ppl[1].choice === undefined) {
        ++this.score[0];
    }
    else {
        var w = (3 + ppl[0].choice - ppl[1].choice) % 3;
        ++this.score[(2 + w) % 3];
    }

    ppl.forEach(function (player) {
        player.choice = undefined;
    });
}

rps.getResult = function(world) {
    return {
        'winner': this.score[0] > this.score[1] ? 1 : (
            this.score[1] > this.score[0] ? 2 : undefined
        ),
        'score': this.score,
    }
}

module.exports = rps;

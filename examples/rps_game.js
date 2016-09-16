const CGC = require('../cgc');
const API = require('./rps_api');
const fs = require('fs');
const path = require('path');

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

// Create CGC.Game

var game = new CGC.Game(rps);

// Add bots

const strategy_path = path.join(__dirname, 'rps_strategy.js');
const strategy_code = fs.readFileSync(strategy_path);

for (var i = 0; i < 2; ++i) {
    var err = game.addStrategy(strategy_code);
    if (err) {
        console.error(err);
    }
}

// Run Game

var record = game.run({ticks: 4000, shuffle_bots: false });
var result = record.result;

console.log('\nWinner: ' + result.winner + '\nScore:  ' + result.score[0] +
    ' : ' + result.score[1] + ' (' + result.score[2] + ' draw)');

const record_filename = path.join(__dirname, '.record.json');
fs.writeFile(record_filename, JSON.stringify(record, null, 2));

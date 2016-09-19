const CGC = require('../../cgc');
const rules = require('./rules');

module.exports = function(strategies, opts) {
    var game = new CGC.Game(rules);

    var bots = game.bots;
    var err = null;
    var id = 0;

    strategies.forEach(function(strategy) {
        game.addStrategy(strategy);

        if (!err && bots[id].strategy.last_error) {
            err = 'Strategy [' + id + '] cannot be run: ' +
                    bots[id].strategy.last_error.message;
        }

        ++id;
    });

    return err || game.run(opts);
}

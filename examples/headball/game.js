const CGC = require('../../cgc');
const rules = require('./rules');

module.exports = function (first, second, opts) {
    var game = new CGC.Game(rules);

    game.addStrategy(first);
    game.addStrategy(second);

    var err = null;
    game.bots.forEach(function (bot, id) {
        err = err || bot.strategy.last_error && (
            'Strategy [' + id + '] cannot be run: ' +
                bot.strategy.last_error.message
        );
    });

    return err || game.run(opts);
}

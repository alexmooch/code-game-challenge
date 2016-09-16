const clone = require('clone');
// const util = require('util');


///////////////////////////////////////////////////////////////////////////////
/// Useful functions //////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function shuffle_array(arr) {
    var n = arr.length;

    while (n > 0) {
        var i = Math.floor(Math.random() * n--);

        var t = arr[i];
        arr[i] = arr[n];
        arr[n] = t;
    }

    return arr;
}

///////////////////////////////////////////////////////////////////////////////
/// The Rules class ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


function Rules() {
    var rules = this;
    Rules.METHODS.forEach(function (name) {
        rules[name] = function () {};
    });
}

Rules.METHODS = [
    'getAPI',       // Returns game API which will be added to context.
                    //                          () => API
    'initWorld',    // Initialization.          (world)
    'initPlayer',   // Player initialization.   (world, playerID, init_data)
    'movePlayer',   // One player moves.        (world, playerID, move_data)
    'updateWorld',  // Simulate tick.           (world)
    'getResult'     // Get winner's ID and/or score etc.
                    //                          (world) => result
];

Rules.fromObject = function (object) {
    if (object instanceof Rules) return object;

    var rules = new Rules();
    Object.keys(object).forEach(function (name) {
        // FIXME: clone() instead of simple assignment?
        rules[name] = object[name];
    });
}


///////////////////////////////////////////////////////////////////////////////
/// The StrategyRunner class //////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


function StrategyRunner(strategy) {
    // this.strategy = strategy;
}

StrategyRunner.prototype.init = function (API, world, timeout) {
    // return init_data (see: Rules.METHODS.initPlayer)

    // NOTE: Should return an empty object if strategy.init() returned nothing
    // but didn't crash, undefined otherwise
}

StrategyRunner.prototype.move = function (API, world, timeout) {
    // return move_data (see: Rules.METHODS.movePlayer)

    // NOTE: Should return an empty object if strategy.move() returned nothing
    // but didn't crash, undefined otherwise
}


///////////////////////////////////////////////////////////////////////////////
/// The VMStrategyRunner class ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const vm = require('vm');

function VMStrategyRunner(strategy_code, timeout) {
    this.context = vm.createContext();

    try {
        vm.runInContext(strategy_code, this.context, { timeout: timeout });

        if (!this.context.strategy) {
            this.context.strategy = this.context.Strategy;
            delete this.context.Strategy;
        }
        var strategy = this.context.strategy;

        if (!strategy) {
            throw new Error('No Strategy object present');
        } else if (typeof strategy.init !== 'function') {
            throw new Error('Missing init() method in Strategy object');
        } else if (typeof strategy.move !== 'function') {
            throw new Error('Missing move() method of Strategy object');
        }
    } catch (e) {
        // delete this.context;
        this.last_error = e;
    }
}

VMStrategyRunner.prototype = new StrategyRunner();

VMStrategyRunner.prototype.init = function (API, timeout) {
    delete this.last_error;
    try {
        var runner = this;
        API && Object.keys(API).forEach(function (property) {
            runner.context[property] = API[property];
        });

        return vm.runInContext('strategy.init()', this.context, {
                timeout: timeout,
                displayErrors: false,
            }
        ) || {};
    } catch (e) {
        this.last_error = e;
        // return;
    }
}

VMStrategyRunner.prototype.move = function (world, API, timeout) {
    delete this.last_error;

    var runner = this;
    runner.context.world = world;
    API && Object.keys(API).forEach(function (property) {
        runner.context[property] = API[property];
    });

    try {
        return vm.runInContext('strategy.move(world)', this.context, {
                timeout: timeout,
                displayErrors: false,
            }
        ) || {};
    } catch (e) {
        this.last_error = e;
        return;
    }
}


///////////////////////////////////////////////////////////////////////////////
/// The Game class ////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


function Game(rules, RunnerClass) {
    this.Runner = RunnerClass || VMStrategyRunner;
    this.timeouts = {
        compile:    1000,
        init:       500,
        move:       200,
    };

    this.rules = Rules.fromObject(rules);
    this.bots = [];
}

Game.prototype.addStrategy = function (strategy_code, id) {
    var Runner = this.Runner;
    var strategy = new Runner(strategy_code, this.timeouts.compile);

    id = typeof id !== 'undefined' ? id : this.bots.length;
    this.bots[id] = {
        id:         id,
        strategy:   strategy,
        error:      strategy.last_error,
    };
};

Game.prototype.tick = function (world, shuffle_bots) {
    world = world || {};
    var game = this;
    var API = game.rules.getAPI();

    if (shuffle_bots) {
        shuffle_array(game.bots);
    }

    game.bots.forEach(function (bot) {
        if (bot.error) {
            return;
        }

        var _API = clone(API);
        var _world = clone(world);
        _world.myID = bot.id;

        var move_data = bot.strategy.move(_world, _API, game.timeouts.move);
        bot.error = bot.strategy.last_error;

        if (!bot.error) {
            game.rules.movePlayer(world, bot.id, move_data);
        }
    });

    game.rules.updateWorld(world);
};

Game.prototype.run = function (options) {
    options = options || {};
    var ticks = typeof options.ticks !== 'undefined' ? options.ticks : 1000;
    var shuffle_bots = !!options.shuffle_bots;

    var game = this;
    var world = {};
    var record = [];
    var API = game.rules.getAPI();

    game.rules.initWorld(world);
    game.bots.forEach(function (bot) {
        var init_data = bot.strategy.init(clone(API), game.timeouts.init);
        bot.error = bot.strategy.last_error;
        game.rules.initPlayer(world, bot.id, init_data);
    });

    while (ticks-- > 0) {
        game.tick(world, options.shuffle_bots);
        record.push({
            world: clone(world),
            offline: game.bots.reduce(function(offline, bot) {
                offline[bot.id] = typeof bot.error !== 'undefined';
                return offline;
            }, {}),
        });
    }

    record.result = game.rules.getResult(world);
    return record;
};



///////////////////////////////////////////////////////////////////////////////
/// Exports ///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


module.exports.Rules = Rules;
module.exports.Game  = Game;


// TEST

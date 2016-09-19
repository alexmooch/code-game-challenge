const clone = require('clone');


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

    // NOTE: Any possible exception thrown by strategy must be catched and
    // saved under this.last_error
    // See VMStrategyRunner as example below
}

StrategyRunner.prototype.init = function (API, world, timeout) {
    // return init_data (see: Rules.METHODS.initPlayer)

    // NOTE: Should return an empty object if strategy.init() returned nothing
    // but didn't crash, undefined otherwise
    // See VMStrategyRunner as example below
}

StrategyRunner.prototype.move = function (API, world, timeout) {
    // return move_data (see: Rules.METHODS.movePlayer)

    // NOTE: Should return an empty object if strategy.move() returned nothing
    // but didn't crash, undefined otherwise
    // See VMStrategyRunner as example below
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

VMStrategyRunner.prototype._run = function (code, API, world, timeout) {
    if (this.last_error) {
        return;
    }

    var runner = this;
    runner.context.world = world;
    if (typeof API === 'object') {
        Object.keys(API).forEach(function (property) {
            runner.context[property] = API[property];
        });
    }

    try {
        return vm.runInContext(code, this.context, {
            timeout: timeout,
            displayErrors: false,
        }) || {};
    } catch (e) {
        this.last_error = e;
        // return;
    }
}

VMStrategyRunner.prototype.init = function (API, timeout) {
    return this._run('strategy.init()', API, undefined, timeout);
}

VMStrategyRunner.prototype.move = function (world, API, timeout) {
    return this._run('strategy.move(world)', API, world, timeout);
}


///////////////////////////////////////////////////////////////////////////////
/// The Game class ////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


function Game(rules, RunnerClass) {
    this.Runner = RunnerClass || typeof VMStrategyRunner !== 'undefined' ?
        VMStrategyRunner : StrategyRunner;
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
    };
};

Game.prototype.init = function (options) {
    options = options || {};

    var game = this;
    var world = {};
    var API = game.rules.getAPI();

    game.rules.initWorld(world);
    game.bots.forEach(function (bot) {
        var init_intent = bot.strategy.init(clone(API), game.timeouts.init);
        game.rules.initPlayer(world, bot.id, init_intent);
    });

    return world;
}

Game.prototype.tick = function (world, shuffle_bots) {
    world = world || {};
    var game = this;
    var API = game.rules.getAPI();

    if (shuffle_bots) {
        shuffle_array(game.bots);
    }

    game.bots.forEach(function (bot) {
        if (bot.strategy.last_error) {
            return;
        }

        var _API = clone(API);
        var _world = clone(world);
        _world.myID = bot.id;

        var move_data = bot.strategy.move(_world, _API, game.timeouts.move);

        if (!bot.strategy.last_error) {
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
    var record = { states: [] };
    var API = game.rules.getAPI();
    var world = game.init();

    while (ticks-- > 0) {
        game.tick(world, shuffle_bots);
        record.states.push({
            world: clone(world),
            offline: game.bots.reduce(function(offline, bot) {
                if (typeof bot.strategy.last_error !== 'undefined') {
                    offline.push(bot.id);
                }
                return offline;
            }, []),
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
module.exports.StrategyRunner = StrategyRunner;

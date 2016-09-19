const CGC = require('../../cgc');
const API = require('./api');

function clamp(value, min, max) {
    return value < min ? min : (value > max ? max : value);
}

var globals = {
    HB: API,
}

var rules = new CGC.Rules();

rules.getAPI = function() {
    return globals;
}

rules.initWorld = function(world) {
    // TODO: read config from file ?

    world.WIDTH = 800;
    world.HEIGHT = 600;
    world.BALL_RAIDUS = 50;
    world.BALL_FREEZE_TIME = 100;
    world.PLAYER_RAIDUS = 30;

    world.currentTick = 0;

    world.players = [];
    world.score = [0, 0];

    world.ball = new API.GameObject(
        world.BALL_RAIDUS,
        new API.Point(
            world.WIDTH / 4 + Math.floor(Math.random() * 2) * world.WIDTH / 2,
            world.HEIGHT / 2
        )
    );
    world.ball.freeze_time = world.BALL_FREEZE_TIME;
}

rules.initPlayer = function(world, playerID, name) {
    world.players[playerID] = new API.GameObject(
        world.PLAYER_RAIDUS,
        new API.Point(
            world.WIDTH / 4 + playerID * world.WIDTH / 2,
            world.PLAYER_RAIDUS
        )
    );
    world.players[playerID].name = typeof name === 'string' ? name :
        'Bot #' + (playerID + 1);
}

rules.movePlayer = function(world, playerID, intent) {
    intent = intent || {};
    var player = world.players[playerID];

    if (intent.action === API.Action.JUMP &&
    player.position.y === player.radius) {
        player.speed.y = 10;
    }

    if (intent.action === API.Action.MOVE) {
        player.speed.x = clamp(intent.x_speed || 0, -1, 1);
    }
}

rules.updateWorld = function(world) {
    var w = world;

    const GRAVITY = 0.3;
    const AIR_RESISTANCE = 0.02;
    const SPEED_LOSS = 0.1;
    const COLLISION_POWER = 2;
    const SPEED_KOEFF = 3;

    ++w.currentTick;

    // Update players

    w.players.forEach(function(player, id) {
        var shift = id * w.WIDTH / 2;

        if (player.position.y === player.radius) {
            player.position.x = clamp(
                player.position.x + SPEED_KOEFF * player.speed.x,
                shift + player.radius,
                shift + w.WIDTH / 2 - player.radius
            );
        }

        player.position.y += player.speed.y;

        if (player.position.y < player.radius) {
            player.position.y = player.radius;
            player.speed.y = 0;
        }

        player.speed.y -= GRAVITY;
        player.speed.x *= (1 - AIR_RESISTANCE);
    });

    // Update ball

    var ball = w.ball;

    if (ball.freeze_time) {
        --ball.freeze_time;
    } else {
        ball.position.x += ball.speed.x;
        ball.position.y += ball.speed.y;

        var x = clamp(ball.position.x, ball.radius, w.WIDTH - ball.radius);
        if (ball.position.x !== x) {
            ball.speed.x = -ball.speed.x * (1 - SPEED_LOSS);
        }
        ball.position.x = x;

        // var y = ball.position.y = clamp(ball.position.y, ball.radius, Infinity);
        // if (ball.position.y !== y) {
        //     ball.speed.y = -ball.speed.y * (1 - SPEED_LOSS);
        // }
        // ball.position.y = y;

        if (ball.position.y < ball.radius) {
            var winner = ball.position.x > w.WIDTH / 2 ? 0 : 1;

            ++w.score[winner];

            ball.position = new API.Point(
                w.WIDTH / 4 + (1 - winner) * w.WIDTH / 2,
                w.HEIGHT / 2
            );
            ball.speed = new API.Point();
            ball.freeze_time = w.BALL_FREEZE_TIME;

            w.players.forEach(function(player, id) {
                player.position = new API.Point(
                    w.WIDTH / 4 + id * w.WIDTH / 2,
                    player.radius
                );
                player.speed = new API.Point();
            });
        }

        ball.speed.y -= GRAVITY;
        ball.speed.x *= (1 - AIR_RESISTANCE);
    }

    // Check collisions

    w.players.forEach(function(player, id) {
        var distance = player.distanceTo(ball);
        var min_dist = player.radius + ball.radius;

        if (distance < min_dist) {
            ball.freeze_time = 0;

            var k = (min_dist - distance) * COLLISION_POWER;
            var ds = new API.Point(
                ball.position.x - player.position.x,
                ball.position.y - player.position.y
            ).normalized();

            // a bit randomness
            var angle = Math.random() * Math.PI / 180;
            var rx = ds.x * Math.cos(angle) - ds.y * Math.sin(angle);
            var ry = ds.x * Math.sin(angle) + ds.y * Math.cos(angle);
            ds.x = rx;
            ds.y = ry;

            ball.speed.x += ds.x * k;
            ball.speed.y += ds.y * k;

            ball.speed.x *= (1 - SPEED_LOSS);
            ball.speed.y *= (1 - SPEED_LOSS);

            // move ball away

            ball.position = new API.Point(
                player.position.x + ds.x * min_dist,
                player.position.y + ds.y * min_dist
            );
        }
    });
}

rules.getResult = function(world) {
    return {
        'winner': world.score[0] > world.score[1] ? 1 : (
            world.score[1] > world.score[0] ? 2 : undefined
        ),
        'score': world.score,
    }
}

module.exports = rules;

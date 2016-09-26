const CGC = require('../../cgc');
const API = require('./api');

function clamp(value, min, max) {
    return value < min ? min : (value > max ? max : value);
}

function resolveCollision(player, ball) {
    const RESTITUTION = 0.25;

    d = ball.position.sub(player.position);
    distance_squared = d.dot(d);

    radii_sum = player.radius + ball.radius;
    radii_sum_squared = radii_sum * radii_sum;

    if (distance_squared > radii_sum_squared) {
        // too far away
        return false;
    }

    distance = Math.sqrt(distance_squared);
    normal = d.div(distance); // ncoll
    penetration = radii_sum - distance; // dcoll

    imp = 0;
    imb = 1;

    separation_vec = normal.mul(penetration / (imp + imb));

    player.position = player.position.sub(separation_vec.mul(imp));
    ball.position = ball.position.add(separation_vec.mul(imb));

    combined_velocity = ball.speed.sub(player.speed); // vcoll
    impact_speed = combined_velocity.dot(normal); // vn

    if (impact_speed > 0) {
        // moving away, collide but not reflect velocity
        return true;
    }

    impulse = -(1 + RESTITUTION) * impact_speed / (imp + imb);
    impulse_vector = normal.mul(impulse);

    impulse_vector = impulse_vector.rotate(Math.random() * Math.PI / 180);

    player.speed = player.speed.sub(impulse_vector.mul(imp));
    ball.speed = ball.speed.add(impulse_vector.mul(imb));

    return true;
}

var rules = new CGC.Rules();

rules.getAPI = function() {
    return API;
}

function endRound(world, winner) {
    var w = world;
    var ball = w.ball;

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
        player.touchesLeft = w.MAX_TOUCHES;
    });
}

rules.initWorld = function(world) {
    // TODO: read config from file ?

    world.WIDTH = 800;
    world.HEIGHT = 600;
    world.BALL_RAIDUS = 50;
    world.BALL_FREEZE_TIME = 50;
    world.PLAYER_RAIDUS = 30;
    world.PLAYER_MAX_SPEED = 4;
    world.MAX_TOUCHES = 2;

    world.currentTick = 1;

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

    rules._justTouched = [false, false];
}

rules.initPlayer = function(world, playerID, name) {
    world.players[playerID] = new API.GameObject(
        world.PLAYER_RAIDUS,
        new API.Point(
            world.WIDTH / 4 + playerID * world.WIDTH / 2,
            world.PLAYER_RAIDUS
        )
    );
    world.players[playerID].touchesLeft = world.MAX_TOUCHES;
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
        var s = world.PLAYER_MAX_SPEED;
        player.speed.x = clamp(intent.x_speed || 0, -s, s);
    }
}

rules.updateWorld = function(world) {
    var w = world;

    if (typeof rules.winner !== 'undefined') {
        endRound(w, rules.winner);
        delete rules.winner;
        return;
    }

    const GRAVITY = 0.4;
    const AIR_RESISTANCE = 0.02;
    const SPEED_LOSS = 0.5;

    ++w.currentTick;

    // Update players

    w.players.forEach(function(player, id) {
        var shift = id * w.WIDTH / 2;

        if (player.position.y === player.radius) {
            player.position.x = clamp(
                player.position.x + player.speed.x,
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
        player.speed.y *= (1 - AIR_RESISTANCE);
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
            return endRound(w, ball.position.x > w.WIDTH / 2 ? 0 : 1);
        }

        ball.speed.y -= GRAVITY;
        ball.speed.x *= (1 - AIR_RESISTANCE);
    }

    // Check collisions

    w.players.forEach(function(player, id) {
        if (resolveCollision(player, ball) && !rules._justTouched[id]) {
            rules._justTouched[id] = true;
            if (--player.touchesLeft < 0) {
                rules.winner = 1 - id;
            }
            w.players[1 - id].touchesLeft = w.MAX_TOUCHES;
        } else {
            rules._justTouched[id] = false;
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

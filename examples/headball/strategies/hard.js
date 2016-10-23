'use strict';

var Strategy = {
    init: function() {
        return 'Hard Bot';
    },
    move: function(world) {
        var me = world.players[world.myID];
        var ball = world.ball;

        var dist = ball.position.x - me.position.x;
        dist += (world.myID ? 1 : -1) * 0.95 * me.radius;

        if ((world.myID === 0) ===  (ball.position.x > world.WIDTH / 2)) {
            var k = 0.35,
                a = world.WIDTH * (1 - k) / 2,
                b = k * world.WIDTH;
            dist = a + b * world.myID - me.position.x;
        }

        var decision = new Decision(Action.MOVE, dist);
        if (me.distanceTo(ball) < 2.05 * ball.radius) {
            decision.action = Action.JUMP;
        }

        return decision;
    }
};

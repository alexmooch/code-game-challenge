'use strict';

var Strategy = {
    init: function() {
        return 'Medium Bot';
    },
    move: function(world) {
        var me = world.players[world.myID];
        var ball = world.ball;

        var dist = ball.position.x - me.position.x;
        dist += (world.myID ? 1 : -1) * 0.9 * me.radius;

        if ((world.myID === 0) ===  (ball.position.x > world.WIDTH / 2)) {
            dist = (3 + 2 * world.myID) * world.WIDTH / 8 - me.position.x;
        }

        var decision = new Decision(Action.MOVE, dist);
        if (me.distanceTo(ball) < 2.15 * ball.radius) {
            decision.action = Action.JUMP;
        }

        return decision;
    }
};

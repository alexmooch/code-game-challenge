'use strict';

var Strategy = {
    init: function() {
        return 'Easy Bot';
    },
    move: function(world) {
        var me = world.players[world.myID];
        var ball = world.ball;

        var dist = ball.position.x - me.position.x;
        dist += (world.myID ? 1 : -1) * 0.75 * me.radius;

        var decision = new Decision(Action.MOVE, dist);
        if (me.distanceTo(ball) < 2 * ball.radius) {
            decision.action = Action.JUMP;
        }

        return decision;
    }
};

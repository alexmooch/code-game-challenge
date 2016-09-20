'use strict';

var Strategy = {
    init: function() {
        return 'Basic bot';
    },
    move: function(world) {
        var me = world.players[world.myID];
        var ball = world.ball;

        var dist = ball.position.x - me.position.x;
        dist += (world.myID ? 1 : -1) * 0.8 * me.radius;

        var decision = new Decision(Action.MOVE, dist);
        if (me.distanceTo(ball) < 3 * me.radius) {
            decision.action = Action.JUMP;
        }

        return decision;
    }
};

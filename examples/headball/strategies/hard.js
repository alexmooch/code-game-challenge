'use strict';

var Strategy = {
    init: function() {
        return 'Jump Bot';
    },
    move: function(world) {
        var me = world.players[world.myID];
        var ball = world.ball;

        var decision = Action.NONE;
        if (me.position.x + me.radius > ball.position.x - ball.radius &&
        me.position.x - me.radius < ball.position.x + ball.radius) {
            decision = Action.JUMP;
        }

        return new Decision(decision);
    }
};

'use strict';

var Strategy = {
    init: function() {},
    move: function(world) {
        if (Math.random() > 0.999) throw new Error('I\'m dead');
        var num = Math.floor(Math.random() * 3);
        // can use provided API here:
        return new RPS.Intent(num);
    }
};

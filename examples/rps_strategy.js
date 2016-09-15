'use strict';

var Strategy = {
    init: function() {},
    move: function(world) {
        var num = Math.floor(Math.random() * 3);
        // can use provided API here:
        return new RPS.Intent(num);
    }
};

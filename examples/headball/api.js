var Action = {
    NONE: 0,
    MOVE: 1,
    JUMP: 2,
}

function Decision(action, x_speed) {
    this.action = action;
    this.x_speed = x_speed;
}

function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Point.prototype.length2 = function() {
    return this.x * this.x + this.y * this.y;
};

Point.prototype.length = function() {
    return Math.sqrt(this.length2());
};

Point.prototype.add = function(other) {
    return new Point(this.x + other.x, this.y + other.y);
};

Point.prototype.sub = function(other) {
    return new Point(this.x - other.x, this.y - other.y);
};

Point.prototype.mul = function(k) {
    return new Point(this.x * k, this.y * k);
};

Point.prototype.div = function(k) {
    return new Point(this.x / k, this.y / k);
};

Point.prototype.normalize = function() {
    return this.div(this.length());
};

Point.prototype.dot = function(other) {
    return this.x * other.x + this.y * other.y;
};

Point.prototype.rotate = function(angle) {
    var rx = this.x * Math.cos(angle) - this.y * Math.sin(angle);
    var ry = this.x * Math.sin(angle) + this.y * Math.cos(angle);

    return new Point(rx, ry);
}

function GameObject(radius, position, speed) {
    this.radius = radius || 0;
    this.position = position || new Point();
    this.speed = speed || new Point();
}

GameObject.prototype.distanceTo = function(other) {
    if (other instanceof GameObject) {
        return this.position.sub(other.position).length();
    }
};

GameObject.prototype.intersects = function(other) {
    if (other instanceof GameObject) {
        var r_sum = this.radius + other.radius;
        var dist2 = this.position.sub(other.position).length2();
        return dist2 < r_sum * r_sum;
    }
};

var API = {
    Action: Action,
    Decision: Decision,
    Point: Point,
    GameObject: GameObject,
}

if (module && module.exports) {
    module.exports = API;
}

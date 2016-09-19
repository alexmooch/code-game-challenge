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

Point.prototype.normalized = function() {
    var l = Math.sqrt(this.x * this.x + this.y * this.y);
    return new Point(this.x / l, this.y / l);
};

function GameObject(radius, position, speed) {
    this.radius = radius || 0;
    this.position = position || new Point();
    this.speed = speed || new Point();
}

GameObject.prototype.distanceTo = function(other) {
    if (other instanceof GameObject) {
        var x = this.position.x - other.position.x;
        var y = this.position.y - other.position.y;

        return Math.sqrt(x * x + y * y);
    }
};

GameObject.prototype.intersects = function(other) {
    if (other instanceof GameObject) {
        return this.distanceTo(other) < this.radius + other.radius;
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

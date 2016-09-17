function Intent(value) {
    this._value = value;
}

Intent.prototype.getValue = function() {
    return this._value;
};


module.exports.Intent = Intent;

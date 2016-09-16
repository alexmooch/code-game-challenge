const express = require('express');
const path = require('path');

var app = express();
app.configure(function () {
    // app.use(express.logger('dev'));
    app.use(express.static(path.join(__dirname, 'public')));
});

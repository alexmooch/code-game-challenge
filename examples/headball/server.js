const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const game = require('./game');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.sendFile('index.html');
});

app.post('/game', function (req, res) {
    if (!req.body || !req.body.first || !req.body.second) {
        return res.sendStatus(400);
    }

    const f_str = path.join(__dirname, '.strategies', req.body.first);
    const s_str = path.join(__dirname, '.strategies', req.body.second);

    fs.readFile(f_str, function (err, first) {
        if (err) {
            res.status(404).send('Strategy not found: ' + req.body.first);
        } else {
            fs.readFile(s_str, function (err, second) {
                if (err) {
                    res.status(404).json(
                        'Strategy not found: ' + req.body.second
                    );
                } else {
                    var result = game(first, second, { ticks: 4000 });
                    res.json(result);
                }
            });
        }
    });
});

app.listen(3000, function () {
    console.log('Listening on port 3000');
});

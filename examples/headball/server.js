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

app.get('/strategy/:name', function(req, res) {
    var str_path = path.join(__dirname, 'strategies', req.params.name + '.js');
    fs.readFile(str_path,'utf8',  function(err, text) {
        if (err) {
            res.status(404).send('Strategy not found: ' + req.params.name);
        } else {
            res.send(text);
        }
    });
});

app.post('/game', function(req, res) {
    if (!req.body || !req.body.first || !req.body.second) {
        res.sendStatus(400);
    }

    new Promise(function(resolve, reject) {
        resolve(game([req.body.first, req.body.second], { ticks: 4000 }));
    }).then(function(result) {
        res.json(result);
    }).catch(function(err) {
        res.status(500).send(err.message);
    });
});

app.listen(3000, function () {
    console.log('Listening on port 3000');
});

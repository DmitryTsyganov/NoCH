var WebSocketServer = new require('ws');

//connected players
var players = {};
var playersTotal = 0;

//WebSocket-server on 8085
var webSocketServer = new WebSocketServer.Server({
    port: 8085
});

webSocketServer.on('connection', function(ws) {

    var id = Math.random();

    var Player = require('./player');

    player = new Player(id, ws);

    players[id] = player;

    console.log('new player ' + id +
        ', players total ' + ++playersTotal);

    ws.on('message', function(message) {
        //console.log('player ' + id + message);

        for (var key in players) {
            players[key].ws.send(handleInput(message));
        }
    });

    ws.on('close', function () {
        console.log('player disconnected ' + id);
        delete players[id];
        --playersTotal;
    });

    function handleInput(message) {

        var recievedData = JSON.parse(message);
        players[id].position.x = recievedData.mouseX;
        players[id].position.y = recievedData.mouseY;

        var response = { "total": playersTotal - 1};

        response["player"] = {
            x: players[id].position.x,
            y: players[id].position.y
        };

        var i = 0;
        for (var key in players) {
            if (key == id) continue;

            var position = {
                x: players[key].position.x,
                y: players[key].position.y
            };
            response["position" + ++i] = position;
        }
        /*game logic :)*/
        return JSON.stringify(response);
    }
});


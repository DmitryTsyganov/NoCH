var WebSocketServer = new require('ws');

var params = require("./db");
params.connect();

//connected players
var players = [];
var playersTotal = 0;

//WebSocket-server on 8085
var webSocketServer = new WebSocketServer.Server({
    port: 8085
});

webSocketServer.on('connection', function(ws) {

    console.log('new player ' + id +
        ', players total ' + playersTotal);

    var id = playersTotal++;

    var width = params.getParameter("gameWidth");
    var height = params.getParameter("gameHeight");

    var Player = require('./player');

    var player = new Player(id, ws, width, height);

    var defaultPosition = {
        /*"x": getRandomArbitary(width * 0.49 , width * 0.51),
        "y": getRandomArbitary(height * 0.49, height * 0.51)*/

        //testing example
        "x": width / 2 + 120 * playersTotal,
        "y": height / 2
    };

    player.setPosition(defaultPosition);

    players[id] = player;

    console.log(players[id].position);

    ws.on('message', function(message) {
        //console.log('player ' + id + message);

        var parsedMessage = JSON.parse(message);

        if ('x' in parsedMessage) {
            player.setResolution(parsedMessage);
            //console.log(message);
        }

        if ('mouseX' in parsedMessage) {
            var localCoords = player.getLocalPosition();

            //console.log(parsedMessage.mouseX);
            //console.log(localCoords.x);

            var mouseX = parsedMessage.mouseX - localCoords.x;
            var mouseY = parsedMessage.mouseY - localCoords.y;

            //console.log(mouseX);
            //console.log(mouseY);

            move(id, mouseX, mouseY);

            //console.log(players[id].position);

            /*for (var i = 0; i < players.length; ++i) {
                if (players[i]) {
                    players[i].ws.send(handleInput(parsedMessage));
                }
            }*/

            player.ws.send(handleInput(parsedMessage));
        }
    });

    ws.on('close', function() {
        console.log('player disconnected ' + id);
        delete players[id];
        //--playersTotal;
    });

    function handleInput(recievedData) {

        //var response = { "total": playersTotal - 1 };

        //console.log(players);
        var playersInScreen = players.filter(function(value) {
            return true;
        });
        //console.log(playersInScreen);

        var response = {};

        response["player"] = {
            x: players[id].position.x,
            y: players[id].position.y
        };

        var i = 0;
        for (var j = 0 ; j < playersInScreen.length; ++j) {
            if (playersInScreen[j].id == id) continue;

            //console.log(key.position);

            /*var position = {
                x: players[key].position.x,
                y: players[key].position.y
            };*/
            response["position" + ++i] =
                toLocalCS(playersInScreen[j].position, player);
        }
        response["total"] = i;
        //console.log(i);
        /*game logic :)*/
        return JSON.stringify(response);
    }

    function move(id, mx, my) {

        var defaultMovement = params.getParameter("defaultSpeed");

        //console.log(mx);
        //console.log(my);

        players[id].addToPos('x', defaultMovement *
            mx /Math.sqrt(mx * mx + my * my));
        /*console.log(defaultMovement *
            defaultMovement * mx /(mx * mx + my * my));*/
        players[id].addToPos('y', defaultMovement *
            my /Math.sqrt(mx * mx + my * my));
        /*console.log(defaultMovement *
            defaultMovement * my /(mx * mx + my * my));*/

        console.log("player " + id + " now at x "
            + players[id].position.x + ", y " + players[id].position.y);
    }

    /**
     * @return {boolean}
     */
    function InScreen(eachPlayer) {
        return (eachPlayer.position.x < player.position.x + player.resolution.width / 2 &&
        eachPlayer.position.x > player.position.x - player.resolution.width / 2 &&
        eachPlayer.position.y < player.position.y + player.resolution.height / 2 &&
        eachPlayer.position.y > player.position.y - player.resolution.height / 2);
    }

});

function getRandomArbitary(min, max) {
    return Math.random() * (max - min) + min;
}

function toLocalCS(coords, player) {
    //console.log(coords);
    return {
        x: coords.x - (player.position.x - player.resolution.width / 2),
        y: coords.y - (player.position.y - player.resolution.height / 2)
    };
}


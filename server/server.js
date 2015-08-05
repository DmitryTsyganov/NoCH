var WebSocketServer = new require('ws');

var memwatch = require("memwatch");
var params = require("db");
params.connect();

//creating PhysicsWorld
var Matter = require('matter-js/build/matter.js');

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite;

var elements = params.getParameter("elements");

var engine = Engine.create();

engine.world.gravity.y = 0;

//parts of the border
var border = [];

//Protons that will be deleted at next update
var ghosts = [];

//connected players
var players = [];

//free elements
var Garbage = require("./garbage");
var garbage = [];

createGarbage(100);
createFullBorder(params.getParameter("gameDiameter") / 2);

var freeProtons = [];

//WebSocket-server on 8085
var webSocketServer = new WebSocketServer.Server({
    port: 8085
});

console.log('The server is running');

webSocketServer.on('connection', function(ws) {

    var mapRadius = params.getParameter("gameDiameter") / 2;

    var minAreaRadius = 0;
    var maxAreaRadius = 240;

    var defaultPosition = getRandomPositionInside(mapRadius,
                                minAreaRadius, maxAreaRadius);

    var Player = require('./player');

    var player = new Player(ws, defaultPosition, engine, "C");

    var id = addToArray(players, player);

    player.body.number = player.body.playerNumber = id;

    console.log('new player ' + id +
     ', players total ' + players.length);

    /*player.ws.emit("np", JSON.stringify({ "id": player.body.id,
                                            "c": "white",
                                            "e": player.body.element}));*/

    var colors = ["green", "blue", "yellow", "purple", "orange"];
    player.color = colors[Math.ceil(Math.random() * 4)];

    for (var i = 0; i < players.length; ++i) {
        if (players[i]) {
            try {
                players[i].ws.send(JSON.stringify({ "id": player.body.id,
                    "c": player.color,
                    "e": player.body.element}));
                player.ws.send(JSON.stringify({ "id": players[i].body.id,
                    "c": players[i].color,
                    "e": players[i].body.element}));
            } catch (e) {
                console.log('Caught ' + e.name + ': ' + e.message);
            }
        }
    }

    ws.on('message', function(message) {
        //console.log('player ' + id + " says " + message);

        var parsedMessage = JSON.parse(message);

        if ('x' in parsedMessage) {
            player.setResolution(parsedMessage);
            //console.log("Now resolution is " + message);
        }

        if ('mouseX' in parsedMessage) {

            var mouseX = parsedMessage.mouseX - player.getLocalPosition().x;
            var mouseY = parsedMessage.mouseY - player.getLocalPosition().y;

            player.applyVelocity(mouseX, mouseY);
        }

        if ('shotX' in parsedMessage) {

            var shotPos = {
                x: parsedMessage.shotX - player.getLocalPosition().x,
                y: parsedMessage.shotY - player.getLocalPosition().y
            };
            player.shoot(parsedMessage.particle, shotPos, freeProtons, engine);
        }
    });

    ws.on('close', function () {
        console.log('player exited ' + id);
        deletePlayer();
    });

    ws.on('error', function () {
        console.log('player disconnected ' + id);
        deletePlayer();
    });

    function deletePlayer() {
        var lastResort = player.body.position;
        var elem = player.body.element;
        player.die(engine);
        World.remove(engine.world, player.body);
        delete players[id];
        var playerGarbage = new Garbage(lastResort, engine, elem);
        garbage.push(playerGarbage);
        playerGarbage.body.number = garbage.indexOf(playerGarbage);
    }

});

//creates given amount of garbage
function createGarbage(quantity) {

    var diameter = params.getParameter("gameDiameter");

    for (var j = 0; j < quantity; ++j) {
        var element = elements[Math.ceil(getRandomArbitrary(-1, 9))];

        var OFFSET_BORDER = 40;
        var OFFSET_PLAYER = 400;
        var position = getRandomPositionInside(diameter / 2, OFFSET_PLAYER,
                                                diameter / 2 - OFFSET_BORDER);

        var singleGarbage = new Garbage(position, engine, element);

        garbage.push(singleGarbage);
        singleGarbage.body.number = garbage.indexOf(singleGarbage);
    }
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomPositionInside(mapRadius, areaRadiusMin, areaRadiusMax) {
    var angle = Math.random() * 2 * Math.PI;

    var radius = getRandomArbitrary(areaRadiusMin, areaRadiusMax);
    return { x: mapRadius + radius * Math.sin(angle),
            y: mapRadius + radius * Math.cos(angle)
    };
}

function calculateDistance(pos1, pos2) {
    return Math.sqrt((pos1.x - pos2.x) * (pos1.x - pos2.x)
                    + (pos1.y - pos2.y) * (pos1.y - pos2.y));
}

//inserts obj in first available position in array. returns position
function addToArray(array, obj) {
    var i = 0;
    while(array[i]) ++i;
    array[i] = obj;
    return i;
}

//returns coordinates equivalent in player's local CS
function toLocalCS(coordinates, player) {
    return {
        x: Math.ceil(coordinates.x - (player.body.position.x
                            - player.resolution.width / 2)),
        y: Math.ceil(coordinates.y - (player.body.position.y
                            - player.resolution.height / 2))
    };
}

//collects all required data for given player
function createMessage(id) {

    var response = {};

    response["player"] = {
        x: Math.ceil(players[id].body.position.x),
        y: Math.ceil(players[id].body.position.y)
    };

    var bonds = [];
    (players.map(function(player) {
        return player.getBondsPositions();
    })).forEach(function(obj) {
            bonds = bonds.concat(obj);
    });

    for (var i = 0; i < bonds.length; i += 2) {
        if (!dotInScreen.call(players[id], bonds[i] ||
            !dotInScreen.call(players[id], bonds[i + 1]))) {
            bonds.splice(i, 2);
        }
    }

    response["bonds"] = parseCoordinates(bonds.map(function(obj) {
                        return toLocalCS(obj, players[id]); }));

    response["players"] =
        parseCoordinates(players.filter(inScreen,
            players[id]).map(function(player) {
            var pos = toLocalCS(player.body.position, players[id]);
            return { id: player.body.id, x: Math.ceil(pos.x), y: Math.ceil(pos.y) };
        }));

    var particlesInScreen = ((garbage.filter(inScreen, players[id])))
                            .concat(freeProtons.filter(inScreen, players[id]));

    for (var j = 0; j < elements.length; ++j) {
        addElements(id, response, particlesInScreen, elements[j]);
    }
    addElements(id, response, particlesInScreen, "p");
    addElements(id, response, particlesInScreen, "n");

    response["border"] = parseCoordinates((border.filter(inScreen,
                                            players[id])).map(function(wall) {
        var pos = toLocalCS(wall.body.position, players[id]);
        return { x: Math.ceil(pos.x), y: Math.ceil(pos.y),
                    angle: wall.body.angle.toFixed(3) };
    }));

    return JSON.stringify(response);
}

function addElements(id, object, array, elementName) {
    object[elementName] = parseCoordinates(array.filter(isElement,
                            elementName).map(function(particle) {
        return toLocalCS(particle.body.position, players[id]);
    }));
}

function parseCoordinates(array) {
    var parsedArray = [];
    for (var i = 0; i < array.length; ++i) {
        /*parsedArray.push(array[i].x);
        parsedArray.push(array[i].y);*/
        for (var key in array[i]) {
            parsedArray.push(array[i][key]);
        }
    }
    return parsedArray;
}

//checks if object is in screen of current player, current player is 'this'
/**
 * @return {boolean}
 */
function inScreen(object) {
    return (object.body.position.x - object.body.circleRadius <
        this.body.position.x + this.resolution.width / this.body.coefficient / 2 &&
        object.body.position.x + object.body.circleRadius >
        this.body.position.x - this.resolution.width / this.body.coefficient / 2 &&
        object.body.position.y - object.body.circleRadius <
        this.body.position.y + this.resolution.height / this.body.coefficient / 2 &&
        object.body.position.y + object.body.circleRadius >
        this.body.position.y - this.resolution.height / this.body.coefficient / 2);
}

function dotInScreen(dot) {
    return (dot.x < this.body.position.x + this.resolution.width / this.body.coefficient / 2 &&
    dot.x > this.body.position.x - this.resolution.width / this.body.coefficient / 2 &&
    dot.y < this.body.position.y + this.resolution.height / this.body.coefficient / 2 &&
    dot.y > this.body.position.y - this.resolution.height / this.body.coefficient / 2);
}

function isElement(object) {
    return object.body.element == this;
}

function spotQuarter(pos) {
    if (pos.x >= 0 && pos.y >= 0) return 1;
    if (pos.x <= 0 && pos.y >= 0) return 2;
    if (pos.x <= 0 && pos.y <= 0) return 3;
    if (pos.x >= 0 && pos.y <= 0) return 4;
}

//returns multipliers for next quarter of coordinate plane
function findNextQuarter(quarter) {
    switch (quarter) {
        case 1:
            return {x: -1, y: 1};
            break;
        case 2:
            return {x: -1, y: -1};
            break;
        case 3:
            return {x: 1, y: -1};
            break;
        case 4:
            return {x: 1, y: 1};
            break;
    }
}

//returns position for next element in player's coordinate system
function findAngle(playerPosition, garbagePosition, playerAngle) {
    var hypotenuse = calculateDistance(playerPosition, garbagePosition);
        var cathetus = calculateDistance({ x: playerPosition.x, y: garbagePosition.y },
                                            garbagePosition);
        var cosine = cathetus / hypotenuse;
        var angle = Math.acos(cosine);

        var quarter = spotQuarter({ x: garbagePosition.x - playerPosition.x,
                                    y: garbagePosition.y - playerPosition.y });

        switch (quarter) {
            case 2:
                angle = Math.PI - angle;
                break;
            case 3:
                angle = Math.PI + angle;
                break;
            case 4:
                angle = 2 * Math.PI - angle;
        }

    return angle - playerAngle;
    /*{ x: (playerRadius + newRadius) *
     Math.cos(angle) / Math.cos(playerAngle),
     y: (playerRadius + newRadius) *
     Math.sin(angle) / Math.sin(playerAngle) };*/
}


//creates Bond between player and garbage
function createBond(playerBody, garbageBody) {
    if (playerBody.getFreeBonds() && garbageBody.getFreeBonds()) {

        ++playerBody.chemicalBonds;
        ++garbageBody.chemicalBonds;

        if (playerBody.previousAngle !== undefined) {

            /*var pos1 = playerBody.position;
            var pos2 = prev.position;
            var destination = findAngle(pos1, pos2, playerBody.totalBonds,
                                            garbageBody.circleRadius, prev.circleRadius);

            Body.translate(garbageBody, {
                x: destination.x + pos1.x - garbageBody.position.x,
                y: destination.y + pos1.y - garbageBody.position.y });*/
            var i = 0;
            var N = 15;     // Number of iterations
            garbageBody.collisionFilter.mask = 0x0008;      // turn off collisions
            var angle = playerBody.previousAngle + 2 * Math.PI / playerBody.totalBonds;
            /*var destination = findAngle(playerBody.position, prev.position,
                playerBody.totalBonds, garbageBody.circleRadius,
                playerBody.circleRadius, playerBody.angle);*/
            playerBody.previousAngle = angle;
            if (playerBody.id == playerBody.playerNumber) {
                garbageBody.constraintAngle = angle;    //for player/index.js 243
            }

            var intervalID = setInterval(function () {
                var pos1 = playerBody.position;
                //var pos2 = prev.position;

                var delta = {
                    x: ((playerBody.circleRadius + garbageBody.circleRadius)
                        * Math.cos(angle + playerBody.angle)
                        + pos1.x - garbageBody.position.x) / (N - i),
                    y: ((playerBody.circleRadius + garbageBody.circleRadius)
                        * Math.sin(angle + playerBody.angle)
                        + pos1.y - garbageBody.position.y) / (N - i)
                };

                Body.translate(garbageBody, {
                    x: delta.x ,
                    y: delta.y });

                if (++i === N) {
                    clearInterval(intervalID);
                    console.log('final:\tx = ' + garbageBody.position.x +
                                '\ny = ' + garbageBody.position.y);
                    garbageBody.collisionFilter.mask = 0x0001;
                    garbageBody.previousAngle = findAngle(garbageBody.position,
                        playerBody.position, garbageBody.angle);
                    finalCreateBond(playerBody, garbageBody);
                }
            }, 30);

        } else {
            playerBody.previousAngle =
                findAngle(playerBody.position, garbageBody.position, playerBody.angle);
            garbageBody.previousAngle =
                findAngle(garbageBody.position, playerBody.position, garbageBody.angle);
            finalCreateBond(playerBody, garbageBody);
        }
    }
}

function finalCreateBond(playerBody, garbageBody) {

    garbageBody.collisionFilter.group = playerBody.collisionFilter.group;

    garbageBody.inGameType = "playerPart";
    garbageBody.playerNumber = playerBody.playerNumber;

    var bondStiffness = 0.05;

    var constraintA = createBondConstraint(playerBody, garbageBody, bondStiffness);
    var constraintB = createBondConstraint(garbageBody, playerBody, bondStiffness);

    link(garbageBody, playerBody, constraintA, constraintB);

    World.add(engine.world, [constraintA, constraintB]);

    var newRadius = calculateDistance(players[playerBody.playerNumber]
        .body.position, garbageBody.position);
    players[playerBody.playerNumber].checkResizeGrow(newRadius);
    players[playerBody.playerNumber].recalculateMass();
}

//links parts of a player to form tree structure
function link(child, parent, constraint1, constraint2) {
    addToArray(parent.chemicalChildren, child);
    child.constraint1 = constraint1;
    child.constraint2 = constraint2;
    child.chemicalChildren = [];
}

//creates constraint suitable for making bond 
function createBondConstraint(_bodyA, _bodyB, _stiffness) {
    return Matter.Constraint.create({bodyA: _bodyA, bodyB: _bodyB,
        pointA: { x: _bodyB.position.x - _bodyA.position.x,
            y: _bodyB.position.y - _bodyA.position.y }, stiffness: _stiffness});
}

//creates bonds on collision if necessary
Matter.Events.on(engine, 'collisionStart', function(event) {
    var pairs = event.pairs;
    for (var i = 0; i < pairs.length; i++) {
        var bodyA = pairs[i].bodyA;
        var bodyB = pairs[i].bodyB;

        if ((bodyA.inGameType  == "player" ||
            bodyA.inGameType  == "playerPart") &&
            bodyB.inGameType  == "garbage") {
            createBond(bodyA, bodyB);
        } else if (bodyA.inGameType  == "garbage" &&
                    (bodyB.inGameType  == "player" ||
                    bodyB.inGameType  == "playerPart")) {
            createBond(bodyB, bodyA);
        } else if (bodyA.inGameType  == "p" &&
                    bodyB.inGameType  == "player") {
            players[bodyB.number].changeCharge(1, engine);
            prepareToDelete(bodyA);
        } else if (bodyB.inGameType  == "p" &&
                    bodyA.inGameType  == "player") {
            players[bodyA.number].changeCharge(1, engine);
            prepareToDelete(bodyB);
        } else if (bodyA.inGameType  == "p" &&
            bodyB.inGameType  == "playerPart") {
            if (garbage[bodyB.number].changeCharge(1, engine)) {
                players[bodyB.playerNumber].recalculateMass();
            }
            prepareToDelete(bodyA);
        } else if (bodyB.inGameType  == "p" &&
            bodyA.inGameType  == "playerPart") {
            if (garbage[bodyA.number].changeCharge(1, engine)) {
                players[bodyA.playerNumber].recalculateMass();
            }
            prepareToDelete(bodyB);
        } else if (bodyA.inGameType  == "p" &&
            bodyB.inGameType  == "garbage") {
            garbage[bodyB.number].setElement(elements[elements.
                indexOf(bodyB.element) + 1]);
            prepareToDelete(bodyA);
        } else if (bodyB.inGameType  == "p" &&
            bodyA.inGameType  == "garbage") {
            garbage[bodyA.number].setElement(elements[elements.
                indexOf(bodyA.element) + 1]);
            prepareToDelete(bodyB);
        } /*else if (bodyB.inGameType  == "player" &&
            bodyA.inGameType  == "player") {
        }*/else if (bodyA.inGameType == "ghost" ||
                    bodyB.inGameType == "ghost") {
            //special signal to show that Proton was not deleted properly
            console.log("boo");
        } else if (bodyA.inGameType == "n" &&
                    (bodyB.inGameType == "player" ||
                    bodyB.inGameType == "garbage")) {
            if (Math.sqrt(bodyA.velocity.x * bodyA.velocity.x +
                    bodyA.velocity.y * bodyA.velocity.y) < 7) {
                prepareToDelete(bodyA);
                ++bodyB.mass;
            }
        } else if (bodyB.inGameType == "n" &&
            (bodyA.inGameType == "player" ||
            bodyA.inGameType == "garbage")) {
            if (Math.sqrt(bodyB.velocity.x * bodyB.velocity.x +
                    bodyB.velocity.y * bodyB.velocity.y) < 7) {
                prepareToDelete(bodyB);
                ++bodyA.mass;
            }
        }
    }
});

function createFullBorder(radius) {
    createBorder(radius, 1, 1);
    createBorder(radius, -1, -1);
    createBorder(radius, 1, -1);
    createBorder(radius, -1, 1);
}

function createBorder(radius, xCoeff, yCoeff) {
    var angle = 82 * yCoeff;
    var standardHeight = 20;
    var length = 2 * radius * Math.sin(toRadians(15 / 2));

    var step = 15;
    var HALF = 0.5;

    var RIGHT_ANGLE = 90;

    var position = { x: radius, y: radius - yCoeff * radius};

    for (var i = 0; i < 6; ++i) {
        var difference = { x: - yCoeff * length *
        Math.cos(toRadians(RIGHT_ANGLE - Math.abs(angle)))
        * xCoeff * HALF, y: yCoeff * length *
        Math.sin(toRadians(RIGHT_ANGLE - Math.abs(angle))) * HALF};
        position = { x: position.x + difference.x,
            y: position.y + difference.y };
        var borderBody = Bodies.rectangle(position.x, position.y,
            standardHeight, length, { isStatic: true,
                angle: toRadians(angle) * xCoeff * yCoeff });

        var borderPart = { body: borderBody };
        borderBody.circleRadius = length * HALF;
        borderBody.inGameType = "Border";

        World.addBody(engine.world, borderBody);
        border.push(borderPart);

        position = { x: position.x + difference.x,
            y: position.y + difference.y };
        angle -= step * yCoeff;
    }
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function prepareToDelete(body) {
    body.inGameType = "ghost";
    ghosts.push(body);
}

function deleteProperly(body, array) {

    var index = body.number;

    if (body.inGameType == "p") {
        clearTimeout(body.timerId1);
        clearTimeout(body.timerId2);
    }

    World.remove(engine.world, body);
    delete array[index];
}

//main loop
setInterval(function() {
    Matter.Engine.update(engine, engine.timing.delta);
    for (var j = 0; j < players.length; ++j) {
        if (players[j]) {
            try {
                players[j].ws.send(createMessage(j));
            } catch (e) {
                console.log('Caught ' + e.name + ': ' + e.message);
            }
        }
        if (ghosts.length) {
            for (var i = 0; i < ghosts.length; ++i) {
                deleteProperly(ghosts[i], freeProtons);
            }
            ghosts = [];
        }

    }
}, 1000 / 60);

//catches memory leaks
memwatch.on('leak', function(info) {
    console.log(info);
});

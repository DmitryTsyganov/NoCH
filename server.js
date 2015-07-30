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

//protons that will be deleted at next update
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

webSocketServer.on('connection', function(ws) {

    var mapRadius = params.getParameter("gameDiameter") / 2;

    var minAreaRadius = 0;
    var maxAreaRadius = 240;

    var defaultPosition = getRandomPositionInside(mapRadius,
                                minAreaRadius, maxAreaRadius);

    var Player = require('./player');

    var player = new Player(ws, defaultPosition, engine, "Carbon");

    var id = addToArray(players, player);

    player.body.number = player.body.playerNumber = id;

    console.log('new player ' + id +
     ', players total ' + players.length);

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
            player.shoot(shotPos, freeProtons, engine);
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
        x: Math.ceil(coordinates.x - (player.body.position.x - player.resolution.width / 2)),
        y: Math.ceil(coordinates.y - (player.body.position.y - player.resolution.height / 2))
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

    response["bonds"] = bonds.filter(dotInScreen, players[id]).map(function(obj) {
            return toLocalCS(obj, players[id]);
        });

    var particlesInScreen = ((players.filter(inScreen, players[id])).concat(
        garbage.filter(inScreen, players[id]))).concat(freeProtons.filter(inScreen, players[id]));

    for (var j = 0; j < elements.length; ++j) {
        addElements(id, response, particlesInScreen, elements[j]);
    }
    addElements(id, response, particlesInScreen, "proton");

    response["border"] = (border.filter(inScreen, players[id])).map(function(wall) {
        return { position: toLocalCS(wall.body.position, players[id]), angle: wall.body.angle };
    });

    return JSON.stringify(response);
}

function addElements(id, object, array, elementName) {
    object[elementName] = array.filter(isElement, elementName).map(function(particle) {
        return toLocalCS(particle.body.position, players[id]);
    });
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
    var tolerance = 200;
    return (dot.x < this.body.position.x + this.resolution.width + tolerance / this.body.coefficient / 2 &&
    dot.x > this.body.position.x - this.resolution.width - tolerance / this.body.coefficient / 2 &&
    dot.y < this.body.position.y + this.resolution.height + tolerance / this.body.coefficient / 2 &&
    dot.y > this.body.position.y - this.resolution.height - tolerance / this.body.coefficient / 2);
}

function isElement(object) {
    return object.body.element == this;
}

//returns multipliers for next quarter of coordinate plane
function findNextQuarter(pos) {
    if (pos.x >= 0 && pos.y >= 0) return { x: -1, y: 1 };
    if (pos.x <= 0 && pos.y >= 0) return { x: -1, y: -1 };
    if (pos.x <= 0 && pos.y <= 0) return { x: 1, y: -1 };
    if (pos.x >= 0 && pos.y <= 0) return { x: 1, y: 1 };
}

//returns position for next element in player's coordinate system
function findDestination(playerPosition, previousPosition,
                         bonds, newRadius, previousRadius) {
    var localPos = { x: previousPosition.x - playerPosition.x,
        y: previousPosition.y - playerPosition.y };
    var multiplier;
    var OFFSET = 20;

    if (bonds == 4) {
        multiplier = findNextQuarter(localPos);
        localPos = { x: Math.abs(localPos.y) * multiplier.x,
                    y: Math.abs(localPos.x) * multiplier.y };
    }

    if (bonds == 3) {
        multiplier = findNextQuarter(localPos);
        localPos = { x: (Math.abs(localPos.y) + OFFSET) * multiplier.x,
            y: Math.abs(localPos.x) * multiplier.y };
    }

    if (bonds == 2) {
        localPos = { x: -localPos.x, y: -localPos.y };
    }

    var mainRadius = calculateDistance(localPos, { x: 0, y: 0 });

    localPos = { x: localPos.x + (newRadius - previousRadius) / mainRadius * localPos.x,
                y: localPos.y + (newRadius - previousRadius) / mainRadius * localPos.y };

    return localPos;
}

//creates Bond between player and garbage
function createBond(playerBody, garbageBody) {

    if (playerBody.getFreeBonds() && garbageBody.getFreeBonds()) {
        var prev = Composite.get(engine.world, playerBody.prevId, "body");

        if (prev) {
            var pos1 = playerBody.position;
            var pos2 = prev.position;

            var destination = findDestination(pos1, pos2, playerBody.totalBonds,
                                            garbageBody.circleRadius, prev.circleRadius);
            Body.translate(garbageBody, {
                x: destination.x + pos1.x - garbageBody.position.x,
                y: destination.y + pos1.y - garbageBody.position.y });
        }

        ++playerBody.chemicalBonds;
        ++garbageBody.chemicalBonds;

        garbageBody.collisionFilter.group = playerBody.collisionFilter.group;

        playerBody.prevId = garbageBody.id;
        garbageBody.prevId = playerBody.id;

        garbageBody.inGameType  = "playerPart";
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
}

//links parts of a player to form tree structure
function link(child, parent, constraint1, constraint2) {
    parent.chemicalChildren.push(child);
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
        var pair = pairs[i];

        if ((pair.bodyA.inGameType  == "player" ||
            pair.bodyA.inGameType  == "playerPart") &&
            pair.bodyB.inGameType  == "garbage") {
            createBond(pair.bodyA, pair.bodyB);
        } else if (pair.bodyA.inGameType  == "garbage" &&
                    (pair.bodyB.inGameType  == "player" ||
                    pair.bodyB.inGameType  == "playerPart")) {
            createBond(pair.bodyB, pair.bodyA);
        } else if (pair.bodyA.inGameType  == "proton" &&
                    pair.bodyB.inGameType  == "player") {
            players[pair.bodyB.number].changeCharge(1, engine);
            prepareToDelete(pair.bodyA);
        } else if (pair.bodyB.inGameType  == "proton" &&
                    pair.bodyA.inGameType  == "player") {
            players[pair.bodyA.number].changeCharge(1, engine);
            prepareToDelete(pair.bodyB);
        } else if (pair.bodyA.inGameType  == "proton" &&
            pair.bodyB.inGameType  == "playerPart") {
            if (garbage[pair.bodyB.number].changeCharge(1, engine)) {
                players[pair.bodyB.playerNumber].recalculateMass();
            }
            prepareToDelete(pair.bodyA);
        } else if (pair.bodyB.inGameType  == "proton" &&
            pair.bodyA.inGameType  == "playerPart") {
            if (garbage[pair.bodyA.number].changeCharge(1, engine)) {
                players[pair.bodyA.playerNumber].recalculateMass();
            }
            prepareToDelete(pair.bodyB);
        } else if (pair.bodyA.inGameType  == "proton" &&
            pair.bodyB.inGameType  == "garbage") {
            garbage[pair.bodyB.number].setElement(elements[elements.
                indexOf(pair.bodyB.element) + 1]);
            prepareToDelete(pair.bodyA);
        } else if (pair.bodyB.inGameType  == "proton" &&
            pair.bodyA.inGameType  == "garbage") {
            garbage[pair.bodyA.number].setElement(elements[elements.
                indexOf(pair.bodyA.element) + 1]);
            prepareToDelete(pair.bodyB);
        } /*else if (pair.bodyB.inGameType  == "player" &&
            pair.bodyA.inGameType  == "player") {
        }*/else if (pair.bodyA.inGameType == "ghost" ||
                    pair.bodyB.inGameType == "ghost") {
            //special signal to show that proton was not deleted properly
            console.log("boo");
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

    if (body.inGameType == "proton") {
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
        if(players[j] && players[j].ws) {
            try {
                players[j].ws.send(createMessage(j));
            } catch(e) {
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

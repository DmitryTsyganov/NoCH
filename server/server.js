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
var garbageDensity = 0.00002;

createFullBorder(params.getParameter("gameDiameter") / 2);
createGarbage(params.getParameter("gameDiameter") *
    params.getParameter("gameDiameter") / 4 * garbageDensity);

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
            sendEverybody({"id": player.body.id, "ne": player.body.element});
        }
    });

    ws.on('close', function(event) {
        console.log('player exited ' + id);
        if (event != 1000) deletePlayer();
    });

    ws.on('error', function(event) {
        console.log('player disconnected ' + id);
        deletePlayer();
    });

    function deletePlayer() {
        /*var lastResort = player.body.position;
        var elem = player.body.element;*/
        /*player.die(engine);*/
        player.garbagify(players, garbage);
        sendEverybody({ "dp": player.body.id });
        /*World.remove(engine.world, player.body);
        delete players[id];
        var playerGarbage = new Garbage(lastResort, engine, elem);
        garbage.push(playerGarbage);
        playerGarbage.body.number = garbage.indexOf(playerGarbage);*/
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
        if ((!dotInScreen.call(players[id], bonds[i])) &&
            (!dotInScreen.call(players[id], bonds[i + 1]))) {
            bonds.splice(i, 2);
            i -= 2;
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
                /*console.log('final:\tx = ' + garbageBody.position.x +
                            '\ny = ' + garbageBody.position.y);*/
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
    child.chemicalParent = parent;
}

//creates constraint suitable for making bond 
function createBondConstraint(_bodyA, _bodyB, _stiffness) {
    return Matter.Constraint.create({bodyA: _bodyA, bodyB: _bodyB,
        pointA: { x: _bodyB.position.x - _bodyA.position.x,
            y: _bodyB.position.y - _bodyA.position.y }, stiffness: _stiffness});
}

function calculateMomentum(bodyA, bodyB) {
    return (bodyA.mass + bodyB.mass) * Math.sqrt((bodyA.velocity.x - bodyB.velocity.x) *
            (bodyA.velocity.x - bodyB.velocity.x) + (bodyA.velocity.y - bodyB.velocity.y) *
            (bodyA.velocity.y - bodyB.velocity.y));
}

function connectPlayers(bodyA, bodyB) {
    var massA = players[bodyA.playerNumber].body.realMass;
    var massB = players[bodyB.playerNumber].body.realMass;
    if (massA == massB) return;
    var playerBody = massA > massB ? bodyA : bodyB;
    var garbageBody = massA < massB ? bodyA : bodyB;

    //console.log("target id = " + players[garbageBody.playerNumber].body.id);
    var deletedId = players[garbageBody.playerNumber].body.id;

    players[garbageBody.playerNumber].ws.send( JSON.stringify({"dead": true}));
    players[garbageBody.playerNumber].garbagify(players, garbage, playerBody);
    garbage[garbageBody.number].reverse();
    sendEverybody({ "dp": deletedId });
    createBond(playerBody, garbageBody);

    //testing
    /*setTimeout(function() {
    players[playerBody.playerNumber].traversDST(players[playerBody.playerNumber].body, function(node){
        node.element = "He";
        console.log("Body " + node.id + " has " + node.chemicalChildren.length);
    })}, 5500);*/
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
            if (bodyA.getFreeBonds() && bodyB.getFreeBonds()) {
                createBond(bodyA, bodyB);
            } else if (bodyA.inGameType  == "playerPart"){
                var momentum = calculateMomentum(bodyA, bodyB);
                //console.log(momentum);
                garbage[bodyA.number].checkDecoupling(momentum, engine);
            }
        } else if (bodyA.inGameType  == "garbage" &&
                    (bodyB.inGameType  == "player" ||
                    bodyB.inGameType  == "playerPart")) {
            if (bodyB.getFreeBonds() && bodyA.getFreeBonds()) {
                createBond(bodyB, bodyA);
            } else if (bodyB.inGameType  == "playerPart") {
                var momentum = calculateMomentum(bodyB, bodyA);
                //console.log(momentum);
                garbage[bodyB.number].checkDecoupling(momentum, engine);
            }
        } else if (bodyA.inGameType  == "p" &&
                    bodyB.inGameType  == "player") {
            players[bodyB.number].changeCharge(1, engine, freeProtons);
            sendEverybody({"id": bodyB.id, "ne": bodyB.element});
            prepareToDelete(bodyA);
        } else if (bodyB.inGameType  == "p" &&
                    bodyA.inGameType  == "player") {
            players[bodyA.number].changeCharge(1, engine, freeProtons);
            sendEverybody({"id": bodyA.id, "ne": bodyA.element});
            prepareToDelete(bodyB);
        } else if (bodyA.inGameType  == "p" &&
            bodyB.inGameType  == "playerPart") {
            if (garbage[bodyB.number].changeCharge(1, engine, freeProtons)) {
                players[bodyB.playerNumber].recalculateMass();
            }
            prepareToDelete(bodyA);
        } else if (bodyB.inGameType  == "p" &&
            bodyA.inGameType  == "playerPart") {
            if (garbage[bodyA.number].changeCharge(1, engine, freeProtons)) {
                players[bodyA.playerNumber].recalculateMass();
            }
            prepareToDelete(bodyB);
        } else if (bodyA.inGameType  == "p" &&
            bodyB.inGameType  == "garbage") {
            garbage[bodyB.number].changeCharge(1, engine, freeProtons);
            prepareToDelete(bodyA);
        } else if (bodyB.inGameType  == "p" &&
            bodyA.inGameType  == "garbage") {
            garbage[bodyA.number].changeCharge(1, engine, freeProtons);
            prepareToDelete(bodyB);
        } else if (bodyB.inGameType  == "player" &&
            bodyA.inGameType  == "player" ||
            bodyB.inGameType  == "player" &&
            bodyA.inGameType  == "playerPart" ||
            bodyB.inGameType  == "playerPart" &&
            bodyA.inGameType  == "player" ||
            bodyB.inGameType  == "playerPart" &&
            bodyA.inGameType  == "playerPart") {
            if (bodyB.getFreeBonds() && bodyA.getFreeBonds()) {
                connectPlayers(bodyA, bodyB);
            }
        } else if (bodyA.inGameType == "ghost" ||
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
        } else if (bodyA.inGameType  == "player" &&
            (bodyB.inGameType  == "player" ||
            bodyB.inGameType  == "playerPart")) {
            if (bodyB.getFreeBonds() && bodyA.getFreeBonds()) {
                createBond(bodyB, bodyA);
            } else if (bodyB.inGameType  == "playerPart") {
                var momentum = calculateMomentum(bodyB, bodyA);
                //console.log(momentum);
                garbage[bodyB.number].checkDecoupling(momentum, engine);
            }
        } else if (bodyB.inGameType  == "player" &&
            (bodyA.inGameType  == "player" ||
            bodyA.inGameType  == "playerPart")) {
            if (bodyA.getFreeBonds() && bodyB.getFreeBonds()) {
                createBond(bodyA, bodyB);
            } else if (bodyA.inGameType  == "playerPart") {
                var momentum = calculateMomentum(bodyA, bodyB);
                //console.log(momentum);
                garbage[bodyA.number].checkDecoupling(momentum, engine);
            }
        } else if (bodyA.inGameType == "Border") {
            ghosts.push(bodyB);
        } else if (bodyB.inGameType == "Border") {
            ghosts.push(bodyA);
        }
    }
});

function createFullBorder(radius) {
    var BORDER_PART_LENGTH = 100;
    var BORDER_PART_HEIGHT = 20;

    var center = { x: radius, y: radius };

    var step = Math.asin(BORDER_PART_LENGTH / 2 / radius) * 2;

    for (var i = step / 2; i <= Math.PI * 2; i += step) {
        var borderBody =
            Bodies.rectangle(center.x - radius * Math.cos(i),
                center.y - radius * Math.sin(i),
                BORDER_PART_HEIGHT, BORDER_PART_LENGTH, { isStatic: true,
                angle: i });

        var borderPart = { body: borderBody };
        borderBody.circleRadius = BORDER_PART_LENGTH * 2;
        borderBody.inGameType = "Border";

        World.addBody(engine.world, borderBody);
        border.push(borderPart);
    }
}

function sendEverybody(message) {
    for (var i = 0; i < players.length; ++i) {
        if (players[i]) {
            try {
                players[i].ws.send(JSON.stringify(message));
            } catch (e) {
                console.log('Caught ' + e.name + ': ' + e.message);
            }
        }
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
                switch (ghosts[i].inGameType) {
                    case "p":
                        deleteProperly(ghosts[i], freeProtons);
                        break;
                    case "playerPart":
                        var parent = ghosts[i].parent;
                        garbage[ghosts[i].number].die(engine);
                        delete parent.chemicalChildren[parent.
                            chemicalChildren.indexOf(ghosts[i])];
                        deleteProperly(ghosts[i], garbage);
                        --parent.chemicalBonds;
                        break;
                    case "garbage":
                        garbage[ghosts[i].number].die(engine);
                        deleteProperly(ghosts[i], garbage);
                        break;
                    case "player":
                        players[ghosts[i].number].ws.send( JSON.stringify({"dead": true}));
                        players[ghosts[i].number].garbagify(players, garbage);
                        break;
                }
            }
            ghosts = [];
        }

    }
}, 1000 / 60);

//catches memory leaks
memwatch.on('leak', function(info) {
    console.log(info);
});

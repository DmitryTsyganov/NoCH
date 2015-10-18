var WebSocketServer = new require('ws');

var Geometry = require("geometry");

var memwatch = require("memwatch");

var params = require("db");
params.connect();

//creating PhysicsWorld
var Matter = require('matter-js/build/matter.js');

var secretPassword = 'SvyatoslavMitin';
//It's not that secret being honest

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite;

var elements = params.getParameter("elements");

//noinspection JSCheckFunctionSignatures
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
var garbageDensity = 0.000008;

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
    var maxAreaRadius = 850;

    var defaultPosition = getRandomPositionInside(mapRadius,
                                minAreaRadius, maxAreaRadius);

    var Player = require('./player');

    var player = new Player(ws, defaultPosition, engine, "C");

    var id = addToArray(players, player);

    //noinspection JSUnresolvedVariable
    player.body.number = player.body.playerNumber = id;

    console.log('new player ' + id +
     ', players total ' + players.length);

    var colors = ["green", "blue", "yellow", "purple", "orange"];
    player.color = colors[Math.ceil(Math.random() * 4)];

    for (var i = 0; i < players.length; ++i) {
        if (players[i]) {
            try {
                //noinspection JSUnresolvedVariable
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
        try {
            var parsedMessage = JSON.parse(message);
        } catch (e) {
            return;
        }
        if (typeof parsedMessage === 'object' && parsedMessage !== null) {

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
                if (player.shoot(parsedMessage.particle, shotPos, freeProtons, garbage, engine)) {
                    var response = {};
                    response["sh" + parsedMessage.particle] = player.body.id;
                    sendEverybody(response/*{ key: player.body.id }*/);
                    switch (parsedMessage.particle) {
                        case 'p':
                            sendEverybody({"id": player.body.id, "ne": player.body.element});
                            break;
                        /*case 'n':
                         sendEverybody({ "sh": player.body.id });
                         break;*/
                    }
                }
            }
            if ("shutdown" in parsedMessage &&
                parsedMessage.shutdown == secretPassword) {
                throw new Error('Server is dead.')
            }
            if ("color" in parsedMessage) {
                player.color = parsedMessage.color;
                try {
                    sendEverybody({"id": player.body.id, "ncol": parsedMessage.color });
                } catch (e) {
                    console.log('Caught ' + e.name);
                }

            }
        }
    });

    ws.on('close', function(event) {

        if (event != 1000) {
            //noinspection JSUnresolvedVariable
            prepareToDelete(player.body);
            console.log('player exited ' + id);
        } else {
            console.log('player lost ' + id);
        }
    });

    ws.on('error', function() {
        console.log('player disconnected ' + id);
        //noinspection JSUnresolvedVariable
        prepareToDelete(player.body);
    });

});

//creates given amount of garbage
function createGarbage(quantity) {

    var diameter = params.getParameter("gameDiameter");

    for (var j = 0; j < quantity; ++j) {
        var element = elements[Math.ceil(getRandomArbitrary(-1, 9))];

        var OFFSET_BORDER = 40;
        var OFFSET_PLAYER = 1000;
        var position = getRandomPositionInside(diameter / 2, OFFSET_PLAYER,
                                                diameter / 2 - OFFSET_BORDER);

        var singleGarbage = new Garbage(position, engine, element);

        garbage.push(singleGarbage);
        //noinspection JSUnresolvedVariable
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

//inserts obj in first available position in array. returns position
function addToArray(array, obj) {
    var i = 0;
    while(array[i]) ++i;
    array[i] = obj;
    return i;
}

/*function peekAtAvailablePosition(array) {
    var i = 0;
    while(array[i]) ++i;
    return i;
}*/

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
    Composite.allConstraints(engine.world).forEach(
        function(bond) {
            //noinspection JSUnresolvedVariable
            bonds.push({
                x: bond.bodyA.position.x,
                y: bond.bodyA.position.y
            });
            bonds.push({
                x: bond.bodyB.position.x,
                y: bond.bodyB.position.y
            });
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

//transforms array of positions {x: value, y: value} into array of digits
function parseCoordinates(array) {
    var parsedArray = [];
    for (var i = 0; i < array.length; ++i) {
        for (var key in array[i]) {
            if (array[i].hasOwnProperty(key)) {
                parsedArray.push(array[i][key]);
            }
        }
    }
    return parsedArray;
}

//checks if object is in screen of player, current player is 'this'
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

//starts bonding process
function createBond(playerBody, garbageBody) {

    var playerPart = getMainObject(playerBody);
    var singleGarbage = getMainObject(garbageBody);
    var connectingPlayer = getPlayer(playerBody);
    //if (!connectingPlayer || !singleGarbage || !playerPart) return;

    ++playerBody.chemicalBonds;
    ++garbageBody.chemicalBonds;

    link(garbageBody, playerBody);

    var newRadius = Geometry.calculateDistance(connectingPlayer
        .body.position, garbageBody.position);
    connectingPlayer.checkResizeGrow(newRadius);

    connectingPlayer.recalculateMass();
    singleGarbage.markAsPlayer(playerBody);

    garbageBody.player = connectingPlayer;

    playerPart.connectBody(garbageBody, finalCreateBond);

}

//adds bond in physical engine
function finalCreateBond(playerBody, garbageBody, angle1, angle2) {

    var bondStiffness = 0.05;

    var constraintA = createBondConstraint(playerBody, garbageBody, bondStiffness);
    var constraintB = createBondConstraint(garbageBody, playerBody, bondStiffness);

    garbageBody.constraint1 = constraintA;
    garbageBody.constraint2 = constraintB;

    garbageBody.constraint1.chemicalAngle = angle1;
    garbageBody.constraint2.chemicalAngle = angle2;

    World.add(engine.world, [constraintA, constraintB]);

    garbageBody.collisionFilter.mask = 0x0001;
}

//links parts of a player to form tree structure
function link(child, parent) {
    addToArray(parent.chemicalChildren, child);
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

function connectGarbageToPlayer(playerBody, garbageBody) {
    getMainObject(garbageBody).reverse();
    getMainObject(garbageBody).prepareForBond();
    createBond(playerBody, garbageBody);
}

function connectPlayers(bodyA, bodyB) {

    var massA = getPlayer(bodyA).body.realMass;
    var massB = getPlayer(bodyB).body.realMass;

    if (massA == massB) return;
    var playerBody = massA > massB ? bodyA : bodyB;
    var garbageBody = massA < massB ? bodyA : bodyB;

    var deletedId = getPlayer(garbageBody).body.id;

    getPlayer(garbageBody).lose(engine, players, garbage, playerBody);
    getMainObject(garbageBody).reverse();
    sendEverybody({ "dp": deletedId });
    createBond(playerBody, garbageBody);
}

function collideWithProton(elementBody, protonBody) {
    getMainObject(elementBody).changeCharge(1, engine, freeProtons);
    sendEverybody({"id": elementBody.id, "ne": elementBody.element});
    prepareToDelete(protonBody);
}

function collideWithNeutron(elementBody, neutronBody) {
    if (Math.sqrt(neutronBody.velocity.x * neutronBody.velocity.x +
            neutronBody.velocity.y * neutronBody.velocity.y) < 7) {
        prepareToDelete(neutronBody);
        ++elementBody.mass;
    }
}

function collideWithBorder(body) {
    if (body.inGameType == "player") {
        players[body.number].die(engine);
        players[body.number].lose(engine, players, garbage);
        prepareToDelete(body);
    } else {
        prepareToDelete(body);
    }
}

function collideWithGarbage(playerBody, garbageBody) {

    var playerPart = getMainObject(playerBody);
    var singleGarbage = getMainObject(garbageBody);

    //if (!playerPart && !singleGarbage) return;

    if (playerBody.getFreeBonds() && garbageBody.getFreeBonds()) {
        connectGarbageToPlayer(playerBody, garbageBody);
    } else if (playerBody.inGameType  == "playerPart"){
        var momentum = calculateMomentum(playerBody, garbageBody);

        playerPart.checkDecoupling(momentum, engine);
        singleGarbage.checkDecoupling(momentum, engine);
    }
}

function collidePVP(playerBodyA, playerBodyB) {
    if (playerBodyA.playerNumber == playerBodyB.playerNumber) return;
    if (playerBodyA.getFreeBonds() && playerBodyB.getFreeBonds()) {
        connectPlayers(playerBodyA, playerBodyB);
    } else {
        var momentum = calculateMomentum(playerBodyA, playerBodyB);
        getMainObject(playerBodyA).checkDecoupling(momentum, engine);
        getMainObject(playerBodyB).checkDecoupling(momentum, engine);
    }
}

function getArray(body) {
    switch (body.inGameType) {
        case "player":
            return players;
        case "temporary undefined":
        case "playerPart":
        case "garbage":
            return garbage;
        case "n":
        case "p":
            return freeProtons;
    }
}

function getMainObject(body) {
    if (!body) throw new Error(body + ' passed to getMainObject');
    switch (body.inGameType) {
        case "player":
            return players[body.number];
        case "player temporary undefined":
        case "temporary undefined":
        case "playerPart":
        case "playerPart temporary undefined":
        case "garbage":
        case "garbage temporary undefined":
            return garbage[body.number];
        case "n":
        case "p":
            return freeProtons[body.number];
    }
    throw new Error ('unknown type ' + body.inGameType);
}

function getPlayer(body) {

    var player = players[body.playerNumber];
    if (player !== undefined) {
        return player;
    } else {
        console.log("No such player! id: " + body.playerNumber);
    }
}

Matter.Events.on(engine, 'collisionStart', function(event) {
    var pairs = event.pairs;
    for (var i = 0; i < pairs.length; i++) {
        var bodyA = pairs[i].bodyA;
        var bodyB = pairs[i].bodyB;

        if ((bodyA.inGameType  == "player" ||
            bodyA.inGameType  == "playerPart") &&
            bodyB.inGameType  == "garbage") {
            collideWithGarbage(bodyA, bodyB);
        } else if (bodyA.inGameType  == "garbage" &&
                    (bodyB.inGameType  == "player" ||
                    bodyB.inGameType  == "playerPart")) {
            collideWithGarbage(bodyB, bodyA);
        } else if (bodyA.inGameType  == "p" &&
                (bodyB.inGameType  == "player" ||
                bodyB.inGameType  == "playerPart" ||
                bodyB.inGameType  == "garbage")) {
            collideWithProton(bodyB, bodyA);
        } else if (bodyB.inGameType  == "p" &&
                    (bodyA.inGameType  == "player"||
                    bodyA.inGameType  == "playerPart" ||
                    bodyA.inGameType  == "garbage")) {
            collideWithProton(bodyA, bodyB);
        } else if (bodyB.inGameType  == "player" &&
            bodyA.inGameType  == "player" ||
            bodyB.inGameType  == "player" &&
            bodyA.inGameType  == "playerPart" ||
            bodyB.inGameType  == "playerPart" &&
            bodyA.inGameType  == "player" ||
            bodyB.inGameType  == "playerPart" &&
            bodyA.inGameType  == "playerPart") {
            collidePVP(bodyA, bodyB);
        } else if (bodyA.inGameType == "n" &&
                    (bodyB.inGameType == "player" ||
                    bodyB.inGameType == "garbage")) {
            collideWithNeutron(bodyB, bodyA);
        } else if (bodyB.inGameType == "n" &&
            (bodyA.inGameType == "player" ||
            bodyA.inGameType == "garbage")) {
            collideWithNeutron(bodyA, bodyB);
        } else if (bodyA.inGameType == "Border") {
            collideWithBorder(bodyB);
        } else if (bodyB.inGameType == "Border") {
            collideWithBorder(bodyA);
        }
    }
});

//creates circle-like polygon
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

function prepareToDelete(body) {
    if (ghosts.indexOf(body) == -1) {
        addToArray(ghosts, body);
    }
}

function deleteProperly(body) {

    if (body.inGameType == "p") {
        clearTimeout(body.timerId1);
        clearTimeout(body.timerId2);
    }

    World.remove(engine.world, body);
    delete getArray(body)[body.number];
}

//main loop
setInterval(function() {
    if (players.filter(function(player) {
        return !!player;
    }).length) {
        Matter.Engine.update(engine, engine.timing.delta);
        for (var i = 0; i < ghosts.length; ++i) {
            if (ghosts[i]) {
                var ghost = ghosts[i];
                switch (ghost.inGameType) {
                    case "p":

                        deleteProperly(ghost);
                        delete ghosts[i];
                        break;

                    case "playerPart":

                        var playerToCheck = getPlayer(ghost);
                        getMainObject(ghost).die(engine);
                        deleteProperly(ghost);
                        delete ghosts[i];
                        playerToCheck.checkResizeShrink();
                        break;

                    case "garbage":

                        //temporary
                        //garbage[ghost.number].die(engine);
                        deleteProperly(ghost);
                        delete ghosts[i];

                        break;

                    case "player":

                        console.log("player number " + ghost.number + " is dead.");
                        var player = getMainObject(ghost);
                        player.garbagify(players, garbage);

                        sendEverybody({"dp": player.body.id});
                        delete ghosts[i];
                        break;
                }
            }

        }
    }

    for (var j = 0; j < players.length; ++j) {
        if (players[j]) {
            try {
                players[j].ws.send(createMessage(j));
            } catch (e) {
                console.log('Caught ' + e.name + ': ' + e.message);
            }
        }
    }
}, 1000 / 60);

//catches memory leaks
//noinspection JSUnresolvedFunction
memwatch.on('leak', function(info) {
    console.log(info);
});

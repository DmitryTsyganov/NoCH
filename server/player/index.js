/**
 * Created by fatman on 06/07/15.
 */

var Matter = require('matter-js/build/matter.js');
var params = require("db");
var elements = params.getParameter("elements");
var basicParticle = require("../basic particle");

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite;

var Player = function(ws, position, engine, elem) {

    basicParticle.call(this, position, engine, elem);

    this.ws = ws;
    console.log(this.body);

    //this.body.collisionFilter.group = Body.nextGroup(true);

    this.previousPosition = { x: 0, y: 0 };
    this.body.inGameType = "player";
    this.body.player = this;
    this.body.realMass = this.body.mass;
    this.body.coefficient = 1;
    this.body.realRadius = this.body.circleRadius;
    this.body.multiplier =  Math.sqrt(this.body.realRadius);
    this.resolution = { width: 0, height: 0 };
};

Player.prototype = {
    setResolution: function(res) {
        this.resolution.width = res["x"];
        this.resolution.height = res["y"];
    },

    getLocalPosition: function() {
        return { x: this.resolution.width / 2,
                 y: this.resolution.height / 2 };
    },

    makeMassCalc: function() {
        function addMass(body) {
            addMass.mass += body.mass;
        }
        addMass.mass = 0;
        return addMass;
    },

    /*makeArrayCreator: function() {
        function addPos(body) {
            if (body.constraint1) {
                addPos.bondPositions.push({
                    x: body.constraint1.bodyA.position.x,
                    y: body.constraint1.bodyA.position.y
                });
                addPos.bondPositions.push({
                    x: body.constraint1.bodyB.position.x,
                    y: body.constraint1.bodyB.position.y
                });
            }
        }
        addPos.bondPositions = [];
        return addPos;
    },*/

    recalculateMass: function() {
        this.body.realMass = this.calculateMass(this.body);
    },

    calculateMass: function(body) {
        var func = this.makeMassCalc();
        this.traversDST(body, func);
        return func.mass;
    },

    /*getBondsPositions: function() {
        var func = this.makeArrayCreator();
        this.traversDST(this.body, func);
        return func.bondPositions;
    },*/

    shoot: function(particle, shotPos, nucleonsArray, garbageArray, engine) {

        if (particle == "p" && this.body.element == "H") return false;
        if (particle == "n" && this.body.neutrons == 0) return false;

        if (!this["timeLimit" + particle]) {
            var element = params.getParameter(particle);

            var nucleonBody = this.createNucleon(particle, shotPos, nucleonsArray, engine);

            if (particle == "p") this.changeCharge(-1, engine, nucleonsArray, garbageArray);

            var self = this;

            this["timeLimit" + particle] = true;
            setTimeout(function() {
                self["timeLimit" + particle] = false;
            }, 100/*this.body.coolDown*/);

            nucleonBody.timerId1 = setTimeout(function() {
                nucleonBody.collisionFilter.mask = 0x0001;
            }, 1000);

            nucleonBody.timerId2 = setTimeout(function() {
                if (nucleonsArray[nucleonBody.number]) {
                    World.remove(engine.world, nucleonBody);
                    delete nucleonsArray[nucleonBody.number];
                }
            }, 10000);

            if (particle == "n") {

                --this.body.neutrons;

                this.body.inverseMass = 1 / this.body.mass;

                setTimeout(function() {
                    ++self.body.neutrons;
                    self.body.mass += element.mass;
                    self.body.inverseMass = 1 / self.body.mass;
                }, this.body.coolDown);
                setTimeout(function() {
                    nucleonBody.inGameType =
                        nucleonBody.element = "p";
                }, element.protonMorphing);
            }

            //debugging
            /*nucleonBody.inGameType =
                nucleonBody.element = "p";*/
            return true;
        }
        return false;
    },

    dismountBranch: function(engine) {
        var child = {
            body: null,
            mass: Infinity
        };

        for (var i = 0; i < this.body.chemicalChildren.length; ++i) {
            if (this.body.chemicalChildren[i]) {
                var nextChild = {
                    body: this.body.chemicalChildren[i],
                    mass: this.calculateMass(this.body.chemicalChildren[i])
                };
                if (nextChild.mass < child.mass) child = nextChild;
            }
        }

        this.traversDST(child.body, this.free, this.letGo, engine);

        if (!this.body.chemicalBonds) this.checkResizeShrink();
    },

    correctBondAngles: function(engine) {
        this.correctBondAnglesFinal(engine);
    },

    lose: function(engine, playersArray, garbageArray, newPlayerBody) {

        try {
            this.ws.send(JSON.stringify({"dead": true}));
            this.ws.close(1000, "lost");
        } catch(e) {
            console.log("already closed");
        }
        delete (this.ws);
        if (newPlayerBody) {
            this.garbagify(playersArray, garbageArray, newPlayerBody);
        } else {
            this.garbagify(playersArray, garbageArray);
            //this.die(engine);
        }
    },

    //turns player into garbage before appending it to another player
    garbagify: function(playersArray, garbageArray, newPlayerBody) {

        var playerNumber = this.body.playerNumber;

        garbageArray.push(this);
        this.body.number = garbageArray.indexOf(this);

        if (newPlayerBody !== undefined) {

            this.prepareForBond(newPlayerBody);
            /*this.traversDST(this.body, function(node) {
                node.collisionFilter.group =
                    newPlayerBody.collisionFilter.group;
                node.playerNumber = newPlayerBody.playerNumber;

            });*/
        } else {
            this.traversDST(this.body, function(node) {
                node.inGameType = "garbage";
                node.playerNumber = - 1;
                //node.collisionFilter.group = 0;
            });
        }

        delete (this.body.realRadius);
        //delete (this.body.previousRadius);
        delete (this.body.coefficient);
        delete (this.body.resolution);

        delete playersArray[playerNumber];
    },

    applyVelocity: function(mx, my) {
        var speed = this.body.nuclearSpeed;

        var PERCENT_FULL = 100;
        var massCoefficient = 6;
        var minMultiplier = 20;
        var partsMultiplier = 2;
        var forceCoefficient = 490;

        var multiplier = PERCENT_FULL - this.body.realMass * massCoefficient;
        if (multiplier < minMultiplier) multiplier = minMultiplier;
        speed = speed / PERCENT_FULL * multiplier / partsMultiplier;

        //apply decreased velocity to all parts of the player

        var pos1 = this.body.position;

        //TODO: finally make the whole thing move
        this.traversDST(this.body, function(body) {
            body.force = { x: 0, y: 0 };
            body.torque = 0;
            var pos2 = body.position;
            /*var distance = Math.sqrt((pos1.x - pos2.x) * (pos1.x - pos2.x)
                + (pos1.y - pos2.y) * (pos1.y - pos2.y));
            if (!distance) distance = 1;*/
            Body.applyForce(body, body.position,
                /*Matter.Body.setVelocity(body,*/ {
                    x: speed / forceCoefficient /*!/ Math.sqrt(distance) */*
                    mx / Math.sqrt(mx * mx + my * my),
                    y: speed / forceCoefficient /*/ Math.sqrt(distance) */*
                    my / Math.sqrt(mx * mx + my * my)
                });
        });

        speed *= partsMultiplier;

        //apply regular velocity to player.body only
        this.body.force = { x: 0, y: 0 };
        this.body.torque = 0;
        Body.applyForce(this.body, this.body.position,
        /*Body.setVelocity(this.body,*/ {
            x: speed / forceCoefficient * mx / Math.sqrt(mx * mx + my * my),
            y: speed / forceCoefficient * my / Math.sqrt(mx * mx + my * my)
        });

    },

    checkResizeGrow: function(newRadius) {
        if (newRadius > this.body.realRadius) {
            this.body.realRadius = newRadius;
            this.body.coefficient = /*this.body.coefficient *
            Math.sqrt(this.body.previousRadius / newRadius)*/
            this.body.multiplier / Math.sqrt(this.body.realRadius);
            //this.body.previousRadius = newRadius;
            if (this.coefficientTimeOut) clearTimeout(this.coefficientTimeOut);
            try {
                //console.log(this.body.coefficient);
                this.ws.send(JSON.stringify( {
                    "coefficient" : this.body.coefficient }));
            } catch (e) {
                console.log('Caught ' + e.name + ': ' + e.message);
            }
        }
    },

    //TODO: check for incorrect coefficient calculations
    checkResizeShrink: function() {
        this.body.realRadius = this.body.circleRadius;

        var self = this;
        this.traversDST(this.body, function(body) {
            var pos1 = self.body.position;
            var pos2 = body.position;
            var newRadius = Math.sqrt((pos1.x - pos2.x) * (pos1.x - pos2.x)
                + (pos1.y - pos2.y) * (pos1.y - pos2.y));
            if (newRadius > self.body.realRadius) {
                self.body.realRadius = newRadius;
            }
        });

        var coefficient = /*this.body.coefficient *
            Math.sqrt(this.body.previousRadius / this.body.realRadius);*/
            this.body.multiplier / Math.sqrt(this.body.realRadius);
        //this.body.previousRadius = this.body.realRadius;


        try {
            this.ws.send(JSON.stringify({
                "coefficient" : coefficient }));
            //console.log(coefficient);
        } catch (e) {
            console.log('Coefficient was not sent: '
                        + coefficient + ' ' +
                        e.name + ': ' + e.message);
        }

        //console.log(self.body.realRadius);

        if (this.coefficientTimeOut) clearTimeout(this.coefficientTimeOut);
        this.coefficientTimeOut = setTimeout(function() {
            self.body.coefficient = coefficient;
        }, 2000);
    }
};

Player.prototype.__proto__ = basicParticle.prototype;

module.exports = Player;
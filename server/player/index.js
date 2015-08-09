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

    this.ws = ws;

    var group = Body.nextGroup(true);

    this.CHARGE_RADIUS = 5;

    //creating physics body for player
    var element = params.getParameter(elem);
    this.body = Bodies.circle(position.x, position.y,
        element.radius + this.CHARGE_RADIUS,
        { restitution: 0.99, collisionFilter: { group: group } });

    this.setElement(elem);

    World.addBody(engine.world, this.body);

    var self = this;

    this.body.realMass = element.mass;

    this.body.inGameType = "player";
    this.body.chemicalBonds = 0;

    this.body.previousRadius = element.radius;
    this.body.coefficient = 1;
    this.body.chemicalChildren = [];
    this.body.realRadius = this.body.circleRadius;
    this.resolution = { width: 0, height: 0 };
    this.body.getFreeBonds = function() {
        return self.body.totalBonds - self.body.chemicalBonds;
    };
    this.body.getAvailableNeutrons = function() {
        return self.body.maxNeutrons - self.body.neutrons;
    };
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

    makeArrayCreator: function() {
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
    },

    recalculateMass: function() {
        this.body.realMass = this.calculateMass(this.body);
    },

    calculateMass: function(body) {
        var func = this.makeMassCalc();
        this.traversDST(body, func);
        return func.mass;
    },

    getBondsPositions: function() {
        var func = this.makeArrayCreator();
        this.traversDST(this.body, func);
        return func.bondPositions;
    },

    shoot: function(particle, shotPos, nucleonsArray, engine) {

        if (particle == "p" && this.body.element == "H") return;
        if (particle == "n" && this.body.neutrons == 0) return;

        if (!this["timeLimit" + particle]) {
            var element = params.getParameter(particle);

            var nucleonBody = this.createNucleon(particle, shotPos, nucleonsArray, engine);

            if (particle == "p") this.changeCharge(-1, engine, nucleonsArray);

            var self = this;

            this["timeLimit" + particle] = true;
            setTimeout(function() {
                self["timeLimit" + particle] = false;
            }, this.body.coolDown);

            nucleonBody.timerId1 = setTimeout(function() {
                nucleonBody.collisionFilter.group = 0;
            }, 1500);

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
        }
    },

    changeCharge: function(value, engine, nucleonsArray) {

        this.CHARGE_RADIUS = 5;

        if (this.body.element == "Ne" && value == 1) {
            value = -1;
            this.createNucleon("p", { x: Math.random(), y: Math.random() },
                                nucleonsArray, engine);
            this.createNucleon("p", { x: Math.random(), y: Math.random() },
                                nucleonsArray, engine);
        }

        var elementName = elements[elements.indexOf(
                        this.body.element) + value];

        this.setElement(elementName);

        if (this.body.chemicalBonds > this.body.totalBonds) {
            --this.body.chemicalBonds;


            var child = { body: null,
                            mass: 9999999999999 };

            for (var i = 0; i < this.body.chemicalChildren.length; ++i) {
                if (this.body.chemicalChildren[i]) {
                    var nextChild = {
                        body: this.body.chemicalChildren[i],
                        mass: this.calculateMass(this.body.chemicalChildren[i])
                    };
                    if (nextChild.mass < child.mass) child = nextChild;
                }
            }

            /*this.body.chemicalChildren.splice(
                this.body.chemicalChildren.indexOf(child.body), 1);*/

            this.traversDST(child.body, this.free, this.setRandomSpeed, engine);

            this.body.chemicalChildren[
                this.body.chemicalChildren.indexOf(child.body)] = null;

            this.body.previousAngle = undefined;
            for (i = this.body.chemicalChildren.length - 1; i >= 0; --i) {
                if (this.body.chemicalChildren[i] && !this.body.chemicalChildren
                        [(i + 1) % (this.body.chemicalChildren.length - 1)]) {
                    this.body.previousAngle = this.body.chemicalChildren[i].constraintAngle;
                }
            }

            if (!this.body.chemicalBonds) this.checkResizeShrink();
            //this.recalculateMass();
        }
    },

    //turns player into garbage before appending it to another player
    garbagify: function(playersArray, garbageArray, newPlayerBody) {
        delete (this.body.realRadius);
        delete (this.body.previousRadius);
        delete (this.body.coefficient);
        delete (this.body.resolution);

        this.ws.close(1000, "lost");
        if (newPlayerBody !== undefined) delete (this.ws);
        garbageArray.push(this);
        this.body.number = garbageArray.indexOf(this);
        delete playersArray[this.body.playerNumber];

        if (newPlayerBody !== undefined) {

            this.traversDST(this.body, function(node) {
                node.collisionFilter.group =
                    newPlayerBody.collisionFilter.group;
                node.playerNumber = newPlayerBody.playerNumber;

            });
            this.body.inGameType = "playerPart";
        } else {
            this.traversDST(this.body, function(node) {
                node.inGameType = "garbage";
            });
        }
    },

    applyVelocity: function(mx, my) {
        var speed = this.body.nuclearSpeed;

        var PERCENT_FULL = 100;
        var massCoefficient = 0;
        var minMultiplier = 20;
        var partsMultiplier = 2;
        var forceCoefficient = 490;

        var multiplier = PERCENT_FULL - this.body.realMass * massCoefficient;
        if (multiplier < minMultiplier) multiplier = minMultiplier;
        speed = speed / PERCENT_FULL * multiplier / partsMultiplier;

        //apply decreased velocity to all parts of the player

        var pos1 = this.body.position;

        speed *= partsMultiplier;

        //apply regular velocity to player.body only
        this.body.force = { x: 0, y: 0 };
        Body.applyForce(this.body, this.body.position,
        /*Body.setVelocity(this.body,*/ {
            x: speed / forceCoefficient * mx / Math.sqrt(mx * mx + my * my),
            y: speed / forceCoefficient * my / Math.sqrt(mx * mx + my * my)
        });

    },

    checkResizeGrow: function(newRadius) {
        if (newRadius > this.body.realRadius) {
            this.body.realRadius = newRadius;
            this.body.coefficient = this.body.coefficient *
                Math.sqrt(this.body.previousRadius / newRadius);
            this.body.previousRadius = newRadius;
            this.ws.send(JSON.stringify( {
                "coefficient" : this.body.coefficient }));
        }
    },

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

        var coefficient = this.body.coefficient *
            Math.sqrt(this.body.previousRadius / this.body.realRadius);
        this.body.previousRadius = this.body.realRadius;
        this.ws.send(JSON.stringify( {
            "coefficient" : coefficient } ));

        //console.log(self.body.realRadius);

        setTimeout(function() {
            self.body.coefficient = coefficient;
        }, 1500);
    },

    checkDecoupling: function(momentum) {

    }
};

Player.prototype.__proto__ = basicParticle.prototype;

module.exports = Player;
/**
 * Created by fatman on 06/07/15.
 */

var Matter = require('matter-js/build/matter.js');
var params = require("db");
var elements = params.getParameter("elements");

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite;

var Player = function(ws, position, engine, elem) {

    var group = Body.nextGroup(true);

    this.CHARGE_RADIUS = 7;

    //creating physics body for player
    var element = params.getParameter(elem);
    this.body = Bodies.circle(position.x, position.y,
        element.radius + this.CHARGE_RADIUS,
        { restitution: 0.99, collisionFilter: { group: group } });

    this.setElement(elem);

    World.addBody(engine.world, this.body);

    var self = this;

    this.mass = 0;

    this.body.inGameType = "player";
    this.body.chemicalBonds = 0;

    this.body.prevId = -1;
    this.body.previousRadius = 40;
    this.body.coefficient = 1;
    this.ws = ws;
    this.body.chemicalChildren= [];
    this.body.realRadius = this.body.circleRadius;
    this.body.coreId = this.body.id;
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

    setElement: function(elem) {
        var element = params.getParameter(elem);
        if (elem) {
            this.body.element = elem;
            var coefficient = (element.radius + this.CHARGE_RADIUS)
                / this.body.circleRadius;

            Body.scale(this.body, coefficient, coefficient);
            this.body.circleRadius = element.radius + this.CHARGE_RADIUS;

            this.body.totalBonds = element.valency;
            this.body.nuclearSpeed = element.speed;
            this.body.mass = element.mass;
            this.body.inverseMass = 1 / element.mass;
            this.body.coolDown = element.coolDown;
            this.body.neutrons = element.neutrons;
            this.body.maxNeutrons = element.maxNeutrons;
        }
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
        this.mass = this.calculateMass(this.body);
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

        if (particle == "Proton" && this.body.element == "Hydrogen") return;
        if (particle == "Neutron" && this.body.neutrons == 0) return;

        if (!this["timeLimit" + particle]) {
            var element = params.getParameter(particle);
            
            var OFFSET_SHOT = 8;

            var nucleonMass = 1;

            this.body.mass -= nucleonMass;
            
            var offset = this.body.circleRadius + OFFSET_SHOT;

            var mx = shotPos.x;
            var my = shotPos.y;

            var nucleon = {};

            var nucleonBody = Bodies.circle(this.body.position.x
                + offset * mx / Math.sqrt(mx * mx + my * my),
                this.body.position.y + offset * my
                / Math.sqrt(mx * mx + my * my), element.radius,
                {frictionAir: 0, restitution: 0.99, collisionFilter:
                { group: this.body.collisionFilter.group }});

            nucleonBody.inGameType = nucleonBody.element = particle;

            Matter.Body.setVelocity(nucleonBody, {
                x: element.speed * mx / Math.sqrt(mx * mx + my * my),
                y: element.speed * my / Math.sqrt(mx * mx + my * my)
            });

            nucleon.body = nucleonBody;
            World.addBody(engine.world, nucleonBody);
            nucleonsArray.push(nucleon);
            nucleonBody.number = nucleonsArray.indexOf(nucleon);

            if (particle == "Proton") this.changeCharge(-1, engine);

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

            if (particle == "Neutron") {

                --this.body.neutrons;

                this.body.inverseMass = 1 / this.body.mass;

                setTimeout(function() {
                    ++self.body.neutrons;
                    self.body.mass += nucleonMass;
                    self.body.inverseMass = 1 / self.body.mass;
                }, this.body.coolDown);
                setTimeout(function() {
                    nucleonBody.inGameType =
                        nucleonBody.element = "Proton";
                }, element.protonMorphing);
            }
        }
    },

    changeCharge: function(value, engine) {

        this.CHARGE_RADIUS = 5;

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

    free: function(node, engine) {

        node.inGameType = "temporary undefined";
        if (node.constraint1) {
            World.remove(engine.world, node.constraint1);
            World.remove(engine.world, node.constraint2);
            delete node["constraint1"];
            delete node["constraint2"];
        }
        node.chemicalBonds = 0;
        this.mass -= node.mass;
        setTimeout(function() {
            node.collisionFilter.group = 0;
            node.inGameType = "garbage";
        }, 1500);
    },

    die: function(engine) {
        this.traversDST(this.body, this.free, this.setRandomSpeed, engine);
    },

    applyVelocity: function(mx, my) {
        var speed = this.body.nuclearSpeed;

        var PERCENT_FULL = 100;
        var massCoefficient = 0.5;
        var minMultiplier = 20;
        var partsMultiplier = 9;

        var multiplier = PERCENT_FULL - this.mass * massCoefficient;
        if (multiplier < minMultiplier) multiplier = minMultiplier;
        speed = speed / PERCENT_FULL * multiplier / partsMultiplier;

        //apply decreased velocity to all parts of the player

        var pos1 = this.body.position;

        this.traversDST(this.body, function(body) {
            body.force = { x: 0, y: 0 };
            body.torque = 0;
            var pos2 = body.position;
            var distance = Math.sqrt((pos1.x - pos2.x) * (pos1.x - pos2.x)
                + (pos1.y - pos2.y) * (pos1.y - pos2.y));
            if (!distance) distance = 1;
            Body.applyForce(body, body.position,
            /*Matter.Body.setVelocity(body,*/ {
                x: speed / 100 / distance * mx / Math.sqrt(mx * mx + my * my),
                y: speed / 100 / distance * my / Math.sqrt(mx * mx + my * my)
            });
        });

        speed *= partsMultiplier;

        //apply regular velocity to player.body only
        Body.setVelocity(this.body, {
            x: speed * mx / Math.sqrt(mx * mx + my * my),
            y: speed * my / Math.sqrt(mx * mx + my * my)
        });

    },

    traversDST: function(node, visit, visitAgain, engine) {
        visit(node, engine);
        if (!node.chemicalChildren) return;
        for (var i = 0; i < node.chemicalChildren.length; ++i) {
            if (node.chemicalChildren[i]) {
                this.traversDST(node.chemicalChildren[i], visit, visitAgain, engine);
            }
        }
        if (visitAgain) {
            visitAgain(node);
        }
    },

    setRandomSpeed: function(body) {
        var speed = 10;
        Matter.Body.setVelocity(body, {
            x: Math.random() * speed,
            y: Math.random()* speed
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

        setTimeout(function() {
            self.body.coefficient = coefficient;
        }, 1500);
    }
};

module.exports = Player;
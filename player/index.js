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

    this.CHARGE_RADIUS = 5;

    //creating physics body for player
    var element = params.getParameter(elem);
    this.body = Bodies.circle(position.x, position.y,
        element.radius + this.CHARGE_RADIUS,
        { restitution: 0.99, collisionFilter: { group: group } });

    this.setElement(elem);

    this.body.composite = Composite.create();
    Composite.addBody(this.body.composite, this.body);

    World.addBody(engine.world, this.body);

    var self = this;

    this.mass = 0;

    this.body.inGameType = "player";
    this.body.chemicalBonds = 0;

    this.body.children = [];
    this.body.prevId = -1;
    this.body.previousRadius = 40;
    this.body.coefficient = 1;
    this.timeLimit = null;
    this.ws = ws;
    this.body.composites = [];
    this.body.realRadius = this.body.circleRadius;
    this.body.coreId = this.body.id;
    this.resolution = { width: 0, height: 0 };
    this.body.getFreeBonds = function() {
        return self.body.totalBonds - self.body.chemicalBonds;
    }
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
            this.body.speed = element.speed;
            this.body.mass = element.mass;
            this.body.inverseMass = 1 / element.mass;
        }
    },

    recalculateMass: function() {

        var self = this;
        this.mass = this.body.composites.reduce(function(sum, current) {
            if (current) {
                return sum + Composite.allBodies(current).reduce(
                    function(sum, current) {
                        if (current.id != self.body.id) {
                            return sum + current.mass;
                        }
                        return sum;
                    }, 0)
            }
            return sum;
        }, 0);
    },

    shoot: function(shotPos, protonsArray, engine) {

        if (!this.timeLimit && this.body.element != "Helium") {
            var element = params.getParameter("proton");

            var offset = this.body.circleRadius + 8;

            var mx = shotPos.x;
            var my = shotPos.y;

            var proton = {};

            var protonBody = Bodies.circle(this.body.position.x
                + offset * mx / Math.sqrt(mx * mx + my * my),
                this.body.position.y + offset * my
                / Math.sqrt(mx * mx + my * my), element.radius,
                {frictionAir: 0, restitution: 0.99, collisionFilter:
                { group: this.body.collisionFilter.group }});

            protonBody.inGameType = protonBody.element = "proton";

            Matter.Body.setVelocity(protonBody, {
                x: element.speed * mx / Math.sqrt(mx * mx + my * my),
                y: element.speed * my / Math.sqrt(mx * mx + my * my)
            });

            proton.body = protonBody;
            World.addBody(engine.world, protonBody);
            protonsArray.push(proton);
            protonBody.number = protonsArray.indexOf(proton);


            this.changeCharge(-1, engine);

            var self = this;

            this.timeLimit = true;
            setTimeout(function() {
                self.timeLimit = false;
            }, 10000);

            protonBody.timerId1 = setTimeout(function() {
                protonBody.collisionFilter.group = 0;
            }, 2000);

            protonBody.timerId2 = setTimeout(function() {
                if (protonsArray[protonBody.number]) {
                    delete protonsArray[protonBody.number];
                }
            }, 10000);
        }
    },

    changeCharge: function(value, engine) {

        this.CHARGE_RADIUS = 5;

        var elementName = elements[elements.indexOf(
                        this.body.element) + value];

        this.setElement(elementName);

        if (this.body.chemicalBonds > this.body.totalBonds) {
            --this.body.chemicalBonds;

            var compositeToDelete = null;

            for (var i = 0; i < this.body.composites.length; ++i) {
                if (compositeToDelete == null) {
                    compositeToDelete = this.body.composites[i];
                } else if (this.body.composites[i] && Composite.allBodies(
                        this.body.composites[i]).length <
                    Composite.allBodies(compositeToDelete).length) {
                    compositeToDelete = this.body.composites[i];
                }
            }

            var bodies = Composite.allBodies(compositeToDelete);
            var constraints = Composite.allConstraints(compositeToDelete);

            for (i = 0; i < constraints.length; ++i) {
                World.remove(engine.world, constraints[i]);
            }

            for (i = 0; i < bodies.length; ++i) {
                bodies[i].inGameType = "garbage";
                bodies[i].collisionFilter.group = 0;
            }

            this.body.composites[this.body.composites.indexOf(compositeToDelete)] = null;

            if (!this.body.chemicalBonds) this.checkResizeShrink();
            this.recalculateMass();
        }
    },

    applyVelocity: function(mx, my) {
        var speed = params.getParameter(this.body.element).speed;

        var PERCENT_FULL = 100;
        var self = this;

        var multiplier = PERCENT_FULL - this.mass * 2;
        if (multiplier < 10) multiplier = 10;
        speed = speed / PERCENT_FULL * multiplier;
        //console.log(speed);

        //apply regular velocity to player.body only
        Matter.Body.setVelocity(this.body, {
            x: speed * mx / Math.sqrt(mx * mx + my * my),
            y: speed * my / Math.sqrt(mx * mx + my * my)
        });

        speed /= 2;

        //apply decreased velocity to all parts of the player

        this.body.composites.forEach(function(item) {
            if (item) {
                Composite.allBodies(item).forEach(function(item) {
                    if (item.id != self.body.id) {
                        Matter.Body.setVelocity(item, {
                            x: speed * mx / Math.sqrt(mx * mx + my * my),
                            y: speed * my / Math.sqrt(mx * mx + my * my) })
                    }
                });
            }
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

        for (var i = 0; i < this.body.composites.length; ++i) {
            if (!this.body.composites[i]) continue;
            var bodies = Composite.allBodies(this.body.composites[i]);
            for (var j = 0; j < bodies.length; ++j) {
                var pos1 = this.body.position;
                var pos2 = bodies[j].position;
                var newRadius = Math.sqrt((pos1.x - pos2.x) * (pos1.x - pos2.x)
                    + (pos1.y - pos2.y) * (pos1.y - pos2.y));
                if (newRadius > this.body.realRadius) {
                    this.body.realRadius = newRadius;
                }
            }
        }

        var coefficient = this.body.coefficient *
            Math.sqrt(this.body.previousRadius / this.body.realRadius);
        this.body.previousRadius = this.body.realRadius;
        this.ws.send(JSON.stringify( {
            "coefficient" : coefficient } ));
        var self = this;
        setTimeout(function() {
            self.body.coefficient = coefficient;
        }, 1500);
    }
};

module.exports = Player;
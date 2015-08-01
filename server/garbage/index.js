/**
 * Created by fatman on 13/07/15.
 */

var params = require("db");
var elements = params.getParameter("elements");
var Matter = require('matter-js/build/matter.js');

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite;

var Garbage = function(position, engine, elem) {

    this.CHARGE_RADIUS = 5;

    var element = params.getParameter(elem);
    this.body = Bodies.circle(position.x, position.y,
        element.radius + this.CHARGE_RADIUS,
        { frictionAir: 0.07, restitution: 0.99 });

    this.setElement(elem);

    World.addBody(engine.world, this.body);

    var self = this;
    this.body.inGameType = "garbage";
    this.body.prevId = -1;
    this.body.chemicalBonds = 0;
    this.body.chemicalChildren = [];
    this.body.getFreeBonds = function() {
        return self.body.totalBonds - self.body.chemicalBonds;
    }
};

Garbage.prototype = {
    setElement: function(elem) {
        if (elem) {
            var element = params.getParameter(elem);
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
    changeCharge: function(value, engine) {

        this.CHARGE_RADIUS = 5;

        var elementName = elements[elements.indexOf(
            this.body.element) + value];

        this.setElement(elementName);

        if (this.body.chemicalBonds > this.body.totalBonds /*&&
            this.body.composite*/) {

            if (this.body.chemicalBonds > 1) {
                var child = this.body.chemicalChildren.pop();
                this.traversDST(child, this.free, this.setRandomSpeed, engine);
                --this.body.chemicalBonds;
            } else {
                this.traversDST(this.body, this.free, engine);
            }
            return true;
        }
        return false;
    },

    traversDST: function(node, visit, visitAgain, engine) {
        visit(node, engine);
        if (!node.chemicalChildren) return;
        for (var i = 0; i < node.chemicalChildren.length; ++i) {
            this.traversDST(node.chemicalChildren[i], visit, visitAgain, engine);
        }
        visitAgain(node);
    },

    setRandomSpeed: function(body) {
        var speed = 10;
        Matter.Body.setVelocity(body, {
            x: Math.random() * speed,
            y: Math.random()* speed
        });
    },

    free: function(node, engine) {
        node.inGameType = "garbage";
        World.remove(engine.world, node.constraint1);
        World.remove(engine.world, node.constraint2);
        delete node["constraint1"];
        delete node["constraint2"];
        node.chemicalBonds = 0;
        node.collisionFilter.group = 0;
    }
};

module.exports = Garbage;
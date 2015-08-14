/**
 * Created by fatman on 13/07/15.
 */

var params = require("db");
var elements = params.getParameter("elements");
var Matter = require('matter-js/build/matter.js');
var basicParticle = require("../basic particle");

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
        { frictionAir: 0.003, restitution: 0.99 });

    this.setElement(elem);

    World.addBody(engine.world, this.body);

    var self = this;
    this.body.inGameType = "garbage";
    this.body.chemicalBonds = 0;
    this.body.chemicalChildren = [];
    this.body.getFreeBonds = function() {
        return self.body.totalBonds - self.body.chemicalBonds;
    };
    this.body.getAvailableNeutrons = function() {
        return self.body.maxNeutrons - self.body.neutrons;
    }
};

Garbage.prototype = {

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

        if (this.body.chemicalBonds > this.body.totalBonds /*&&
            this.body.composite*/) {

            if (this.body.chemicalBonds > 1) {
                var child = this.body.chemicalChildren.pop();
                this.traversDST(child, this.free, this.setRandomSpeed, engine);
                --this.body.chemicalBonds;
            } else {
                this.traversDST(this.body, this.free, null, engine);
            }
            if (this.body.chemicalBonds == 0) {
                this.body.previousAngle = undefined;
            } else {
                this.body.previousAngle -= 2 * Math.PI / this.body.totalBonds;
            }
        }
    }
};

Garbage.prototype.__proto__ = basicParticle.prototype;

module.exports = Garbage;
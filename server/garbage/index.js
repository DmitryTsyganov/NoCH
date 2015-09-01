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

    basicParticle.call(this, position, engine, elem);

    this.body.frictionAir = 0.003;

    this.body.inGameType = "garbage";
};

Garbage.prototype = {

    dismountBranch: function(engine) {
        if (this.body.chemicalBonds > 1) {
            var child = this.body.chemicalChildren.pop();
            this.traversDST(child, this.free, this.letGo, engine);
        } else {
            this.traversDST(this.body, this.free, this.letGo, engine);
        }
    },

    correctBondAngles: function(engine) {
        if (this.body.chemicalParent) {
            this.freeBondAngle.call({ body: this.body.chemicalParent },
                this.body.constraint1.chemicalAngle);
            //this.freeBondAngle(this.constraint2.chemicalAngle);
            var self = {};
            self.connectBody = this.connectBody;
            self.freeBondAngle = this.freeBondAngle;
            self.correctParentBond = this.correctParentBond;
            self.getClosestAngle = this.getClosestAngle;
            self.body = this.body.chemicalParent;
            ++this.body.superMutex;
            ++self.body.superMutex;

            this.reconnectBond.call(self, this.body, engine);
        }
        this.correctBondAnglesFinal(engine);
    }
};

Garbage.prototype.__proto__ = basicParticle.prototype;

module.exports = Garbage;
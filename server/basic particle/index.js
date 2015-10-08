/**
 * Created by fatman on 06/08/15.
 */

var Geometry = require("geometry");
var Matter = require('matter-js/build/matter.js');
var params = require("db");
var elements = params.getParameter("elements");

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite;

var basicParticle = function(position, engine, elem) {
    this.CHARGE_RADIUS = 5;

    //creating physics body for player
    var element = params.getParameter(elem);
    this.body = Bodies.circle(position.x, position.y,
        element.radius + this.CHARGE_RADIUS,
        { restitution: 0.99 });

    this.body.occupiedAngle = null;
    this.body.inertia = 0;
    this.body.inverseInertia = 0;

    this.setElement(elem);

    this.body.bondAngles = [];
    var angle = 0;
    for (var i = 0; i < this.body.totalBonds; ++i) {
        this.body.bondAngles.push({ "angle": angle, "available": true });
        angle += 2 * Math.PI / this.body.totalBonds;
    }

    World.addBody(engine.world, this.body);

    var self = this;
    this.body.chemicalBonds = 0;
    this.body.chemicalChildren = [];

    this.body.getFreeBonds = function() {
        return self.body.totalBonds - self.body.chemicalBonds;
    };
    this.body.getAvailableNeutrons = function() {
        return self.body.maxNeutrons - self.body.neutrons;
    };

};

basicParticle.prototype = {
    traversDST: function(node, visit, visitAgain, engine) {
        visit(node, engine);
        if (!node.chemicalChildren) {
            if (visitAgain) {
                visitAgain(node);
            }
            return;
        }
        for (var i = 0; i < node.chemicalChildren.length; ++i) {
            if (node.chemicalChildren[i]) {
                this.traversDST(node.chemicalChildren[i], visit, visitAgain, engine);
            }
        }
        if (visitAgain) {
            visitAgain(node);
        }
    },

    //second part of disconnecting body from player
    letGo: function(body) {
        body.chemicalChildren = [];
        var speed = Math.random() * 3;

        var pos;
        if (body.parentPosition) {
            pos = body.parentPosition;
            delete body.parentPosition;
        } else {
            pos = { x: Math.random(), y: Math.random() };
        }

        var mx = body.position.x - pos.x;
        var my = body.position.y - pos.y;

        Matter.Body.setVelocity(body, {
            x: speed * mx / Math.sqrt(mx * mx + my * my),
            y: speed * my / Math.sqrt(mx * mx + my * my)
        });
    },

    //first part of disconnecting body from player
    free: function(node, engine, breakConstraints) {

        if (node.typeTimeout) clearTimeout(node.typeTimeout);
        node.inGameType = "temporary undefined";

        if (node.chemicalParent) {
            delete node.chemicalParent.chemicalChildren[
                node.chemicalParent.chemicalChildren
                    .indexOf(node)];
            /*node.chemicalParent.previousAngle -= 2 * Math.PI / node.chemicalParent.totalBonds;*/

            //console.log("angle to free " + node.constraint1.chemicalAngle);

            for (var i = 0; i < node.bondAngles.length; ++i) {
                if (node.bondAngles[i].angle ==
                    node.constraint2.chemicalAngle) {
                    node.bondAngles[i].available = true;
                }
            }

            if (node.occupiedAngle) {
                /*node.chemicalParent.bondAngles[
                 node.chemicalParent.bondAngles.indexOf(node.occupiedAngle)].availible = true;*/
                node.chemicalParent.bondAngles.forEach(function(obj) {
                    if (obj.angle == node.occupiedAngle) {
                        obj.available = true;
                    }
                });
                node.occupiedAngle = null;
            }

            if (node.chemicalParent.chemicalBonds) {
                --node.chemicalParent.chemicalBonds;
            }
            //console.log("Now parent has " + node.chemicalParent.chemicalBonds);
            //console.log("But test says that " + node.chemicalParent.getFreeBonds());
            node.parentPosition = node.chemicalParent.position;
            delete node.chemicalParent;
        }

        if (node.player) {
            //console.log(node.player.body.realMass);
            node.player.body.realMass -= node.mass;
            //console.log(" - " + node.mass + " = " + node.player.body.realMass);
        }

        if (node.constraint1) {
            World.remove(engine.world, node.constraint1);
            World.remove(engine.world, node.constraint2);
            delete node["constraint1"];
            delete node["constraint2"];
        }
        node.collisionFilter.group = 0;
        --node.chemicalBonds;

        node.typeTimeout = setTimeout(function() {
            node.playerNumber = -1;
            node.inGameType = "garbage";
        }, 1500);
    },

    setElement: function(elem) {
        if (elem) {
            var element = params.getParameter(elem);
            this.body.element = elem;
            var coefficient = (element.radius + this.CHARGE_RADIUS)
                / this.body.circleRadius;

            Body.scale(this.body, coefficient, coefficient);
            this.body.circleRadius = element.radius + this.CHARGE_RADIUS;

            this.body.totalBonds = element.valency;
            this.body.nuclearSpeed = element.speed;
            this.body.realMass -= this.body.mass;
            this.body.mass = element.mass;
            this.body.realMass += this.body.mass;
            this.body.inverseMass = 1 / element.mass;
            this.body.coolDown = element.coolDown;
            this.body.neutrons = element.neutrons;
            this.body.maxNeutrons = element.maxNeutrons;

            if (this.body.bondAngles) {
                var angle = 0;
                while (this.body.bondAngles.length < this.body.totalBonds) {
                    this.body.bondAngles.push({ "angle": 0, "available": true });
                }
                for (var i = 0; i < this.body.totalBonds; ++i) {
                    this.body.bondAngles[i].angle = angle;
                    angle += 2 * Math.PI / this.body.totalBonds;
                }
                while (this.body.bondAngles.length > this.body.totalBonds) {
                    this.body.bondAngles.pop();
                }
            }
        }
    },

    createNucleon: function(particle, shotPos, nucleonsArray, engine) {
        var element = params.getParameter(particle);

        var OFFSET_SHOT = 8;

        this.body.mass -= element.mass;

        var offset = this.body.circleRadius + OFFSET_SHOT;

        var mx = shotPos.x;
        var my = shotPos.y;

        var nucleon = {};

        var nucleonBody = Bodies.circle(this.body.position.x
            + offset * mx / Math.sqrt(mx * mx + my * my),
            this.body.position.y + offset * my
            / Math.sqrt(mx * mx + my * my), element.radius,
            {frictionAir: 0, restitution: 0.99, collisionFilter:
            { mask: 0x0007 }});

        nucleonBody.inGameType = nucleonBody.element = particle;

        Matter.Body.setVelocity(nucleonBody, {
            x: element.speed * mx / Math.sqrt(mx * mx + my * my),
            y: element.speed * my / Math.sqrt(mx * mx + my * my)
        });

        nucleon.body = nucleonBody;
        World.addBody(engine.world, nucleonBody);
        nucleonsArray.push(nucleon);
        nucleonBody.number = nucleonsArray.indexOf(nucleon);
        return nucleonBody;
    },

    returnPostRevertTree: function() {
        function revertTree(node) {
            if (revertTree.previousNode) {
                node.chemicalChildren.push(revertTree.previousNode);
                revertTree.previousNode.chemecalParent = node;
                revertTree.previousNode.chemicalChildren.splice(
                    revertTree.previousNode.chemicalChildren
                    .indexOf(node), 1);
                revertTree.previousNode.constraint1 = node.constraint1;
                revertTree.previousNode.constraint2 = node.constraint2;
            }
            revertTree.previousNode = node;
        }
        revertTree.previousNode = null;
        return revertTree;
    },

    prepareForBond: function(newPlayerBody) {
        this.traversDST(this.body, function(node) {
            //if (node.typeTimeout) clearTimeout(node.typeTimeout);
            node.inGameType += " temporary undefined";
            /*node.inGameType = "playerPart";*/
            if (newPlayerBody) {
                node.playerNumber = newPlayerBody.playerNumber;
            }
            /*node.collisionFilter.group =
                newPlayerBody.collisionFilter.group;*/

        });
    },

    markAsPlayer: function(newPlayerBody) {
        this.traversDST(this.body, function(node) {
            if (node.typeTimeout) clearTimeout(node.typeTimeout);
            node.inGameType = "playerPart";
            node.playerNumber = newPlayerBody.playerNumber;
        });
    },

    /*returnRevertTree: function() {
        function revertTree(node) {
            node.oldParent = node.chemicalParent;
            if (node.chemicalParent) {
                node.chemicalChildren.push(node.chemicalParent);
            }

            /!*for (var i = 0; i < node.chemicalChildren.length; ++i) {
                if (node.chemicalChildren[i].id == node.id) {
                    node.chemicalParent = node.chemicalChildren[i];
                    node.chemicalChildren.splice(i, 1);
                }
            }*!/

            node.chemicalParent = revertTree.newParent;
            if (revertTree.newParent) {
                node.chemicalChildren.splice(node.chemicalChildren
                    .indexOf(revertTree.newParent), 1);
            }
            var temporary1 = null, temporary2 = null;
            if (node.constraint1) {
                temporary1 = node.constraint1;
                temporary2 = node.constraint2;
            }
            node.constraint1 = revertTree.constraint1;
            node.constraint2 = revertTree.constraint2;

            revertTree.constraint1 = temporary1;
            revertTree.constraint2 = temporary2;

            revertTree.newParent = node;
        }
        revertTree.newParent = null;
        revertTree.constraint1 = null;
        revertTree.constraint2 = null;

        return revertTree;

    },*/

    die: function(engine) {
        this.traversDST(this.body, this.free, this.letGo, engine);
    },

    reversDST: function(node, visit) {
        if (!node.chemicalParent) {
            visit(node);
            return;
        }
        this.reversDST(node.chemicalParent, visit);
        visit(node);

    },

    reverse: function() {
        var func = this.returnPostRevertTree();
        this.reversDST(this.body, func);
    },

    checkDecoupling: function(momentum, engine) {
        var bondStrength = 200;
        if (momentum > bondStrength && this.body.chemicalBonds) {
            this.traversDST(this.body, this.free, this.letGo, engine);
            if (this.body.player) {
                this.body.player.checkResizeShrink();
            }
        }
    },

    getClosestAngle: function(angle) {
        //console.log("given angle " + angle);
        var bondAngles = this.body.bondAngles;
        var difference = this.body.bondAngles.map(function(obj) {
            var diff = Math.abs(obj.angle - angle);
            if (angle > Math.PI / 2 * 3 && obj.angle == 0) diff = 0;
            if(!obj.available) diff = Infinity;
            return {"diff": diff,
                    "index": bondAngles.indexOf(obj)};
        }).sort(function(a, b) {
            return a.diff - b.diff;
        });
        for (var i = 0; i < bondAngles.length; ++i) {
            if (bondAngles[i].available) {
                //console.log("possible angle " + bondAngles[i].angle);
            }
        }
        this.body.bondAngles[difference[0].index].available = false;
        //console.log("closest angle " + this.body.bondAngles[difference[0].index].angle);
        return this.body.bondAngles[difference[0].index].angle;
    },

    freeBondAngle: function(angle) {
        for (var i = 0; i < this.body.bondAngles.length; ++i) {
            if (this.body.bondAngles[i].angle == angle) {
                this.body.bondAngles[i].available = true;
            }
        }
    },

    reconnectBond: function(child, engine) {
        this.freeBondAngle.call({ body: child }, child.constraint2.chemicalAngle);

        World.remove(engine.world, child.constraint1);
        World.remove(engine.world, child.constraint2);
        delete child["constraint1"];
        delete child["constraint2"];

        var self = this;

        this.connectBody(child, function(playerBody, garbageBody, angle, garbageAngle) {
            var stiffness = 0.05;

            var constraintA = Matter.Constraint.create({
                bodyA: playerBody, bodyB: garbageBody,
                pointA: {
                    x: garbageBody.position.x - playerBody.position.x,
                    y: garbageBody.position.y - playerBody.position.y
                }, stiffness: stiffness
            });
            var constraintB = Matter.Constraint.create({
                bodyA: garbageBody, bodyB: playerBody,
                pointA: {
                    x: playerBody.position.x - garbageBody.position.x,
                    y: playerBody.position.y - garbageBody.position.y
                }, stiffness: stiffness
            });

            garbageBody.constraint1 = constraintA;
            garbageBody.constraint1.chemicalAngle = angle;
            garbageBody.constraint2 = constraintB;
            garbageBody.constraint2.chemicalAngle = garbageAngle;
            World.add(engine.world, [constraintA, constraintB]);
            garbageBody.collisionFilter.mask = 0x0001;
            /*var newSelf = {};
            newSelf.body = garbageBody;
            newSelf.changeBranchAvailability = self.changeBranchAvailability;
            newSelf.reversDST = self.reversDST;
            self.unmuteBranch.call(newSelf);*/
        });
    },

    correctBondAnglesFinal: function(engine) {
        console.log("working with " + this.body.element + " at " +
            JSON.stringify(this.body.position));
        console.log("correctBondAnglesFinal started");
        var body = this.body;
        for (var i = 0; i < body.chemicalChildren.length; ++i) {

            var child = body.chemicalChildren[i];

            if (child) {
                console.log("working with " + child.element + " at " +
                    JSON.stringify(child.position));
                //child.collisionFilter.mask = 0x0008;
                this.reconnectBond(child, engine);
            }
        }
        console.log("correctBondAnglesFinal ended");
    },

    changeCharge: function(value, engine, nucleonsArray) {
        console.log("changeCharge started");
        console.log("working with " + this.body.element + " at " +
            JSON.stringify(this.body.position));
        //this.body.collisionFilter.mask = 0x0008;

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
            this.dismountBranch(engine);
        }
        for (var i = 0; i < this.body.bondAngles.length; ++i) {
            this.body.bondAngles[i].available = true;
        }

        if (this.body.chemicalBonds) {
            this.correctBondAngles(engine);
        }
            //this.body.collisionFilter.mask = 0x0001;
        console.log("changeCharge Ended");
    },

    connectBody: function(garbageBody, finalCreateBond) {
        var i = 0;
        var N = 30;     // Number of iterations

        garbageBody.collisionFilter.mask = 0x0008;      // turn off collisions

        var currentAngle = Geometry.findAngle(this.body.position,
            garbageBody.position, this.body.angle);
        var angle = this.getClosestAngle(currentAngle);
        garbageBody.occupiedAngle = angle;

        //console.log("current angle = " + currentAngle);
        //console.log("target angle = " + angle);
        var realAngle = angle;

        if (currentAngle > 3 * Math.PI / 2 && angle == 0) realAngle = 2 * Math.PI;
        var difference = realAngle - currentAngle;
        if (Math.abs(difference) > Math.PI) {
            difference = difference < 0 ? 2 * Math.PI +
            difference : difference - 2 * Math.PI;
        }

        N = Math.abs(Math.round(N / Math.PI / 2 * difference)) * 2 + 1;
        //console.log("N = " + N);
        var step = difference / N;
        //console.log("step =" + step);

        var self = this;
        var intervalID = setInterval(function () {
            var pos1 = self.body.position;
            //var pos2 = prev.position;

            var ADDITIONAL_LENGTH = 20;

            var delta = {
                x: ((self.body.circleRadius + garbageBody.circleRadius
                + ADDITIONAL_LENGTH)
                * Math.cos(currentAngle + step * i + self.body.angle)
                + pos1.x - garbageBody.position.x) /*/ (N - i)*/,
                y: ((self.body.circleRadius + garbageBody.circleRadius
                + ADDITIONAL_LENGTH)
                * Math.sin(currentAngle + step * i + self.body.angle)
                + pos1.y - garbageBody.position.y) /*/ (N - i)*/
            };

            Body.translate(garbageBody, {
                x: delta.x,
                y: delta.y });

            if (i++ === N) {
                clearInterval(intervalID);
                /*console.log('final:\tx = ' + garbageBody.position.x +
                 '\ny = ' + garbageBody.position.y);*/

                var garbageAngle = self.correctParentBond.call(self, garbageBody, self.body);

                /*var rotationAngle = Geometry.findAngle(garbageBody.position,
                    self.body.position, garbageBody.angle);

                var garbageAngle = self.getClosestAngle.call({ body: garbageBody }, rotationAngle);

                //console.log("current angle " + rotationAngle);
                //console.log("target angle " + garbageAngle);
                Body.rotate(garbageBody, (rotationAngle - garbageAngle));*/
                garbageBody.occupiedAngle = null;
                if (finalCreateBond) {
                    finalCreateBond(self.body, garbageBody, angle, garbageAngle);
                }
            }
        }, 30);
    },

    correctParentBond: function(garbageBody, parentBody) {
        var rotationAngle = Geometry.findAngle(garbageBody.position,
            parentBody.position, garbageBody.angle);

        var garbageAngle = this.getClosestAngle.call({ body: garbageBody }, rotationAngle);

        //console.log("current angle " + rotationAngle);
        //console.log("target angle " + garbageAngle);
        Body.rotate(garbageBody, (rotationAngle - garbageAngle));
        return garbageAngle;
    }
};

module.exports = basicParticle;
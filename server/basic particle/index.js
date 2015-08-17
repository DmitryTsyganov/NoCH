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

var basicParticle = {};

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
            pos = {x: Math.random(), y: Math.random()};
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

            for (i = 0; i < node.chemicalParent.bondAngles.length; ++i) {
                //console.log("candidate angle " + node.chemicalParent.bondAngles[i].angle);
                if (node.chemicalParent.bondAngles[i].angle ==
                    node.constraint1.chemicalAngle) {
                    node.chemicalParent.bondAngles[i].available = true;
                }
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
            if (node.typeTimeout) clearTimeout(node.typeTimeout);
            node.inGamtype = "temporary undefined";
            node.typeTimeout = setTimeout(function() {
                node.inGameType = "playerPart";
                node.playerNumber = newPlayerBody.playerNumber;
            }, 1500);
            node.collisionFilter.group =
                newPlayerBody.collisionFilter.group;

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
        var bondStrength = 2500;
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

    freeAngle: function(body, angle) {
        for (var i = 0; i < body.bondAngles; ++i) {
            if (body.bondAngles[i].angle == angle) {
                body.bondAngles[i].available = true;
            }
        }
    },

    //TODO: figure out how to prevent branch from disconnecting (reverseDST???)
    //TODO: apply KISS to this function (transport createBond here???)
    correctBondAngles: function(engine) {
        var body = this.body;
        for (var i = 0; i < body.chemicalChildren.length; ++i) {

            var child = body.chemicalChildren[i];
            if (child) {

                var angle = this.getClosestAngle(child.constraint1.chemicalAngle);

                World.remove(engine.world, child.constraint1);
                World.remove(engine.world, child.constraint2);
                delete child["constraint1"];
                delete child["constraint2"];

                var delta = {
                    x: ((body.circleRadius + child.circleRadius)
                    * Math.cos(angle + body.angle)
                    + body.position.x - child.position.x),
                    y: ((body.circleRadius + child.circleRadius)
                    * Math.sin(angle + body.angle)
                    + body.position.y - child.position.y)
                };

                Body.translate(child, {
                    x: delta.x,
                    y: delta.y
                });

                var rotationAngle = Geometry.findAngle(child.position,
                    body.position, child.angle);

                var garbageAngle = this.getClosestAngle(rotationAngle);

                Body.rotate(child, (rotationAngle - garbageAngle));

                var stiffness = 0.05;

                var constraintA = Matter.Constraint.create({
                    bodyA: body, bodyB: child,
                    pointA: {
                        x: child.position.x - body.position.x,
                        y: child.position.y - body.position.y
                    }, stiffness: stiffness
                });
                var constraintB = Matter.Constraint.create({
                    bodyA: child, bodyB: body,
                    pointA: {
                        x: body.position.x - child.position.x,
                        y: body.position.y - child.position.y
                    }, stiffness: stiffness
                });

                child.constraint1 = constraintA;
                child.constraint1.chemicalAngle = angle;
                child.constraint2 = constraintB;
                child.constraint2.chemicalAngle = garbageAngle;
                World.add(engine.world, [constraintA, constraintB]);
            }
        }
    }
};

module.exports = basicParticle;
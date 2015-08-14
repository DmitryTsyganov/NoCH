/**
 * Created by fatman on 06/08/15.
 */

var Matter = require('matter-js/build/matter.js');
var params = require("db");
var elements = params.getParameter("elements");

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite;

var basicParticle = function() {

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

    setRandomSpeed: function(body) {
        body.chemicalChildren = []; //TODO: rename function
        var speed = 10;
        Matter.Body.setVelocity(body, {
            x: Math.random() * speed,
            y: Math.random()* speed
        });
    },

    free: function(node, engine, breakConstraints) {

        node.inGameType = "temporary undefined";
        if (node.chemicalParent) {
            switch (node.chemicalParent.inGameType) {
                case "playerPart" :
                    node.chemicalParent.chemicalChildren.splice(
                        node.chemicalParent.chemicalChildren
                            .indexOf(node), 1);
                    break;
                case "player":
                    delete node.chemicalParent.chemicalChildren[
                        node.chemicalParent.chemicalChildren
                            .indexOf(node)];
            }
            node.chemicalParent.previousAngle -= 2 * Math.PI / node.chemicalParent.totalBonds;
            if (node.chemicalParent.chemicalBonds) {
                --node.chemicalParent.chemicalBonds;
            }
            delete node.chemicalParent;
        }
        if (node.player) {
            console.log(node.player.body.realMass);
            node.player.body.realMass -= node.mass;
            console.log(" - " + node.mass + " = " + node.player.body.realMass);
        }

        if (node.constraint1) {
            World.remove(engine.world, node.constraint1);
            World.remove(engine.world, node.constraint2);
            delete node["constraint1"];
            delete node["constraint2"];
        }
        node.chemicalBonds = 0;
        /*if (this.body.realMass) {
        }*/
        setTimeout(function() {
            node.collisionFilter.group = 0;
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
        this.traversDST(this.body, function (node) {
            node.inGameType = "playerPart";
            node.collisionFilter.group =
                newPlayerBody.collisionFilter.group;
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
        this.traversDST(this.body, this.free, this.setRandomSpeed, engine);
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
        var bondStrength = 25;
        if (momentum > bondStrength) {
            this.traversDST(this.body, this.free, null, engine);
            if (this.body.player) {
                this.body.player.checkResizeShrink();
            }
        }
    }
};

module.exports = basicParticle;
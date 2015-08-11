;(function() {
    var Noch = function(canvasId) {
        this.canvas = document.getElementById(canvasId);
        var ctx = this.canvas.getContext('2d');

        this.started = false;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;


        this.gameSize = { x: this.canvas.width,
                          y: this.canvas.height };

        //var arrayOfImages0 = [];
        this.arrayOfImages1 = [];
        this.arrayOfImages2 = [];
        this.arrayOfImages3 = [];
        this.arrayOfClouds = [];
        var flag_array = 0;

       // this.backImageCount0 = 1;
        this.backImageCount1 = 30;
        this.backImageCount2 = 35;
        this.backImageCount3 = 30;
        this.cloudsCount = 29;
        this.numberOfClouds = 29;
        this.numberOfObjects1 = 200;
        this.numberOfObjects2 = 75;
        this.numberOfObjects3 = 40;
        this.backGroundOffset = this.gameSize.y/2;

        function imageLoaded(){
            flag_array++;
        }


        for (var i = 1; i < this.cloudsCount + 1; i++){
            var img = new Image();
            img.src = "clouds2/" + String(i) + ".png";
            this.arrayOfClouds.push(img);
            img.onload = imageLoaded();
        }

        for (i = 1; i < this.backImageCount3 + 1; i++){
            img = new Image();
            img.src = "33sloy/" + "q" + String(i) + ".png";
            this.arrayOfImages3.push (img);
            img.onload = imageLoaded();
        }

        for (i = 1; i < this.backImageCount2 + 1; i++){
            img = new Image();
            img.src = "22sloy/" + String(i) + ".png";
            this.arrayOfImages2.push (img);
            img.onload = imageLoaded();
        }

        for (i = 1; i < this.backImageCount1 + 1; i++){
            img = new Image();
            img.src = "1sloy/" + String(i) + ".png";
            this.arrayOfImages1.push (img);
            img.onload = imageLoaded();
        }


        this.backObjectClass = function (gameSize) {
            this.check = function (point, speed, vector, trajectory){
                var position = freshData.Scale ({x : point.x, y : point.y});
                if(position.x > gameSize.x + gameSize.y / 2) {
                    point.x = - gameSize.y / 2;
                    point.y = Math.random() * (2 * gameSize.y) - gameSize.y / 2;

                }
                if(position.x < - gameSize.y / 2) {
                    point.x = gameSize.x + gameSize.y / 2;
                    point.y = Math.random() * (2 * gameSize.y) - gameSize.y / 2;
                }
                if(position.y < - gameSize.y / 2) {
                    point.x = Math.random() * (gameSize.x + gameSize.y) - gameSize.y / 2;
                    point.y = 1.5 * gameSize.y;
                }
                if(position.y > 1.5 * gameSize.y) {
                    point.x = Math.random() * (gameSize.x + gameSize.y) - gameSize.y / 2;
                    point.y = - gameSize.y / 2;
                }
            };
            this.checkCloud = function (point, image){
                var position = freshData.Scale ({x : point.x, y : point.y});
                if (position.x > gameSize.x + image.width) {
                    point.x = - image.width * 1.5;
                    point.y = Math.random() * (2 * gameSize.y) - gameSize.y / 2;

                }
                if (position.x < - image.width * 2) {
                    point.x = gameSize.x + image.width * 0.5;
                    point.y = Math.random() * (2 * gameSize.y) - gameSize.y / 2;
                }
                if (position.y < - image.height * 2) {
                    point.x = Math.random() * (gameSize.x + gameSize.y) - gameSize.y / 2;
                    point.y = gameSize.y + image.height * 0.5;
                }
                if (position.y >  gameSize.y + image.height) {
                    point.x = Math.random() * (gameSize.x + gameSize.y) - gameSize.y / 2;
                    point.y = - image.height * 1.5;
                }
            };
            this.move = function (point, speed, vector, angle, trajectory){
                switch (trajectory % 3){
                    case 0: // translation
                        point.x += speed * vector.x;
                        point.y += 0.7 * speed * vector.y;
                        break;
                    case 1: // rotational motion
                        angle.value += speed;
                        point.x +=  1.5 * speed * vector.x * Math.cos(angle.value / 100);
                        point.y += 1.5 * speed * vector.y * Math.sin(angle.value / 100);
                        break;
                    case 2: // compound motion
                        if (Math.round (speed * 100) % 2 == 0) {
                            point.x += 0.5 * speed * vector.x;
                            point.y += 0.4 * speed * vector.y;
                        }
                        angle.value += speed;
                        break;
                }
            };
            this.drawBO = function (image, point, speed, angle, trajectory, level, ctx){
                var position = freshData.Scale ({x : point.x, y : point.y});
                switch (trajectory % 3){
                    case 0:
                        ctx.drawImage (image, position.x, position.y,
                            image.width * level / 3 * freshData.getCoefficient(),
                            image.height * level / 3 * freshData.getCoefficient());
                        break;

                    case 1:
                        ctx.drawImage (image, position.x , position.y,
                            image.width * level / 3 * freshData.getCoefficient(),
                            image.height * level / 3 * freshData.getCoefficient());
                        break;
                    case 2:
                        drawRotatedImage (image, position.x, position.y,
                            angle.value * angle.direction, level);
                        break;
                }

                function drawRotatedImage (image, x, y, angle, size) {
                    var TO_RADIANS = Math.PI / 180;

                    ctx.save();
                    ctx.translate (x, y);
                    ctx.rotate (angle * TO_RADIANS );

                    ctx.drawImage (image, -(image.width * size / 6 * freshData.getCoefficient()),
                        -(image.height * size / 6 * freshData.getCoefficient()), image.width * size / 3
                        * freshData.getCoefficient(), image.height * size / 3
                        * freshData.getCoefficient());

                    ctx.restore();
                }
            }

        };

        var selff = this;

        this.BackObject = function (gameSize, ctx, level, i, array){
            selff.backObjectClass.call (this, gameSize, ctx);
            this.image = array[i];
            this.point = {x : Math.random() * (gameSize.x + gameSize.y) - gameSize.y/2,
                          y : Math.random() * (2 * gameSize.y) - gameSize.y/2};
            this.level = level;
            this.speed = level * 0.05 + Math.random()*0.5;
            var t1 = Math.random() - 0.5;
            var t2 = Math.random() - 0.5;
            this.vector  = {
                x : t1 / Math.abs (t1),
                y : t2 / Math.abs (t2)
            };
            this.angle = { value : 1, direction : t1 / Math.abs (t1)};
            this.trajectory = Math.round (Math.random() * 10);
        };
        /////

        this.clouds = [];
        this.bObjects1 = [];
        this.bObjects2 = [];
        this.bObjects3 = [];
        this.LEVEL_1 = 1;
        this.LEVEL_2 = 2;
        this.LEVEL_3 = 3;
        this.LEVEL_CLOUDS = 0.3;

        for ( i = 0; i < this.numberOfObjects1; i++) {
            this.bObjects1[i] = new this.BackObject (this.gameSize, ctx, this.LEVEL_1, i % this.backImageCount1, this.arrayOfImages1);
        }
        for ( i = 0; i < this.numberOfObjects2; i++) {
            this.bObjects2[i] = new this.BackObject (this.gameSize, ctx, this.LEVEL_2, i % this.backImageCount2, this.arrayOfImages2);
        }
        for ( i = 0; i < this.numberOfObjects3; i++){
            this.bObjects3[i] = new this.BackObject (this.gameSize, ctx, this.LEVEL_3, i % this.backImageCount3, this.arrayOfImages3);
        }
        for ( i = 0; i < this.numberOfClouds; i++){
            this.clouds[i] = new this.BackObject (this.gameSize, ctx, this.LEVEL_CLOUDS, i % this.cloudsCount, this.arrayOfClouds);
        }

        var self = this;
        var gameLoop = function() {
            self.update();
            self.draw (ctx, self.gameSize);
            requestAnimationFrame (gameLoop);
        };


        gameLoop();
    };

    var Game = {};

    window.onload = function() {
         Game = new Noch ('canvas');
    };

    var freshData = {
        previousRadius: 50,
        coefficient: 1000,
        targetCoefficient: 1000,
        coefficientScale: 1000,
        inputData: {},
        outputData: { "mouseX": 0, "mouseY": 0 },
        updateInput: function(data) {
            var newData = JSON.parse(data);
            if ("player" in newData) {
                this.inputData = newData;
            }
            if ("coefficient" in newData) {
                var dicimalPlacesNumber = 2;
                this.targetCoefficient = (newData.coefficient).toFixed(
                        dicimalPlacesNumber) * this.coefficientScale;
                console.log(this.getCoefficient());
            }
        },
        updateOutput: function (mouseX, mouseY) {
            this.outputData.mouseX = mouseX;
            this.outputData.mouseY = mouseY;
        },
        getCoefficient: function() {
            return this.coefficient / this.coefficientScale;
        },
        Scale: function (position) {
            var middle = 0.5;
            return { x: (position.x - Game.gameSize.x * middle) * this.getCoefficient()
            + Game.gameSize.x * middle, y: (position.y - Game.gameSize.y * middle)
            * this.getCoefficient() + Game.gameSize.y * middle
            }
        },
        send: false
    };

    window.onresize = function() {
        Game.canvas.width = Game.gameSize.x
            = window.innerWidth;
        Game.canvas.height = Game.gameSize.y
            = window.innerHeight;
        var resolution = {  "x": Game.gameSize.x,
            "y": Game.gameSize.y };
        Game.backGroundOffset = Game.gameSize.y / 2;
        socket.send (JSON.stringify(resolution));
    };

    //creating connection
    var socket = new WebSocket('ws://localhost:8085');

    //getting data
    socket.onmessage = function (event) {
        //console.log('got message ' + event.data);

        freshData.updateInput (event.data);
        //updateInput(event.data);
    };

    //sending data
    document.onmousemove = function (event) {
        /*var message = { "mouseX": event.clientX,
                        "mouseY": event.clientY };*/
        freshData.updateOutput(event.clientX, event.clientY);
        //socket.send(JSON.stringify(message));
        /*if (Game.isStarted) {
            socket.send(JSON.stringify(freshData.outputData));
        }*/
    };

    document.onmousedown = function() {
        freshData.send = true;
    };

    document.onmouseup = function() {
        freshData.send = false;
    };

    document.onkeydown = function (event) {
        if (event.keyCode == 32) {
            event.preventDefault();
            var shot = {
                "shotX": freshData.outputData.mouseX,
                "shotY": freshData.outputData.mouseY
            };
            socket.send (JSON.stringify(shot));
        }
    };

    socket.onopen = function() {
        console.log ("Connected.");
        var resolution = { "x": Game.gameSize.x,
                           "y": Game.gameSize.y };
        socket.send (JSON.stringify(resolution));

        freshData.updateOutput (Game.gameSize.x,
                                Game.gameSize.y);

        Game.start();
    };

    socket.onclose = function (event) {
        if (event.wasClean) {
            alert ('Connection closed. All clear.');
        } else {
            alert ("Connection failed.");
        }
        alert ('Code ' + event.code +
               " reason: " + event.data);
    };

    socket.onerror = function(error) {
        alert ("Error " + error.message);
    };
    //////////////////////////////////////////////
    var previousX, previousY, prev_flag = 0;
    var scaleFlag = true;



    Noch.prototype = {

        drawBackground: function (ctx, gameSize) {
            if (freshData.inputData.player) {
                //var RESIZE_1 = 5;
                //var RESIZE_2 = 2;
                //var RESIZE_3 = 1;
                var CLOUD_TRAJECTORY = 3;
                var CLOUD_SIZE = 5;

                //temporary
                //this.fillWithLines("x", "y", ctx, gameSize);
                //this.fillWithLines("y", "x", ctx, gameSize);

                if (prev_flag == 1) {
                    var deltaX = (freshData.inputData.player.x - previousX);
                    var deltaY = (freshData.inputData.player.y - previousY);

                    for (var i = 0; i < this.numberOfClouds; i++) {
                        console.log(this.numberOfClouds);
                        this.clouds[i].point.x -= deltaX % gameSize.x;
                        this.clouds[i].point.y -= deltaY % gameSize.y;
                        this.clouds[i].move (this.clouds[i].point, this.clouds[i].speed, this.clouds[i].vector, this.clouds[i].angle, CLOUD_TRAJECTORY);
                        this.clouds[i].checkCloud (this.clouds[i].point, this.clouds[i].image);
                        this.clouds[i].drawBO (this.clouds[i].image, this.clouds[i].point, this.clouds[i].speed, this.clouds[i].angle, CLOUD_TRAJECTORY, CLOUD_SIZE, ctx);
                    }

                    //
                    //for ( i = 0; i < this.numberOfObjects1; i++) {
                    //    this.bObjects1[i].point.x -= (deltaX) % gameSize.x;
                    //    this.bObjects1[i].point.y -= (deltaY) % gameSize.y;
                    //    this.bObjects1[i].move (this.bObjects1[i].point, this.bObjects1[i].speed, this.bObjects1[i].vector, this.bObjects1[i].angle, this.bObjects1[i].trajectory);
                    //    this.bObjects1[i].check (this.bObjects1[i].point, this.bObjects1[i].speed, this.bObjects1[i].vector, this.bObjects1[i].trajectory);
                    //    this.bObjects1[i].drawBO (this.bObjects1[i].image, this.bObjects1[i].point, this.bObjects1[i].speed, this.bObjects1[i].angle, this.bObjects1[i].trajectory, this.bObjects1[i].level * RESIZE_1, ctx);
                    //}
                    //for (i = 0; i < this.numberOfObjects2; i++) {
                    //    this.bObjects2[i].point.x -= (deltaX) % gameSize.x;
                    //    this.bObjects2[i].point.y -= (deltaY) % gameSize.y;
                    //    this.bObjects2[i].move (this.bObjects2[i].point, this.bObjects2[i].speed, this.bObjects2[i].vector, this.bObjects2[i].angle, this.bObjects2[i].trajectory);
                    //    this.bObjects2[i].check (this.bObjects2[i].point, this.bObjects2[i].speed, this.bObjects2[i].vector,  this.bObjects2[i].trajectory);
                    //    this.bObjects2[i].drawBO (this.bObjects2[i].image, this.bObjects2[i].point, this.bObjects2[i].speed, this.bObjects2[i].angle, this.bObjects2[i].trajectory, this.bObjects2[i].level * RESIZE_2, ctx);
                    //
                    //}
                    //for (i = 0; i < this.numberOfObjects3; i++) {
                    //    this.bObjects3[i].point.x -= deltaX % gameSize.x;
                    //    this.bObjects3[i].point.y -= deltaY % gameSize.y;
                    //    this.bObjects3[i].move (this.bObjects3[i].point, this.bObjects3[i].speed, this.bObjects3[i].vector, this.bObjects3[i].angle, this.bObjects3[i].trajectory);
                    //    this.bObjects3[i].check (this.bObjects3[i].point, this.bObjects3[i].speed, this.bObjects3[i].vector,  this.bObjects3[i].trajectory);
                    //    this.bObjects3[i].drawBO (this.bObjects3[i].image, this.bObjects3[i].point, this.bObjects3[i].speed, this.bObjects3[i].angle, this.bObjects3[i].trajectory, this.bObjects3[i].level * RESIZE_3, ctx);
                    //}
                    for ( i = 1; i < 4; ++i) {
                        this.drawObjects (i, deltaX, deltaY, gameSize, ctx);
                    }

                } else prev_flag = 1;
                //console.log (freshData.coefficient, " ", freshData.targetCoefficient);
                previousX = freshData.inputData.player.x;
                previousY = freshData.inputData.player.y;
               //scaleFlag = 0;
                if (freshData.coefficient != freshData.targetCoefficient){
                    if (scaleFlag) {
                        scaleFlag = false;
                        var relativeCoef = freshData.coefficient / freshData.targetCoefficient;
                        console.log(relativeCoef);
                        if (relativeCoef > 1) this.addObjects(relativeCoef, gameSize, ctx);
                        else this.deleteObjects(relativeCoef, gameSize);
                        console.log("YY");
                      //  console.log (this.clouds[this.numberOfClouds-1]);
                    }
                }
                else scaleFlag = true;
            }
        },

        addObjects : function (relativeCoef, gameSize, ctx){
            var OBJECTS_COEFFICIENT = 1;
            for (var i = this.numberOfObjects1; i < OBJECTS_COEFFICIENT * relativeCoef * this.numberOfObjects1; i++) {
               // console.log ("gg");
                this.bObjects1[i] = new this.BackObject (gameSize, ctx, this.LEVEL_1, i % this.backImageCount1, this.arrayOfImages1);
                this.choosePoint(this.bObjects1[i], i, relativeCoef, gameSize);
            }
            this.numberOfObjects1 = i;

            for (i = this.numberOfObjects2; i <  OBJECTS_COEFFICIENT * relativeCoef * this.numberOfObjects2; i++) {
                this.bObjects2[i] = new this.BackObject (gameSize, ctx, this.LEVEL_2, i % this.backImageCount2, this.arrayOfImages2);
                this.choosePoint(this.bObjects2[i], i, relativeCoef, gameSize);
            }
            this.numberOfObjects2 = i;

            for (i = this.numberOfObjects3; i <  OBJECTS_COEFFICIENT * relativeCoef * this.numberOfObjects3; i++){
                this.bObjects3[i] = new this.BackObject (gameSize, ctx, this.LEVEL_3, i % this.backImageCount3, this.arrayOfImages3);
                this.choosePoint(this.bObjects3[i], i, relativeCoef, gameSize);
            }
            this.numberOfObjects3 = i;

            for (i = this.numberOfClouds; i <  OBJECTS_COEFFICIENT * relativeCoef * this.numberOfClouds; i++){
                this.clouds[i] = new this.BackObject (gameSize, ctx, this.LEVEL_CLOUDS, i % this.cloudsCount, this.arrayOfClouds);
                this.choosePoint(this.clouds[i], i, relativeCoef, gameSize);
               //console.log (this.clouds[i]);
            }

            this.numberOfClouds = i;
            //console.log (this.clouds[this.numberOfClouds - 2]);
        },

        deleteObjects : function (relativeCoef, gameSize){
            for (var i = 0; i < this.numberOfObjects1; i++){
                if (this.checkPoint (this.bObjects1[i], relativeCoef, gameSize)){
                    this.bObjects1.splice (i, 1);
                    i--;
                    this.numberOfObjects1--;
                } 
            }
            for (i = 0; i < this.numberOfObjects2; i++){
                if (this.checkPoint (this.bObjects2[i], relativeCoef, gameSize)){
                    this.bObjects2.splice (i, 1);
                    i--;
                    this.numberOfObjects2--;
                }
            }
            for (i = 0; i < this.numberOfObjects3; i++){
                if (this.checkPoint (this.bObjects3[i], relativeCoef, gameSize)){
                    this.bObjects3.splice (i, 1);
                    i--;
                    this.numberOfObjects3--;
                }
            }
            for (i = 0; i < this.numberOfClouds; i++){
                if (this.checkPoint (this.clouds[i], relativeCoef, gameSize)){
                    this.clouds.splice (i, 1);
                    i--;
                    this.numberOfClouds--;
                }
            }
        },

        choosePoint : function (object, i, relativeCoef, gameSize){
            var difference = relativeCoef * this.backGroundOffset - this.backGroundOffset;
            var summ = this.backGroundOffset + relativeCoef * this.backGroundOffset;
            switch (i % 4){
                case 0 ://left
                    object.point.x = Math.random() * (-difference) - this.backGroundOffset;
                    object.point.y = Math.random() * (gameSize.y + summ) - relativeCoef * this.backGroundOffset;
                    break;
                case 1 : //up
                    object.point.x = Math.random() * (gameSize.x + summ) - this.backGroundOffset;
                    object.point.y = Math.random() * difference - relativeCoef * this.backGroundOffset;
                    break;
                case 2 : //rigth
                    object.point.x = Math.random() * difference + gameSize.x + this.backGroundOffset;
                    object.point.y = Math.random() * (gameSize.y + summ) - this.backGroundOffset;
                    break;
                case 3 : //down
                    object.point.x = Math.random() * (gameSize.x + summ) - relativeCoef * this.backGroundOffset;
                    object.point.y = Math.random() * (difference) + gameSize.y + this.backGroundOffset;
                    break;
            }
        },

        checkPoint : function (object, relativeCoef, gameSize){
            var x = object.point.x;
            var y = object.point.y;
            var newOffset = relativeCoef * this.backGroundOffset;
            return (x < - newOffset || x > gameSize.x + newOffset
                   || y < - newOffset || y > gameSize.y + newOffset);
        },

        drawObjects: function (number, deltaX, deltaY, gameSize, ctx) {
            var RESIZE = [1, 5, 2, 1];

            for (var i = 0; i < this["numberOfObjects" + number]; i++) {
                this["bObjects" + number][i].point.x -= deltaX % gameSize.x;
                this["bObjects" + number][i].point.y -= deltaY % gameSize.y;
                this["bObjects" + number][i].move (this["bObjects" + number][i].point,
                    this["bObjects" + number][i].speed, this["bObjects" + number][i].vector,
                    this["bObjects" + number][i].angle, this["bObjects" + number][i].trajectory);
                this["bObjects" + number][i].check (this["bObjects" + number][i].point,
                    this["bObjects" + number][i].speed, this["bObjects" + number][i].vector,
                    this["bObjects" + number][i].trajectory);
                this["bObjects" + number][i].drawBO (this["bObjects" + number][i].image,
                    this["bObjects" + number][i].point, this["bObjects" + number][i].speed,
                    this["bObjects" + number][i].angle, this["bObjects" + number][i].trajectory,
                    this["bObjects" + number][i].level * RESIZE[number], ctx);
            }
        },
        
        start: function() {
            this.started = true;
        },

        isStarted: function() {
            return this.started;
        },

        update: function() {
            if (Game.isStarted && freshData.send) {
                socket.send(JSON.stringify(freshData.outputData));
            }
            if (freshData.targetCoefficient < freshData.coefficient) {
                freshData.coefficient -= 10;
            }
            if (freshData.targetCoefficient > freshData.coefficient) {
                freshData.coefficient += 10;
            }

        },

        drawElement: function (ctx, x, y, radius) {
            ctx.beginPath();
            ctx.arc (x, y, radius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fillStyle = 'white';
            ctx.fill();
        },

        drawStuff: function (stuff, letter, radius, ctx) {

            if (freshData.inputData[stuff]) {
                for (var i = 0; i < freshData.inputData[stuff].length; ++i) {
                    var pos = freshData.inputData[stuff][i];

                    pos = freshData.Scale(pos);

                    if (pos) {
                        this.drawElement (ctx, pos.x, pos.y, radius * freshData.getCoefficient());
                        this.addLetter (ctx, pos.x, pos.y, letter, radius * freshData.getCoefficient());
                    }
                }
            }
        },

        drawBorder: function(ctx) {
            if (freshData.inputData.border) {
                var border = freshData.inputData.border;
                var width = 20 * freshData.getCoefficient();
                var height = 398 * freshData.getCoefficient();

                var half = 0.5;

                for (var i = 0; i < border.length; ++i) {
                    ctx.beginPath();
                    ctx.save();

                    var pos = freshData.Scale (border[i].position);

                    ctx.translate (pos.x, pos.y);
                    ctx.rotate (border[i].angle);

                    ctx.rect (-width * half, - height * half, width, height);
                    ctx.strokeStyle = 'White';
                    ctx.lineWidth = 4 * freshData.getCoefficient();

                    var grd = ctx.createLinearGradient (-width * half, - height * half,
                                                        width * half, -height * half);

                    grd.addColorStop (0.6, 'white');
                    grd.addColorStop (0.9, "rgba(255, 255, 255, 0.6)");
                    grd.addColorStop (1, "rgba(255, 255, 255, 0)");

                    ctx.fillStyle = grd;
                    //temporary
                    //ctx.fill();

                    ctx.stroke();
                    ctx.restore();
                }
            }
        },


        addLetter: function (ctx, x, y, letter, radius) {
            ctx.fillStyle = 'black';

            var length = (letter.split('')).length;

            var letterSizeCoefficient = 1.5;

            var fontSize = radius * letterSizeCoefficient / Math.sqrt(length);

            var xReducer = 5,
                yReducer = 6;
            
            ctx.font = "bold " + fontSize + "px Arial";
            ctx.fillText(letter, x - radius / 2 - (length - 1) * radius / xReducer,
                y + radius / 2 + - (length - 1) * radius / yReducer);
        },



        fillWithLines: function (mainAxis, secondAxis, ctx, gameSize) {
            var squareSide = 30;
            ctx.strokeStyle = 'white';

            var lineCoords = { x: 0, y: 0 };

            for (var i = squareSide - freshData.inputData.player[mainAxis] *
                freshData.targetCoefficient / 1000 % squareSide; i < gameSize[mainAxis]; i += squareSide) {

                lineCoords[mainAxis] = i;
                lineCoords[secondAxis] = 0;

                ctx.beginPath();
                ctx.moveTo (lineCoords.x, lineCoords.y);

                lineCoords[secondAxis] = gameSize[secondAxis];

                ctx.lineTo (lineCoords.x, lineCoords.y);

                ctx.stroke();
            }
        },

        draw: function (ctx, gameSize) {
            ctx.clearRect (0 ,0, gameSize.x, gameSize.y);

            this.drawBackground (ctx, gameSize);

            this.drawStuff ("Hydrogen", "H", 26, ctx);
            this.drawStuff ("Carbon", "C", 40, ctx);
            this.drawStuff ("Helium", "He", 18, ctx);
            this.drawStuff ("Lithium", "Li", 72, ctx);
            this.drawStuff ("Beryllium", "Be", 56, ctx);
            this.drawStuff ("Boron", "B", 49, ctx);
            this.drawStuff ("Oxygen", "O", 30, ctx);
            this.drawStuff ("Neon", "Ne", 19, ctx);
            this.drawStuff ("Fluorine", "F", 36, ctx);
            this.drawStuff ("proton", "p", 9, ctx);
            this.drawStuff ("Nitrogen", "N", 31, ctx);
            this.drawBorder (ctx);
        }
    };

})();
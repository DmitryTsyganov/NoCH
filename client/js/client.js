;(function() {

    var WS_URL = 'ws://localhost:8085';
    //var WS_URL = 'ws://10.20.3.4:8085';
    // WS_URL = 'ws://nochgame.cloudapp.net:8085';

    // Some test
    function validateInputFields(inputField) {
        if (inputField.val() == "") {
            inputField.addClass('error__div');
            return false;
        } else {
            inputField.removeClass('error__div');
            return true;
        }
    }

    $('#btn__go').click(function(){
        var login__input = $('#login__input');
        var password__input = $('#password__input');
        var username = $('#username');
        var element = $('#element');


        if (!validateInputFields(login__input)) return;
        if (!validateInputFields(password__input)) return;

        username.text(login__input.val());
        element.text('C');

        $('#overlay').hide();
        $('#characteristic').show();
        ////////
        var color = $('#btn__go').css("background-color")
        //alert(color)
        var rgb = []
        var tmp = "";
        for (var k = 0;k < color.length ;++k){

            if (color[k] <= "9" && color[k] >= "0"){
                tmp+= color[k];
                //alert(color[k])
            }
            if (color[k]==","||color[k] == ")") {
                rgb.push(parseInt(tmp,10));
                //alert(tmp)
                tmp=""
            }
        } //alert(rgb);
        if (rgb[0]> 200 && rgb[1] > 200 && rgb[2] > 200 ){
            for (var i=0;i<3;i++){
                rgb[i]-=20
            }
        }
        else if (rgb[0] < 30 && rgb[1] < 30 && rgb[2] < 30){
            for ( i = 0;i<3;i++){
                rgb[i]+=20
            }
        }
        //alert(rgb)
        var rgb_new ="rgb("+String(rgb[0]) + "," + String(rgb[1]) + "," + String(rgb[2]) + ")";
        //alert(rgb_new);
        $("#btn__go").css("background-color",rgb_new);
        //alert($("#btn__go").css("background-color"));

        if (!getCookie("name")){

            $("#help1").show(700);
        }

        Game.activePlayer = true;
    });

    var Noch = function(canvasId) {
        this.activePlayer = false;

        this.canvas = document.getElementById(canvasId);
        var ctx = this.canvas.getContext('2d');

        this.started = false;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        var arrayOfImages = [];
        this.arrayOfImages1 = [];
        this.arrayOfImages2 = [];
        this.arrayOfImages3 = [];
        this.arrayOfClouds = [];
        this.arrayOfBorder = [];
        this.arrayOfBalls = [];
        var flag_array = 0;

        this.gameSize = { x: this.canvas.width,
                          y: this.canvas.height };
        console.log(this.gameSize);

        this.backImageCount1 = 29;
        this.backImageCount2 = 35;
        this.backImageCount3 = 30;
        this.imageBorderCount = 2;
        this.imageBallsCount = 7;
        this.cloudsCount = 29;
        this.numberOfClouds = /*29*/20;
        this.numberOfObjects1 = /*200*/35;
        this.numberOfObjects2 = /*75*/25;
        this.numberOfObjects3 = /*40*/11;
        this.numberOfBalls = 15;
        this.backGroundOffset = this.gameSize.y / 2;

        this.soundNeutron = new Audio('../sounds/vystrel_neytron.wav');
        this.soundProton = new Audio('../sounds/vystrel_proton.wav');
        this.soundDeath = new Audio('../sounds/smert.wav');

        this.imagesAddedTotal = 0;
        this.imagesRemovedTotal = 0;

        function imageLoaded(){
            ++flag_array;
        }

        imageLoaded();  // "Костыль тут, ибо без него не работает т.к. убрал fon. см ниже"

        for (var i = 1; i < this.cloudsCount + 1; ++i){
            var img = new Image();
            img.src = "clouds/" + String(i) + ".png";
            this.arrayOfClouds.push(img);
            img.onload = imageLoaded();
        }

        for (i = 1; i < this.backImageCount3 + 1; ++i){
            img = new Image();
            img.src = "3layer/" + "q" + String(i) + ".png";
            this.arrayOfImages3.push (img);
            img.onload = imageLoaded();
        }

        for (i = 1; i < this.backImageCount2 + 1; ++i){
            img = new Image();
            img.src = "2layer/" + String(i) + ".png";
            this.arrayOfImages2.push (img);
            img.onload = imageLoaded();
        }

        for (i = 1; i < this.backImageCount1 + 1; ++i){
            img = new Image();
            img.src = "1layer/" + String(i) + ".png";
            this.arrayOfImages1.push (img);
            img.onload = imageLoaded();
        }

        for (i = 1; i < this.imageBorderCount + 1; ++i){
            img = new Image();
            img.src = "border/gradient" + String(i) + ".png";
            this.arrayOfBorder.push (img);
            img.onload = imageLoaded();
        }

        for (i = 1; i < this.imageBallsCount + 1; ++i){
            img = new Image();
            img.src = "borderballs/" + String(i) + ".png";
            this.arrayOfBalls.push (img);
            img.onload = imageLoaded();
        }

        this.backObjectClass = function (gameSize) {
            this.rescale = function (point) {
                var newPoint = freshData.Scale (point);
                point.x = newPoint.x;
                point.y = newPoint.y;
            };
            this.rescaleBack = function(point) {
                var newPoint = freshData.backScale(point);
                point.x = newPoint.x;
                point.y = newPoint.y;
            };
            this.check = function (point, speed, vector, trajectory){
                if (scaleFlag) {
                    var realPoint = freshData.Scale(point);
                    if (realPoint.x > gameSize.x + gameSize.y / 2) {
                        point.x = -gameSize.y / 2;
                        point.y = Math.random() * (2 * gameSize.y) - gameSize.y / 2;
                        this.rescaleBack(point);
                    }
                    if (realPoint.x < -gameSize.y / 2) {
                        point.x = gameSize.x + gameSize.y / 2;
                        point.y = Math.random() * (2 * gameSize.y) - gameSize.y / 2;
                        this.rescaleBack(point);
                    }
                    if (realPoint.y < -gameSize.y / 2) {
                        point.x = Math.random() * (gameSize.x + gameSize.y) - gameSize.y / 2;
                        point.y = 1.5 * gameSize.y;
                        this.rescaleBack(point);
                    }
                    if (realPoint.y > 1.5 * gameSize.y) {
                        console.log(1);
                        point.x = Math.random() * (gameSize.x + gameSize.y) - gameSize.y / 2;
                        point.y = -gameSize.y / 2;
                        this.rescaleBack(point);
                    }
                }
            };
            this.checkCloud = function (point, image){
                var realPoint = freshData.Scale(point);
                if (realPoint.x > gameSize.x + image.width * 3) {
                    point.x = - image.width * 2.5;
                    point.y = Math.random() * (2 * gameSize.y) - gameSize.y / 2;
                    this.rescaleBack(point);
                }
                if (realPoint.x < - image.width * 3) {
                    point.x = gameSize.x + image.width * 2.5;
                    point.y = Math.random() * (2 * gameSize.y) - gameSize.y / 2;
                    this.rescaleBack(point);
                }
                if (realPoint.y < - image.height * 3) {
                    point.x = Math.random() * (gameSize.x + gameSize.y) - gameSize.y / 2;
                    point.y = gameSize.y + image.height * 2.5;
                    this.rescaleBack(point);
                }
                if (realPoint.y >  gameSize.y + image.height * 3) {
                    point.x = Math.random() * (gameSize.x + gameSize.y) - gameSize.y / 2;
                    point.y = - image.height * 2.5;
                    this.rescaleBack(point);
                }
            };
            this.move = function (point, speed, vector, angle, trajectory){
                switch (trajectory % 3){
                    case 0: // translation
                        point.x += speed * vector.x * freshData.getCoefficient();
                        point.y += 0.7 * speed * vector.y * freshData.getCoefficient();
                        break;
                    case 1: // rotational motion
                        angle.value += speed;
                        point.x +=  1.5 * speed * vector.x * Math.cos (angle.value / 100)
                                                            * freshData.getCoefficient();
                        point.y += 1.5 * speed * vector.y * Math.sin (angle.value / 100)
                                                            * freshData.getCoefficient();
                        break;
                    case 2: // compound motion
                        if (Math.round (speed * 100) % 2 == 0) {
                            point.x += 0.5 * speed * vector.x * freshData.getCoefficient();
                            point.y += 0.4 * speed * vector.y * freshData.getCoefficient();
                        }
                        angle.value += speed;
                        break;
                }
            };
            this.drawBO = function (image, point, speed, angle, trajectory, level, ctx){

                //var position = { x: point.x, y: point.y };
                //console.log("position x is " + position.x + ", y is " + position.y);
                var position = freshData.Scale (point);
                switch (trajectory % 3) {
                    case 0:
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

        this.BorderBall = function (i, array){
            this.image = array[i];
            this.shift = {x : 0,
                          y : 0};
            this.startPlace = Math.random();
            this.size = i % 3;
            this.speed = Math.random() + 1;
            this.lifetime = Math.random() * 7 + 7;
            this.vector = {x : Math.random() - 0.5,
                           y : 1};
            this.opacity = 1;
            //this.opacitySpeed = Math.random();
        };

        this.relativeCoef = 1;
        this.clouds = [];
        this.bObjects1 = [];
        this.bObjects2 = [];
        this.bObjects3 = [];
        this.bBalls = [];
        this.LEVEL_1 = 1;
        this.LEVEL_2 = 2;
        this.LEVEL_3 = 3;
        this.LEVEL_CLOUDS = 0.3;

        for ( i = 0; i < this.numberOfObjects1; ++i) {
            this.bObjects1[i] = new this.BackObject (this.gameSize, ctx, this.LEVEL_1,
                                        i % this.backImageCount1, this.arrayOfImages1);
        }
        for ( i = 0; i < this.numberOfObjects2; ++i) {
            this.bObjects2[i] = new this.BackObject (this.gameSize, ctx, this.LEVEL_2,
                                        i % this.backImageCount2, this.arrayOfImages2);
        }
        for ( i = 0; i < this.numberOfObjects3; ++i){
            this.bObjects3[i] = new this.BackObject (this.gameSize, ctx, this.LEVEL_3,
                                        i % this.backImageCount3, this.arrayOfImages3);
        }
        for ( i = 0; i < this.numberOfClouds; ++i){
            this.clouds[i] = new this.BackObject (this.gameSize, ctx, this.LEVEL_CLOUDS,
                                                i % this.cloudsCount, this.arrayOfClouds);
        }
        for ( i = 0; i < this.numberOfBalls; ++i){
            this.bBalls[i] = new this.BorderBall (i % this.imageBallsCount, this.arrayOfBalls);
        }

        var self = this;
        var gameLoop = function() {
            self.update();
            self.draw(ctx, self.gameSize);
            requestAnimationFrame(gameLoop);
        };

       // while(flag_array!=this.img_count +1);
        // ctx.drawImage(fon, 0, 0);
        document.body.style.cursor = "url('cursor.png'), auto";
        gameLoop();
    };

    var indiNeutronTime = {
        'C': 8,
        'B': 12,
        'O': 6,
        'N': 8,
        'Be': 4,
        'Li': 0,
        'F': 4,
        'He': 0,
        'Ne': 8,
        'H': 0
    };
    var indiProtonTime = {
        'C': 20,
        'B': 10,
        'O': 60,
        'N': 10,
        'Be': 10,
        'Li': 15,
        'F': 20,
        'He': 20,
        'Ne': 8,
        'H': 0
    };
    var radiuses = {
        "N": 31,
        "F": 36,
        "Ne": 19,
        "O": 30,
        "B": 49,
        "Be": 56,
        "Li": 72,
        "He": 18,
        "C": 40,
        "H": 26
    };

    Noch.prototype = {

        drawBackground: function(ctx, gameSize) {
            if (freshData.inputData.player) {
                //var RESIZE_1 = 5;
                //var RESIZE_2 = 2;
                //var RESIZE_3 = 1;
                var CLOUD_TRAJECTORY = 3;
                var CLOUD_SIZE = 5;
                //temporary
                //this.fillWithLines("x", "y", ctx, gameSize);
                //this.fillWithLines("y", "x", ctx, gameSize);

                if (prevFlag == 1) {
                    var deltaX = freshData.getCoefficient() * (freshData.inputData.player.x - previousX);
                    var deltaY = freshData.getCoefficient() * (freshData.inputData.player.y - previousY);
                    for ( i = 0; i < this.numberOfClouds; ++i) {
                        // console.log(this.numberOfClouds);
                        this.clouds[i].point.x -= deltaX  % gameSize.x;
                        this.clouds[i].point.y -= deltaY  % gameSize.y;
                        this.clouds[i].move (this.clouds[i].point, this.clouds[i].speed,
                            this.clouds[i].vector, this.clouds[i].angle, CLOUD_TRAJECTORY);
                        this.clouds[i].checkCloud (this.clouds[i].point, this.clouds[i].image);
                        this.clouds[i].drawBO (this.clouds[i].image, this.clouds[i].point,
                            this.clouds[i].speed, this.clouds[i].angle, CLOUD_TRAJECTORY, CLOUD_SIZE, ctx);
                    }
                    for (var i = 1; i < 4; ++i) {
                        this.drawObjects (i, deltaX, deltaY, gameSize, ctx);
                    }

                } else prevFlag = 1;
                //console.log (freshData.coefficient, " ", freshData.targetCoefficient);
                previousX = freshData.inputData.player.x;
                previousY = freshData.inputData.player.y;
                //scaleFlag = 0;
                if (freshData.coefficient != freshData.targetCoefficient){
                    //if (scaleFlag) {
                        scaleFlag = false;
                        this.relativeCoef = freshData.coefficient / freshData.targetCoefficient;
                        // console.log(this.relativeCoef);
                        if (this.relativeCoef > 1) this.addObjects(this.relativeCoef, gameSize, ctx);
                        else this.deleteObjects(this.relativeCoef, gameSize);

                    //}
                } else if (!scaleFlag && this.relativeCoef > 1) {
                    this.addClouds(gameSize, ctx);
                    scaleFlag = true;
                } else if (!scaleFlag) {
                    scaleFlag = true;
                }
            }
        },

        addObject: function(number, gameSize, ctx) {
            var additionalObjects = 1;
            for (var i = this['numberOfObjects' + number]; i <
                this['numberOfObjects' + number] + additionalObjects; ++i) {
                    this['bObjects' + number][i] = new this.BackObject(gameSize, ctx, this['LEVEL_' + number],
                    i % this['backImageCount' + number], this['arrayOfImages' + number]);
                this.choosePoint(this['bObjects' + number][i], i,  gameSize);
              //  console.log(this['bObjects' + number][i].position);
                ++this.imagesAddedTotal;
            }
            this['numberOfObjects' + number] += additionalObjects;
        },

        addClouds: function(gameSize, ctx) {
            var additionalClouds = 15;
            for (var i = this.numberOfClouds; i <
            this.numberOfClouds + additionalClouds; ++i){
                this.clouds[i] = new this.BackObject (gameSize, ctx, this.LEVEL_CLOUDS,
                    i % this.cloudsCount, this.arrayOfClouds);
                this.choosePoint(this.clouds[i], i, gameSize);
                ++this.imagesAddedTotal;
                //console.log (this.clouds[i]);
            }

            //this.numberOfClouds = i;
            this.numberOfClouds += additionalClouds;
        },

        //TODO: apply KISS to everything
        addObjects: function (relativeCoef, gameSize, ctx) {
            for (var i = 1; i <= 3; ++i) {
                this.addObject(i, gameSize, ctx);
            }
            //console.log("Images added " + this.imagesAddedTotal);
            //console.log("Images deleted " + this.imagesRemovedTotal);
        },

        deleteObject: function(array, length, gameSize) {
            for (var i = 0; i < this[length]; ++i) {
                //console.log(this.checkPoint (this.bObjects1[i], relativeCoef, gameSize));
                if (this.checkPoint (this[array][i], gameSize)){
                    this[array].splice (i, 1);
                    --i;
                    --this[length];
                    ++this.imagesRemovedTotal;
                }
            }
        },

        deleteObjects: function (gameSize) {
            for (var i = 1; i <= 3; ++i) {
                this.deleteObject('bObjects' + i, 'numberOfObjects' + i, gameSize);
            }
            this.deleteObject('clouds', 'numberOfClouds', gameSize);
            console.log("Images added " + this.imagesAddedTotal);
            console.log("Images deleted " + this.imagesRemovedTotal);
        },

        choosePoint: function (object, i, gameSize){
            var newSize = { x: gameSize.x / freshData.getCoefficient(),
                            y: gameSize.y / freshData.getCoefficient() };
            switch (i % 4){
                case 0 : //left
                    object.point.x = - this.backGroundOffset;
                    object.point.y = Math.random() * newSize.y;
                    object.rescaleBack(object.point);
                    break;
                case 1 : //up
                    object.point.x = Math.random() * newSize.x;
                    object.point.y = - this.backGroundOffset;
                    object.rescaleBack(object.point);
                    break;
                case 2 : //right
                    object.point.x = gameSize.x + this.backGroundOffset;
                    object.point.y = Math.random() * newSize.y;
                    object.rescaleBack(object.point);
                    break;
                case 3 : //down
                    object.point.x = Math.random() * newSize.y;
                    object.point.y = + gameSize.y + this.backGroundOffset;
                    object.rescaleBack(object.point);
                    break;
            }
            //console.log("point x is " + object.point.x);
            //console.log("point x is " + object.point.y);
        },

        checkPoint: function (object, gameSize){
            var position = freshData.Scale(object.point);
            //console.log(position);
            var tolerance = 0.8;
            var newOffset = this.backGroundOffset * tolerance;
            return (position.x < - newOffset || position.x > gameSize.x + newOffset
            || position.y < - newOffset || position.y > gameSize.y + newOffset);
        },

        drawObjects: function (number, deltaX, deltaY, gameSize, ctx) {
            var RESIZE = [1, 5, 2, 1];

            for (var i = 0; i < this["numberOfObjects" + number]; ++i) {
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



        drawIndicatorProton : function (x, y, radius, id, ctx){
            var timeShift = 1 / (60 * indiProtonTime[players[id].element]),
                fontSize = 0.5 * radius * freshData.getCoefficient(),
                textShiftX = radius * 0.45 * freshData.getCoefficient(),
                textShiftY = radius * 0.2 * freshData.getCoefficient();
            ctx.save();
            if (players[id].protonTime < 1){
                ctx.fillStyle = "grey";
                players[id].protonTime += timeShift;
            }
            else ctx.fillStyle = "white";
            ctx.font = "bold " + fontSize + "px tellural_altbold";
            ctx.fillText (players[id].protonNumber, x + textShiftX, y - textShiftY);
            ctx.restore();
        },

        drawIndicatorNeutron : function (x, y, radius, color, id, ctx) {
            var currentAngle,
                shift = 2 * Math.PI / (60 * indiNeutronTime[players[id].element]),
                counterClockwise = false,
                startAngle = Math.PI / 2,
                width = 10;
            if (!indiNeutronTime[players[id].element])  players[id].angle = 2 * Math.PI;
            ctx.save();
            ctx.beginPath();
            ctx.lineWidth = width * freshData.getCoefficient() / radiuses["C"] * radius;
            ctx.arc(x, y, radius * freshData.getCoefficient(), 0, 2 * Math.PI);
            ctx.strokeStyle = 'grey';
            ctx.stroke();
            ctx.closePath();
            if (players[id].angle < 2 * Math.PI)
                players[id].angle += shift;
            currentAngle = players[id].angle + startAngle;
            ctx.beginPath();
            ctx.arc(x, y, radius * freshData.getCoefficient(), startAngle, currentAngle,
                counterClockwise);
            ctx.strokeStyle = color;
            ctx.stroke();
            ctx.restore();
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
            for (var key in garbageAll) {
                garbageAll[key].checkMovement();
            }

        },

        drawElement: function(ctx, x, y, radius, color, element) {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
          //  console.log( "out ", radius);
            ctx.lineWidth = 7 * freshData.getCoefficient() / radiuses["C"] * radiuses[element];
            ctx.strokeStyle = "white";
            ctx.stroke();
            ctx.fillStyle = "black";//color;
            ctx.fill();
        },

        drawRedDot: function(ctx, position) {
            ctx.beginPath();
            ctx.arc(position.x, position.y, 10, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
        },

        drawStuff: function(stuff, radius, ctx) {

            if (freshData.inputData[stuff]) {
                for (var i = 0; i < freshData.inputData[stuff].length; i += 2) {
                    var x = freshData.inputData[stuff][i];
                    var y = freshData.inputData[stuff][i + 1];
                    //var flag = freshData.inputData[stuff][i + 2];
                    var flag = true;
                    var pos = freshData.Scale({x: x, y: y});

                    if (pos) {
                        if (flag){
                            ctx.beginPath();
                            var grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y,
                                radius * freshData.getCoefficient());
                            //var grd = ctx.createRadialGradient(pos.x, pos.y, radius * freshData.getCoefficient()
                            //    + 100 * freshData.getCoefficient() / radiuses["C"] * radiuses[stuff],
                            //    pos.x, pos.y, radius );

                            //grd.addColorStop(1, "rgba(168, 228, 160, 1)");

                            grd.addColorStop(1, "rgba(0, 66, 32, 1)");
                            grd.addColorStop(0.5, "black");
                            grd.addColorStop(0, "black");

                            //grd.addColorStop(0, "rgba(0, 66, 32, 1)");
                            //grd.addColorStop(1, "rgba(0, 66, 32, 0)");
                            ctx.fillStyle = grd;
                            ctx.arc (pos.x, pos.y, radius * freshData.getCoefficient(), 0, 2 * Math.PI);
                            ctx.fill();
                            ctx.lineWidth = 7 * freshData.getCoefficient() / radiuses["C"] * radiuses[stuff];
                            ctx.strokeStyle = "rgba(0, 66, 32, 1)";
                            ctx.stroke();

                            this.addLetter(ctx, pos.x, pos.y, stuff,
                                radius * freshData.getCoefficient());
                        }
                        else {
                            this.drawElement(ctx, pos.x, pos.y,
                                radius * freshData.getCoefficient(), "white", stuff);
                            this.addLetter(ctx, pos.x, pos.y, /*JSON.stringify({ x: pos.x +
                                 freshData.inputData.player.x, y: pos.y +
                                 freshData.inputData.player.y })*/stuff,
                                radius * freshData.getCoefficient());
                        }
                    }
                }
            }
        },


        drawBonds: function(ctx) {
            if (freshData.inputData.bonds) {
                var bonds = freshData.inputData.bonds;
                for (var i = 0; i < bonds.length; i += 4) {
                    ctx.beginPath();
                    var pos1 = freshData.Scale({ x: bonds[i], y: bonds[i + 1] });
                    var pos2 = freshData.Scale({ x: bonds[i + 2], y: bonds[i + 3] });
                    ctx.moveTo(pos1.x, pos1.y);
                    ctx.lineTo(pos2.x, pos2.y);
                    ctx.lineWidth = 10 * freshData.getCoefficient();

                    ctx.strokeStyle = "white";
                    ctx.stroke();
                }
            }
        },

        drawGarbage: function(ctx) {
            for (var key in garbageAll) {
                var pos = freshData.Scale({ x: garbageAll[key].position.x +
                            Game.gameSize.x / 2 - freshData.inputData.player.x,
                            y: garbageAll[key].position.y +
                            Game.gameSize.y / 2 - freshData.inputData.player.y });
               // this.drawRedDot(ctx, pos);
               // this.addLetter(ctx, pos.x, pos.y, garbageAll[key].element, 10);
            }
        },

        drawPlayers: function(ctx) {
            if (freshData.inputData.players) {
                var _players = freshData.inputData.players;

                for (var i = 0; i < _players.length; i += 3) {
                    if (players[_players[i]]) {
                        var pos = freshData.Scale({x: _players[i + 1], y: _players[i + 2]});
                        this.drawElement (ctx, pos.x, pos.y,
                            radiuses[players[_players[i]].element]
                            * freshData.getCoefficient(),
                            players[_players[i]].color, players[_players[i]].element);
                        //console.log(_players[i],"out", radiuses[players[_players[i]].element], "  ",radiuses[players[_players[i]].element] * freshData.getCoefficient());
                        this.addLetter (ctx, pos.x, pos.y,
                            players[_players[i]].element,
                            radiuses[players[_players[i]].element]
                            * freshData.getCoefficient());
                        this.drawIndicatorProton (pos.x, pos.y, radiuses[players[_players[i]].element],
                            _players[i], ctx);
                        this.drawIndicatorNeutron (pos.x, pos.y, radiuses[players[_players[i]].element],
                            players[_players[i]].color, _players[i], ctx);
                    }
                }
            }
        },

        drawBorder: function(ctx, gameSize) {
            if (freshData.inputData.border) {
                var border = freshData.inputData.border;
                var width = 20 * freshData.getCoefficient();
                var height = 100 * freshData.getCoefficient();
                var image = this.arrayOfBorder[0];
                var half = 0.5 * freshData.getCoefficient();
                var TO_RADIANS = Math.PI / 180;
                var resize = 1.5;

                for (var i = 0; i < border.length; i += 3) {
                    ctx.beginPath();
                    ctx.save();

                    var x = border[i];
                    var y = border[i + 1];
                    var angle = border[i + 2];

                    var pos = freshData.Scale({ x: x, y: y });

                    ctx.translate(pos.x, pos.y);
                    ctx.rotate(angle);
                    ctx.save();
                    ctx.rotate(90 * TO_RADIANS);
                    ctx.drawImage (image, -image.width * half ,
                        -image.height * half - 2 * radiuses["Li"] * freshData.getCoefficient() ,
                        image.width * freshData.getCoefficient() * resize, image.height * freshData.getCoefficient());
                    this.drawBorderBalls (ctx, -width, - height * half, height);
                    ctx.restore();
                    ctx.rect(-width * freshData.getCoefficient() + 2 * radiuses["Li"] * freshData.getCoefficient(), - height * half,
                        width * half/*30*/ - 3 * gameSize.x, height + 2 * gameSize.x);
                    var grd = ctx.createLinearGradient(-width * half , - height * half ,
                                                        width * half/* 30*/, -height * half);
                    grd.addColorStop(1, "rgba(255, 255, 255, 0)");
                    grd.addColorStop(0, "rgba(255, 255, 255, 1)");
                    ctx.fillStyle = grd;
                    //temporary
                    ctx.fill();
                    //ctx.stroke();
                    ctx.restore();
                }
            }
        },
        drawBorderBalls : function (ctx, xx, yy, width){
            var x;
            yy -= 50 * freshData.getCoefficient();

            for (var i = 0; i < this.numberOfBalls; ++i){
                if (this.bBalls[i].opacity > 0) {
                    x = xx + this.bBalls[i].startPlace * width;
                    ctx.drawImage(this.bBalls[i].image, x + this.bBalls[i].shift.x * freshData.getCoefficient(),
                        yy - this.bBalls[i].shift.y * freshData.getCoefficient(),
                        this.bBalls[i].image.width * freshData.getCoefficient() * this.bBalls[i].size,
                        this.bBalls[i].image.height * freshData.getCoefficient() * this.bBalls[i].size);
                    this.bBalls[i].shift.x += this.bBalls[i].speed * this.bBalls[i].vector.x / 10;
                    this.bBalls[i].shift.y += this.bBalls[i].speed * this.bBalls[i].vector.y / 10;
                    this.bBalls[i].opacity -= 1 / (this.bBalls[i].lifetime * 60);
                } else
                    this.bBalls[i] = new this.BorderBall (i % this.imageBallsCount, this.arrayOfBalls);
            }
        },

        addLetter: function(ctx, x, y, letter, radius) {
            ctx.fillStyle = 'white';

            //letter += '+\n' + x + '+\n' + y;
            var length = (letter.split('')).length;

            var letterSizeCoefficient = 1.5;

            var fontSize = radius * letterSizeCoefficient / Math.sqrt(length);

            var xReducer = 5,
                yReducer = 6;

            ctx.font = "bold " + fontSize + "px tellural_altbold";
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
                ctx.moveTo(lineCoords.x, lineCoords.y);

                lineCoords[secondAxis] = gameSize[secondAxis];

                ctx.lineTo(lineCoords.x, lineCoords.y);

                ctx.stroke();
            }
        },

        draw: function(ctx, gameSize) {
            ctx.clearRect(0 ,0, gameSize.x, gameSize.y);
            this.drawBackground(ctx, gameSize);
            this.drawBonds(ctx);
            this.drawStuff("H", 26, ctx);
            this.drawStuff("C", 40, ctx);
            this.drawStuff("He", 18, ctx);
            this.drawStuff("Li", 72, ctx);
            this.drawStuff("Be", 56, ctx);
            this.drawStuff("B", 49, ctx);
            this.drawStuff("O", 30, ctx);
            this.drawStuff("Ne", 19, ctx);
            this.drawStuff("F", 36, ctx);
            this.drawStuff("p", 9, ctx);
            this.drawStuff("n", 9, ctx);
            this.drawStuff("N", 31, ctx);
            this.drawPlayers(ctx);
            this.drawBorder(ctx, gameSize);
            this.drawGarbage(ctx);
        }
    };

    var players = {};
    var garbageAll = {};
    var Garbage = function(mass, position, element) {
        this.force = { x: 0, y: 0 };
        this.mass = mass;
        this.STEPS_TOTAL = 20;
        this.position = this.positionPrev = position;
        this.element = element;
        this.isInMotion = false;
        this.stepCounter = 0;
        this.frictionAir = 0.003;
        this.speed = {};
    };
    Garbage.prototype = {
        setInMotion: function(force, speed, position) {
            this.force = force;
            this.position = position;
            this.positionPrev.x = /*position.x -*/ speed.x;
            this.positionPrev.y = /*position.y - */speed.y;
            //this.positionPrev = this.position;
            this.stepCounter = 0;
            //this.speed = speed;
            this.isInMotion = true;
        },
        checkMovement: function() {
            if (this.isInMotion) {
                this.move();
                this.checkStop();
            }
        },
        checkStop: function() {
            if (++this.stepCounter == this.STEPS_TOTAL) {
                this.stepCounter = 0;
                this.isInMotion = false;
            }
        },
        move11: function() {
            this.position.x += this.speed.x;
            this.position.y += this.speed.y;
        },
        move: function(/*deltaTime, timeScale, correction*/) {
            var deltaTime = 1000 / 60;
            var timeScale = 1;
            var correction = 1;
            var deltaTimeSquared = Math.pow(deltaTime * timeScale * timeScale, 2);

            // from the previous step
            var frictionAir = 1 - this.frictionAir * timeScale * timeScale,
                speedPrevX = this.position.x - this.positionPrev.x,
                speedPrevY = this.position.y - this.positionPrev.y;

            // update speed with Verlet integration
            this.speed.x = (speedPrevX * frictionAir * correction) +
                            (this.force.x / this.mass) * deltaTimeSquared;
            this.speed.y = (speedPrevY * frictionAir * correction) +
                            (this.force.y / this.mass) * deltaTimeSquared;

         //   if (!this.stepCounter) console.log('velocity x ' + this.speed.x + ', y ' + this.speed.y);

            this.positionPrev.x = this.position.x;
            this.positionPrev.y = this.position.y;
            this.position.x += this.speed.x;
            this.position.y += this.speed.y;
        //    console.log(this.position);
        }
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
         //       console.log(this.targetCoefficient);
            }
            if ("c" in newData && "e" in newData) {
                players[newData.id] = { "color": newData.c,
                                        "element": newData.e,
                                        "angle" : 2 * Math.PI,
                                        "protonNumber" : 6,
                                        "protonTime" : 1};
            }
            if ('shn' in newData) {
                players[newData.shn]["angle"] = 0;
                Game.soundNeutron.play();
                //the player who shot neutron is players[newData.shn]
            }
            if ('shp' in newData) {
                -- players[newData.shp]["protonNumber"];
                players[newData.shp]["protonTime"] = 0;
                Game.soundProton.play();
                //the player who shot proton is players[newData.shp]
            }
            if ("ne" in newData && players[newData.id]) {
                players[newData.id]["element"] = newData.ne;
            }
            if ("dp" in newData) {
                delete players[newData.dp];
            }
            if ("dead" in newData) {
                Game.soundDeath.play();
                //alert($('#dead').css("display"))
                $('#dead').css("display","block")
                //alert("you're dead lol");
                //location.reload();
                //console.log("you're dead lol");
            }
            if ("ng" in newData) {
                garbageAll[newData.ng] = new Garbage(newData.ms, newData.p, newData.e);
            }
            if ("dg" in newData) {
                delete garbageAll[newData.dg];
            }
            if ("m" in newData) {
                garbageAll[newData.m].setInMotion(newData.f,
                                                    { x: newData.v.x/* * 1.18*/,
                                                    y: newData.v.y/* * 1.18*/},
                                                    newData.p);
          //      console.log("got x " + newData.p.x + ", y " + newData.p.y);
            }
        },
        updateOutput: function(mouseX, mouseY) {
            this.outputData.mouseX = mouseX;
            this.outputData.mouseY = mouseY;
        },
        getCoefficient: function() {
            return this.coefficient / this.coefficientScale;
        },
        Scale: function(position) {
            var middle = 0.5;
            return { x: (position.x - Game.gameSize.x * middle) * this.getCoefficient()
                + Game.gameSize.x * middle, y: (position.y - Game.gameSize.y * middle)
                * this.getCoefficient() + Game.gameSize.y * middle
            }
        },
        targetScale: function(position) {
            var middle = 0.5;
            return { x: (position.x - Game.gameSize.x * middle) * this.targetCoefficient /
            this.coefficientScale + Game.gameSize.x * middle, y: (position.y - Game.gameSize.y * middle)
            * this.targetCoefficient / this.coefficientScale  + Game.gameSize.y * middle
            }
        },
        backScale: function(position) {
            var middle = 0.5;
            return { x: (position.x - Game.gameSize.x * middle) / this.getCoefficient()
                + Game.gameSize.x * middle, y: (position.y - Game.gameSize.y * middle)
                / this.getCoefficient() + Game.gameSize.y * middle
            }
        },
        send: false
    };

    var Game = {};
    Game = new Noch('canvas');


    window.onresize = function() {
        Game.canvas.width = Game.gameSize.x
            = window.innerWidth;
        Game.canvas.height = Game.gameSize.y
            = window.innerHeight;
        var resolution = { "x": Game.gameSize.x,
                           "y": Game.gameSize.y };

        socket.send(JSON.stringify(resolution));
    };

    //creating connection
    var socket = new WebSocket(WS_URL);

    //getting data
    socket.onmessage = function(event) {
        var newData = JSON.parse(event.data);
        if (!("player" in newData)) {
            //console.log('got message ' + event.data);
        }
        freshData.updateInput(event.data);
        // console.log(freshData.inputData.player);

        //updateInput(event.data);
    };

    /*socket.on("np", function() {
        console.log("hi");
    });*/

    //sending data
    document.onmousemove = function(event) {
        if (Game.activePlayer)
            freshData.updateOutput(event.clientX, event.clientY);
    };

    document.onmousedown = function() {
        if (Game.activePlayer) {
            // event.preventDefault();
            freshData.send = true;
        }
    };

    document.onmouseup = function() {
        if (Game.activePlayer)
            freshData.send = false;
    };

    document.onkeydown = function(event) {
        if (Game.activePlayer){
            if (event.keyCode == 32) {
                shoot(event, "p");
                //if (Game.indicatorProton.state == INDI_PROTON_STATE_ON){
                //    Game.indicatorProton.state = INDI_PROTON_STATE_NONE;
                //    Game.indicatorProton.startTime = new Date().getTime();
                //}
            }
            if (event.keyCode == 78) {
                shoot(event, "n");
                //if (Game.indicator.state == INDI_STATE_FULL){
                //    Game.indicator.state = INDI_STATE_NONE;
                //    Game.indicator.startTime = new Date().getTime();
                //}
            }
        }
    };

    function shoot(event, particle) {
        event.preventDefault();
        var shot = {
            "shotX": freshData.outputData.mouseX,
            "shotY": freshData.outputData.mouseY,
            "particle": particle
        };
        socket.send(JSON.stringify(shot));
    }

    socket.onopen = function() {
        console.log("Connected.");
        var resolution = {  "x": Game.gameSize.x,
                            "y": Game.gameSize.y };
        socket.send(JSON.stringify(resolution));

        freshData.updateOutput(Game.gameSize.x,
                               Game.gameSize.y);

        Game.start();
    };

    socket.onclose = function(event) {
        if (event.wasClean) {
            console.log('Connection closed. All clear.');
        } else {
            alert("Connection failed.");
        }
        console.log('Code ' + event.code +
            " reason: " + event.data);
    };

    socket.onerror = function(error) {
        alert("Error " + error.message);
    };
    //////////////////////////////////////////////
    var previousX, previousY, prevFlag = 0;
    var scaleFlag = true;
    var borderTimer = 0;

})();
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
        var flag_array = 0;

        this.gameSize = { x: this.canvas.width,
                          y: this.canvas.height };
        console.log(this.gameSize);

        this.img_count = 7;
        this.backImageCount1 = 30;
        this.backImageCount2 = 35;
        this.backImageCount3 = 30;
        this.cloudsCount = 29;
        this.numberOfClouds = 29;
        this.numberOfObjects1 = 200;
        this.numberOfObjects2 = 75;
        this.numberOfObjects3 = 40;
        this.backGroundOffset = this.gameSize.y / 2;

        function imageLoaded(){
            flag_array++;
        }

        imageLoaded();  // "Костыль тут, ибо без него не работает т.к. убрал fon. см ниже"

        //for (var i=1; i<this.img_count+1; i++){
        //    var img = new Image();
        //    var path= String(i);
        //    path+=".png";
        //
        //    img.src = path;
        //    arrayOfImages.push(img);
        //    img.onload = imageLoaded();
        //}
        for (var i = 1; i < this.cloudsCount + 1; i++){
            var img = new Image();
            img.src = "clouds/" + String(i) + ".png";
            this.arrayOfClouds.push(img);
            img.onload = imageLoaded();
        }

        for (i = 1; i < this.backImageCount3 + 1; i++){
            img = new Image();
            img.src = "3layer/" + "q" + String(i) + ".png";
            this.arrayOfImages3.push (img);
            img.onload = imageLoaded();
        }

        for (i = 1; i < this.backImageCount2 + 1; i++){
            img = new Image();
            img.src = "2layer/" + String(i) + ".png";
            this.arrayOfImages2.push (img);
            img.onload = imageLoaded();
        }

        for (i = 1; i < this.backImageCount1 + 1; i++){
            img = new Image();
            img.src = "1layer/" + String(i) + ".png";
            this.arrayOfImages1.push (img);
            img.onload = imageLoaded();
        }



        this.backObjectClass = function (gameSize) {
            this.rescale = function (point) {
                point = freshData.Scale (point);
            };
            this.check = function (point, speed, vector, trajectory){
              //  var position = freshData.Scale ({x : point.x, y : point.y});
                if (point.x > gameSize.x + gameSize.y / 2) {
                    point.x = - gameSize.y / 2;
                    point.y = Math.random() * (2 * gameSize.y) - gameSize.y / 2;
                   // point = freshData.backScale (point);

                }
                if (point.x < - gameSize.y / 2) {
                    point.x = gameSize.x + gameSize.y / 2;
                    point.y = Math.random() * (2 * gameSize.y) - gameSize.y / 2;
                  //  point = freshData.backScale (point);
                }
                if (point.y < - gameSize.y / 2) {
                    point.x = Math.random() * (gameSize.x + gameSize.y) - gameSize.y / 2;
                    point.y = 1.5 * gameSize.y;
                   // point = freshData.backScale (point);
                }
                if (point.y > 1.5 * gameSize.y) {
                    point.x = Math.random() * (gameSize.x + gameSize.y) - gameSize.y / 2;
                    point.y = - gameSize.y / 2;
                   // point = freshData.backScale (point);
                }
            };
            this.checkCloud = function (point, image){
                //var position = freshData.Scale ({x : point.x, y : point.y});
                if (point.x > gameSize.x + image.width * 3) {
                    point.x = - image.width * 2.5;
                    point.y = Math.random() * (2 * gameSize.y) - gameSize.y / 2;
                  //  point = freshData.backScale (point);
                }
                if (point.x < - image.width * 3) {
                    point.x = gameSize.x + image.width * 2.5;
                    point.y = Math.random() * (2 * gameSize.y) - gameSize.y / 2;
                 //   point = freshData.backScale (point);
                }
                if (point.y < - image.height * 3) {
                    point.x = Math.random() * (gameSize.x + gameSize.y) - gameSize.y / 2;
                    point.y = gameSize.y + image.height * 2.5;
                   // point = freshData.backScale (point);
                }
                if (point.y >  gameSize.y + image.height * 3) {
                    point.x = Math.random() * (gameSize.x + gameSize.y) - gameSize.y / 2;
                    point.y = - image.height * 2.5;
                  //  point = freshData.backScale (point);
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
                        point.x +=  1.5 * speed * vector.x * Math.cos (angle.value / 100) * freshData.getCoefficient();
                        point.y += 1.5 * speed * vector.y * Math.sin (angle.value / 100) * freshData.getCoefficient();
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
                var position = {x:point.x,y:point.y}; //freshData.Scale ({x : point.x, y : point.y});
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


        //this.bObjects1 = [];
        //this.bObjects2 = [];
        //this.bObjects3 = [];

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
            self.draw(ctx, self.gameSize);
            requestAnimationFrame(gameLoop);
        };

       // while(flag_array!=this.img_count +1);
        // ctx.drawImage(fon, 0, 0);

        gameLoop();
    };

    var INDI_STATE_FULL = 2,
        INDI_STATE_IN_PROGRESS = 1,
        INDI_STATE_NONE = 0;
    var INDI_NEUTRON_TIME_CARBON = 8,
        INDI_NEUTRON_TIME_BORON = 12,
        INDI_NEUTRON_TIME_OXYGEN = 6,
        INDI_NEUTRON_TIME_NITROGEN = 8,
        INDI_NEUTRON_TIME_BERYLLIUM = 4,
        INDI_NEUTRON_TIME_LITHIUM = -1,
        INDI_NEUTRON_TIME_FLUORINE = 4,
        INDI_NEUTRON_TIME_HELIUM = -1,
        INDI_NEUTRON_TIME_NEON = 8;
    var INDI_PROTON_TIME_CARBON = 20,
        INDI_PROTON_TIME_BORON = 10,
        INDI_PROTON_TIME_OXYGEN = 60,
        INDI_PROTON_TIME_NITROGEN = 10,
        INDI_PROTON_TIME_BERYLLIUM = 10,
        INDI_PROTON_TIME_LITHIUM = 15,
        INDI_PROTON_TIME_FLUORINE = 20,
        INDI_PROTON_TIME_HELIUM = 20,
        INDI_PROTON_TIME_NEON = 8;
    var INDI_PROTON_STATE_ON = 1,
        INDI_PROTON_STATE_NONE = 0;

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

    var radiusesArray = [26, 18, 72, 56, 49, 40, 31, 30, 36, 19];

    Noch.prototype = {

        drawBackground: function(ctx, gameSize ) {
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
                    if (freshData.coefficient != freshData.targetCoefficient){
                        for (var i = 0; i < this.numberOfClouds; i++) {
                            this.clouds[i].rescale(this.clouds[i].point);
                        }
                        for ( i = 0; i < this.numberOfObjects1; i++) {
                            this.bObjects1[i].rescale(this.bObjects1[i].point);
                        }
                        for ( i = 0; i < this.numberOfObjects2; i++) {
                            this.bObjects2[i].rescale(this.bObjects2[i].point);
                        }
                        for ( i = 0; i < this.numberOfObjects3; i++) {
                            this.bObjects3[i].rescale(this.bObjects3[i].point);
                        }
                    }
                    var deltaX = freshData.getCoefficient() * (freshData.inputData.player.x - previousX);
                    var deltaY = freshData.getCoefficient() * (freshData.inputData.player.y - previousY);
                    //console.log("1 ",deltaX);
                    //console.log("2 ",deltaX * freshData.getCoefficient());
                    //console.log("3 " ,deltaX / freshData.getCoefficient());

                    for ( i = 0; i < this.numberOfClouds; i++) {
                        // console.log(this.numberOfClouds);
                        this.clouds[i].point.x -= deltaX  % gameSize.x;
                        this.clouds[i].point.y -= deltaY  % gameSize.y;
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

                } else prevFlag = 1;
                //console.log (freshData.coefficient, " ", freshData.targetCoefficient);
                previousX = freshData.inputData.player.x;
                previousY = freshData.inputData.player.y;
                scaleFlag = 0;
                if (freshData.coefficient != freshData.targetCoefficient){

                    if (scaleFlag) {
                        scaleFlag = false;
                        var relativeCoef = freshData.coefficient / freshData.targetCoefficient;
                        // console.log(relativeCoef);
                        if (relativeCoef > 1) this.addObjects(relativeCoef, gameSize, ctx);
                        else this.deleteObjects(relativeCoef, gameSize);

                    }
                }
                else scaleFlag = true;
                //console.log(gameSize);
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
                    object.point = freshData.Scale(object.point);
                    break;
                case 1 : //up
                    object.point.x = Math.random() * (gameSize.x + summ) - this.backGroundOffset;
                    object.point.y = Math.random() * difference - relativeCoef * this.backGroundOffset;
                    object.point = freshData.Scale(object.point);
                    break;
                case 2 : //rigth
                    object.point.x = Math.random() * difference + gameSize.x + this.backGroundOffset;
                    object.point.y = Math.random() * (gameSize.y + summ) - this.backGroundOffset;
                    object.point = freshData.Scale(object.point);
                    break;
                case 3 : //down
                    object.point.x = Math.random() * (gameSize.x + summ) - relativeCoef * this.backGroundOffset;
                    object.point.y = Math.random() * (difference) + gameSize.y + this.backGroundOffset;
                    object.point = freshData.Scale(object.point);
                    break;
            }
        },

        checkPoint : function (object, relativeCoef, gameSize){
            // var x = object.point.x;
            //var y = object.point.y;
            var position = freshData.Scale ({x : object.point.x, y : object.point.y});
            var newOffset = relativeCoef * this.backGroundOffset;
            return (position.x < - newOffset || position.x > gameSize.x + newOffset
            || position.y < - newOffset || position.y > gameSize.y + newOffset);
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

        indicatorProton : {
            state : INDI_PROTON_STATE_ON,
            color : 'white',
            time : 0,
            radius : 5,
            sizeCoefficient : 0.5,
            size : 20,
            number : 6,
            shiftX : 20,
            shiftY : 5,
            duration : INDI_PROTON_TIME_CARBON * 1000,
            startTime : 0,

            draw : function (x, y, radius, ctx){
                if (this.state) {
                    this.color = 'white';
                    this.drawNumber (x, y, radius, ctx);
                }
                else {
                    this.color = 'grey';
                    this.time = (new Date().getTime() - this.startTime) / this.duration;
                    if (this.time < 1) this.drawNumber (x, y, radius, ctx);
                    else {
                        this.state = INDI_PROTON_STATE_ON;
                        this.radius -= 1;
                    }
                }
            },


            changeState : function (){
                this.state = (this.state + 1) % 2;
            },

            drawNumber : function (x, y, radius, ctx){
                ctx.save();
                ctx.fillStyle = this.color;
                var fontSize = this.size * freshData.getCoefficient();
                ctx.font = "bold " + fontSize + "px tellural_altbold";
                ctx.fillText (this.number, x + radius * 0.5 * freshData.getCoefficient(),
                    y - radius * 0.2 * freshData.getCoefficient());
                ctx.restore();
            }
        },

        indicator : {
            radius : radiusesArray[5],
            counterClockwise : false,
            state : INDI_STATE_FULL,
            currentAngle : Math.PI / 2,
            startAngle : Math.PI / 2,
            endAngle : 2.5 * Math.PI,
            speed :  2 * Math.PI / (INDI_NEUTRON_TIME_CARBON * 45),
            color : 'rgba(204,0,65,1)',
            width : 10,
            time : 0,
            startTime : 0,
            duration : INDI_NEUTRON_TIME_CARBON * 1000,

            draw : function (x, y, radius, color, ctx) {
                this.drawDefault (x, y, radius, ctx);
                switch (this.state){
                    case INDI_STATE_FULL :
                        //console.log("k");
                        this.drawFull (x, y, radius, color, ctx);
                        break;
                    case INDI_STATE_IN_PROGRESS :
                        //console.log("kk");
                        this.drawProgress (x, y, radius, color, ctx);
                        break;
                    case INDI_STATE_NONE :
                        this.state = INDI_STATE_IN_PROGRESS;
                        this.currentAngle = Math.PI / 2;
                        break;
                }
            },
            drawFull : function (x, y, radius, color, ctx) {
                ctx.save();
                ctx.beginPath();
                ctx.lineWidth = this.width * freshData.getCoefficient();
                ctx.arc (x, y, radius * freshData.getCoefficient(), this.startAngle, this.endAngle, this.counterClockwise);
                ctx.strokeStyle = color;
                ctx.stroke();
                ctx.restore();
            },
            drawProgress : function (x, y, radius, color, ctx) {
                ctx.save();
                this.time = (new Date().getTime() - this.startTime);
                this.currentAngle = this.startAngle + (this.endAngle - this.startAngle) * this.time / this.duration;
                ctx.beginPath();
                ctx.lineWidth = this.width * freshData.getCoefficient();
                ctx.arc (x, y, radius * freshData.getCoefficient(), this.startAngle, this.currentAngle, this.counterClockwise);
                ctx.strokeStyle = color;
                ctx.stroke();
                if (this.time > this.duration) this.state = INDI_STATE_FULL;
                ctx.restore();
            },
            drawDefault : function (x, y, radius, ctx){
                ctx.save();
                ctx.beginPath();
                ctx.lineWidth = this.width * freshData.getCoefficient();
                ctx.arc (x, y, radius * freshData.getCoefficient(), 0, 2 * Math.PI);
                ctx.strokeStyle = 'grey';
                ctx.stroke();
                ctx.restore();
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

        drawElement: function(ctx, x, y, radius, color) {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.lineWidth = 7 * freshData.getCoefficient();
            ctx.strokeStyle = color;//"white";
            ctx.stroke();
            ctx.fillStyle = "black";//color;
            ctx.fill();
        },

        drawStuff: function(stuff, radius, ctx) {

            if (freshData.inputData[stuff]) {
                for (var i = 0; i < freshData.inputData[stuff].length; i += 2) {
                    var x = freshData.inputData[stuff][i];
                    var y = freshData.inputData[stuff][i + 1];

                    var pos = freshData.Scale({x: x, y: y});

                    if (pos) {
                        this.drawElement(ctx, pos.x, pos.y,
                            radius * freshData.getCoefficient(), "white");
                        this.addLetter(ctx, pos.x, pos.y, /*JSON.stringify({ x: pos.x +
                             freshData.inputData.player.x, y: pos.y +
                             freshData.inputData.player.y })*/stuff,
                            radius * freshData.getCoefficient());
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

        drawPlayers: function(ctx) {
            if (freshData.inputData.players) {
                var _players = freshData.inputData.players;

                for (var i = 0; i < _players.length; i += 3) {
                    if (players[_players[i]]) {
                        var pos = freshData.Scale({x: _players[i + 1], y: _players[i + 2]});
                        this.drawElement (ctx, pos.x, pos.y,
                            radiuses[players[_players[i]].element]
                            * freshData.getCoefficient(),
                            players[_players[i]].color);
                        this.addLetter (ctx, pos.x, pos.y,
                            players[_players[i]].element,
                            radiuses[players[_players[i]].element]
                            * freshData.getCoefficient());
                        this.indicatorProton.draw (pos.x, pos.y, radiuses[players[_players[i]].element], ctx);
                        this.indicator.draw (pos.x, pos.y, radiuses[players[_players[i]].element],
                            players[_players[i]].color, ctx);
                    }
                }
            }
        },

        drawBorder: function(ctx) {
            if (freshData.inputData.border) {
                var border = freshData.inputData.border;
                var width = 20 * freshData.getCoefficient();
                var height = 100 * freshData.getCoefficient();

                var half = 0.5;

                for (var i = 0; i < border.length; i += 3) {
                    ctx.beginPath();
                    ctx.save();

                    var x = border[i];
                    var y = border[i + 1];
                    var angle = border[i + 2];

                    var pos = freshData.Scale({ x: x, y: y });

                    ctx.translate(pos.x, pos.y);
                    ctx.rotate(angle);

                    ctx.rect(-width * half, - height * half, width * half/*30*/, height);
                    ctx.strokeStyle = 'White';
                    ctx.lineWidth = 4 * freshData.getCoefficient();

                    var grd = ctx.createLinearGradient(-width * half, - height * half,
                                                        width * half/* 30*/, -height * half);

                    grd.addColorStop(0.35, 'black');
                    //grd.addColorStop(0.45, "rgba(0, 0, 0, 1)");
                    grd.addColorStop(1, "transparent");

                    ctx.fillStyle = grd;
                    //temporary
                    //ctx.fill();

                    ctx.stroke();
                    ctx.restore();
                }
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
            this.drawBorder(ctx);
        }
    };

    var players = {};

    var freshData = {
        previousRadius: 50,
        coefficient: 1000,
        targetCoefficient: 1000,
        coefficientScale: 1000,
        inputData: {},
        outputData:{ "mouseX": 0, "mouseY": 0 },
        updateInput: function(data) {
            var newData = JSON.parse(data);
            if ("player" in newData) {
                this.inputData = newData;
            }
            if ("coefficient" in newData) {
                var dicimalPlacesNumber = 2;
                this.targetCoefficient = (newData.coefficient).toFixed(
                        dicimalPlacesNumber) * this.coefficientScale;
                console.log(this.targetCoefficient);
            }
            if ("c" in newData && "e" in newData) {
                players[newData.id] = { "color": newData.c,
                                        "element": newData.e};
            }
            if ("ne" in newData && players[newData.id]) {
                players[newData.id]["element"] = newData.ne;
            }
            if ("dp" in newData) {
                delete players[newData.dp];
            }
            if ("dead" in newData) {
                alert("you're dead lol");
                console.log("you're dead lol");
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
        send: false
    };

    var Game = {};
    Game = new Noch('canvas');


    window.onresize = function() {
        Game.canvas.width = Game.gameSize.x
            = window.innerWidth;
        Game.canvas.height = Game.gameSize.y
            = window.innerHeight;
        var resolution = {  "x": Game.gameSize.x,
            "y": Game.gameSize.y };

        socket.send(JSON.stringify(resolution));
    };

    //creating connection
    var socket = new WebSocket(WS_URL);

    //getting data
    socket.onmessage = function(event) {
        //console.log('got message ' + event.data);
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

})();
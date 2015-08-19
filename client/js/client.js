;(function() {
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
    })




    var Noch = function(canvasId) {
        this.activePlayer = false;

        this.canvas = document.getElementById(canvasId);
        var ctx = this.canvas.getContext('2d');

        this.started = false;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        var arrayOfImages = [];
        var flag_array = 0;

        this.gameSize = { x: this.canvas.width,
                          y: this.canvas.height };
        console.log(this.gameSize);

        this.img_count = 7;
        this.number_of_objects1 = 65;
        this.number_of_objects2 = 45;
        this.number_of_objects3 = 20;

        function imageLoaded(){
            flag_array++;
        }

        imageLoaded();  // "Костыль тут, ибо без него не работает т.к. убрал fon. см ниже"
        // var fon;
        // fon = new Image();
        // fon.src = "fon.jpg";
        // fon.onload = imageLoaded();

        for (var i=1; i<this.img_count+1; i++){
            var img = new Image();
            var path= String(i);
            path+=".png";

            img.src = path;
            arrayOfImages.push(img);
            img.onload = imageLoaded();
        }


        function backObjectClass (gameSize) {
            this.check = function (point, speed, vector, traectory){
                if(point.X > gameSize.x + gameSize.y/2) {
                    point.X = - gameSize.y/2;
                    point.Y = Math.random() * (2 * gameSize.y) - gameSize.y/2;

                }
                if(point.X < - gameSize.y/2) {
                    point.X = gameSize.x + gameSize.y/2;
                    point.Y = Math.random() * (2 * gameSize.y) - gameSize.y/2;
                }
                if(point.Y < - gameSize.y/2) {
                    point.X = Math.random() * (gameSize.x + gameSize.y) - gameSize.y/2;
                    point.Y = 1.5 * gameSize.y;
                }
                if(point.Y > 1.5 * gameSize.y) {
                    point.X = Math.random() * (gameSize.x + gameSize.y) - gameSize.y/2;
                    point.Y = - gameSize.y/2;
                }
            };
            this.move = function (point, speed, vector, angle, traectory){
                switch (traectory % 3){
                    case 0: // translation
                        point.X += speed * vector.X;
                        point.Y += 0.7 * speed * vector.Y;
                        break;
                    case 1: // rotational motion
                        angle.a += speed;
                        point.X +=  1.5 * speed * vector.X * Math.cos(angle.a / 100);
                        point.Y += 1.5 * speed * vector.Y * Math.sin(angle.a / 100);
                        break;
                    case 2: // compound motion
                        if (Math.round(speed * 100) % 2 == 0) {
                            point.X += 0.5 * speed * vector.X;
                            point.Y += 0.4 * speed * vector.Y;
                        }
                        angle.angle+=speed;
                        break;
                }
            };
            this.drawBO = function (image, point, speed, angle, traectory, level, ctx){
                switch (traectory % 3){
                    case 0:
                        ctx.drawImage(image, point.X, point.Y,
                            image.width*level / 3 * freshData.getCoefficient(),
                            image.height*level / 3 * freshData.getCoefficient());
                        break;
                    case 1:
                        ctx.drawImage(image, point.X , point.Y,
                            image.width*level / 3 * freshData.getCoefficient(),
                            image.height*level / 3 * freshData.getCoefficient());
                        break;
                    case 2:
                        drawRotatedImage (image, point.X, point.Y,
                            angle.a * angle.v, level);
                        break;
                }

                function drawRotatedImage(image, xx, yy, angle, kk) {
                    var TO_RADIANS = Math.PI / 180;

                    ctx.save();
                    ctx.translate(xx, yy);
                    ctx.rotate(angle * TO_RADIANS );

                    ctx.drawImage(image, -(image.width*kk/6),
                        -(image.height*kk/6), image.width*kk/3
                        * freshData.getCoefficient(), image.height*kk/3
                        * freshData.getCoefficient());

                    ctx.restore();
                }
            }

        }

        function BackObject (gameSize, ctx, level, image){
            backObjectClass.call(this, gameSize, ctx);
            this.image = arrayOfImages[image];
            this.point = {X : Math.random() * (gameSize.x + gameSize.y) - gameSize.y/2,
                         Y : Math.random() * (2 * gameSize.y) - gameSize.y/2};
            this.level = level;
            this.speed = level * 0.05 + Math.random();
            var t1 = Math.random() - 0.5;
            var t2 = Math.random() - 0.5;
            this.vector  = {
                X : t1/Math.abs(t1),
                Y : t2/Math.abs(t2)
            };
            this.angle = { a:1, v: t1/Math.abs(t1)};
            this.traectory = Math.round(Math.random()*10);
        }
        /////


        this.bObjects1 = [];
        this.bObjects2 = [];
        this.bObjects3 = [];
        //var backObject = new BackObject(this.gameSize, 3, i%this.img_count);
        //console.log( "s ", backObject.speed  );
        for ( i=0; i<this.number_of_objects1; i++) {
            this.bObjects1[i] = new BackObject(this.gameSize, ctx, 1, i % this.img_count);
        }
        for ( i=0;i<this.number_of_objects2;i++) {
            this.bObjects2[i] = new BackObject(this.gameSize, ctx, 2, i % this.img_count);
        }
        for ( i=0;i<this.number_of_objects3;i++){
            this.bObjects3[i] = new BackObject(this.gameSize, ctx, 3, i%this.img_count );

        }

        var self = this;
        var gameLoop = function() {
            self.update();
            self.draw(ctx, self.gameSize);
            requestAnimationFrame(gameLoop);
        };

        while(flag_array!=this.img_count +1);
        // ctx.drawImage(fon, 0, 0);

        gameLoop();
    };

    Noch.prototype = {

        drawBackground: function(ctx, gameSize ) {
            if (freshData.inputData.player) {

                //temporary
                //this.fillWithLines("x", "y", ctx, gameSize);
                //this.fillWithLines("y", "x", ctx, gameSize);

                if (prev_flag == 1 ) {
                    var deltaX = (freshData.inputData.player.x - previousX) / 2;
                    var deltaY = (freshData.inputData.player.y - previousY) / 2;

                    for (var i = 1; i < 4; ++i) {
                        this.drawObjects(i, deltaX, deltaY, gameSize, ctx);
                    }

                } else prev_flag = 1;
                previousX = freshData.inputData.player.x;
                previousY = freshData.inputData.player.y;
            }
        },

        drawObjects: function(number, deltaX, deltaY, gameSize, ctx) {
            for (var i = 0; i < this["number_of_objects" + number]; i++) {
                this["bObjects" + number][i].point.X -= deltaX % gameSize.x;
                this["bObjects" + number][i].point.Y -= deltaY % gameSize.y;
                this["bObjects" + number][i].move(this["bObjects" + number][i].point,
                    this["bObjects" + number][i].speed, this["bObjects" + number][i].vector,
                    this["bObjects" + number][i].angle, this["bObjects" + number][i].traectory);
                this["bObjects" + number][i].check(this["bObjects" + number][i].point,
                    this["bObjects" + number][i].speed, this["bObjects" + number][i].vector,
                    this["bObjects" + number][i].traectory);
                this["bObjects" + number][i].drawBO(this["bObjects" + number][i].image,
                    this["bObjects" + number][i].point, this["bObjects" + number][i].speed,
                    this["bObjects" + number][i].angle, this["bObjects" + number][i].traectory,
                    this["bObjects" + number][i].level, ctx);
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
            ctx.lineWidth = 1;
            ctx.strokeStyle = "black";
            ctx.stroke();
            ctx.fillStyle = color;
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
                        this.drawElement(ctx, pos.x, pos.y,
                            radiuses[players[_players[i]].element]
                            * freshData.getCoefficient(),
                            players[_players[i]].color);
                        this.addLetter(ctx, pos.x, pos.y,
                            players[_players[i]].element,
                            radiuses[players[_players[i]].element]
                            * freshData.getCoefficient());
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
            ctx.fillStyle = 'red';

            //letter += '+\n' + x + '+\n' + y;
            var length = (letter.split('')).length;

            var letterSizeCoefficient = 1.5;

            var fontSize = radius * letterSizeCoefficient / Math.sqrt(length);

            var xReducer = 5,
                yReducer = 6;
            
            ctx.font = "bold " + fontSize + "px Arial";
            ctx.fillText(letter, x - radius / 2 - (length - 1) * radius / xReducer,
                y + radius / 2 + - (length - 1) * radius / yReducer);
        },

        fillWithLines: function(mainAxis, secondAxis, ctx, gameSize) {
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
    var socket = new WebSocket('ws://localhost:8085');

    //getting data
    socket.onmessage = function(event) {
        //console.log('got message ' + event.data);
        freshData.updateInput(event.data);
        console.log(freshData.inputData.player);
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
            event.preventDefault();
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
            }
            if (event.keyCode == 78) {
                shoot(event, "n");
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
    var previousX,previousY,prev_flag=0;

})();
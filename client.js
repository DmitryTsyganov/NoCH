;(function() {
	var Noch = function(canvasId) {
		this.canvas = document.getElementById(canvasId);
		var ctx = this.canvas.getContext('2d');

		this.started = false;

		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		this.gameSize = { x: canvas.width,
						  y: canvas.height };

		var arrayOfImages = [];
		var flag_array = 0;

		this.img_count=7;
        this.number_of_objects1 = 65;
        this.number_of_objects2 = 45;
        this.number_of_objects3 = 20;
		function imageLoaded(){
			flag_array++;
		}
        var fon;
        fon = new Image();
        fon.src = "fon.jpg";
        fon.onload = imageLoaded();

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
                switch (traectory%3){
                    case 0: // translation
                        point.X += speed * vector.X;
                        point.Y += 0.7*speed * vector.Y;
                        break;
                    case 1: // rotational motion
                        angle.a += speed;
                        point.X +=  1.5 * speed * vector.X * Math.cos(angle.a / 100);
                        point.Y += 1.5 * speed * vector.Y * Math.sin(angle.a / 100);
                        break;
                    case 2: // compound motion
                        if (Math.round(speed*100)%2 == 0) {
                            point.X += 0.5*speed * vector.X;
                            point.Y += 0.4*speed * vector.Y;
                        }
                        angle.angle+=speed;
                        break;
                }
            };
            this.drawBO = function (image, point, speed, angle, traectory, level, ctx){
                switch (traectory % 3){
                    case 0:
                        ctx.drawImage(image, point.X, point.Y,
                            image.width*level / 3, image.height*level / 3);
                        break;
                    case 1:
                        ctx.drawImage(image, point.X , point.Y,
                            image.width*level / 3, image.height*level / 3);
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
                        -(image.height*kk/6), image.width*kk/3, image.height*kk/3);

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
			self.draw(ctx, self.gameSize,arrayOfImages,self.img_count, fon);
			requestAnimationFrame(gameLoop);
		};

		while(flag_array!=this.img_count +1);
        ctx.drawImage(fon, 0, 0);

		gameLoop();
	};

	var Game = {};

	window.onload = function() {
		 Game = new Noch('canvas');
	};

	window.onresize = function() {
		Game.canvas.width = Game.gameSize.x
			= window.innerWidth;
		Game.canvas.height = Game.gameSize.y
			= window.innerHeight;
	};

	var freshData = {
		inputData: {},
		outputData:{ "mouseX": 0, "mouseY": 0 },
		updateInput: function(data) {
			this.inputData = JSON.parse(data);
		},
		updateOutput: function(mouseX, mouseY) {
			this.outputData.mouseX = mouseX;
			this.outputData.mouseY = mouseY;
		}
	};

	//creating connection
	var socket = new WebSocket('ws://localhost:8085');

	//getting data
	socket.onmessage = function(event) {
		console.log('got message ' + event.data);

		freshData.updateInput(event.data);
		//updateInput(event.data);
	};

	//sending data
	document.onmousemove = function(event) {
		/*var message = { "mouseX": event.clientX,
						"mouseY": event.clientY };*/
		freshData.updateOutput(event.clientX, event.clientY);
		//socket.send(JSON.stringify(message));
	};

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
			alert('Connection closed. All clear.');
		} else {
			alert("Connection failed.");
		}
		alert('Code ' + event.code +
			" reason: " + event.data);
	};

	socket.onerror = function(error) {
		alert("Error " + error.message);
	};
	//////////////////////////////////////////////
	var previousX,previousY,prev_flag=0;



	Noch.prototype = {

		drawBackground: function(ctx, gameSize ) {
			if (freshData.inputData.player) {

                //temporary
				//this.fillWithLines("x", "y", ctx, gameSize);
				//this.fillWithLines("y", "x", ctx, gameSize);

				if (prev_flag == 1 ) {
					var deltaX = (freshData.inputData.player.x - previousX);
					var deltaY = (freshData.inputData.player.y - previousY);

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
			if (this.started) {
				socket.send(JSON.stringify(freshData.outputData));
			}

		},
		drawPlayer: function(ctx, gameSize) {
			if (Game.gameSize) {
				ctx.beginPath();
				ctx.arc(Game.gameSize.x / 2,
						Game.gameSize.y / 2,
						40, 0, 2 * Math.PI);
				ctx.stroke();
				ctx.fillStyle = 'white';
				ctx.fill();
			}
		},
		drawOpponents: function(ctx, gameSize) {
			if (freshData.inputData.total) {
				for (var i = 1; i <= freshData.inputData.total; ++i) {
					ctx.beginPath();
					ctx.arc(freshData.inputData["position" + i].x,
						freshData.inputData["position" + i].y,
						40, 0, 2 * Math.PI);
					ctx.stroke();
					ctx.fillStyle = 'white';
					ctx.fill();
				}
			}
		},



		fillWithLines: function(mainAxis, secondAxis, ctx, gameSize) {
			var squareSide = 30;
			ctx.strokeStyle = 'white';

			var lineCoords = { x: 0, y: 0 };

			for (var i = squareSide - freshData.inputData.player[mainAxis]
				% squareSide; i < gameSize[mainAxis]; i += squareSide) {

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
			//draws squares to help player navigate
			this.drawBackground(ctx, gameSize);
			this.drawPlayer(ctx, gameSize);
			this.drawOpponents(ctx, gameSize);
		}
	};

})();
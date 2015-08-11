;(function() {
	var Noch = function(canvasId) {
		this.canvas = document.getElementById(canvasId);
		var ctx = canvas.getContext('2d');

		this.started = false;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		this.gameSize = { x: canvas.width,
						  y: canvas.height };

		var playersOnScreen = [];
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
            this.check = function (p, s, v, t){
                if(p.X > gameSize.x + gameSize.y/2) {
                    p.X = - gameSize.y/2;
                    p.Y = Math.random() * (2 * gameSize.y) - gameSize.y/2;

                }
                if(p.X < - gameSize.y/2) {
                    p.X = gameSize.x + gameSize.y/2;
                    p.Y = Math.random() * (2 * gameSize.y) - gameSize.y/2;
                }
                if(p.Y < - gameSize.y/2) {
                    p.X = Math.random() * (gameSize.x + gameSize.y) - gameSize.y/2;
                    p.Y = 1.5 * gameSize.y;
                }
                if(p.Y > 1.5 * gameSize.y) {
                    p.X = Math.random() * (gameSize.x + gameSize.y) - gameSize.y/2;
                    p.Y = - gameSize.y/2;
                }
            };
            this.move = function (p, s, v, a, t){
                switch (t%3){
                    case 0: // по прямой
                        p.X += s * v.X;
                        p.Y += 0.7*s * v.Y;
                        break;
                    case 1: // по кругу
                        a.a+=s;
                        p.X +=  1.5 * s* v.X*Math.cos(a.a/100);
                        p.Y += 1.5 * s* v.Y*Math.sin(a.a/100);
                        break;
                    case 2: // вращение + мб перемещение
                        if (Math.round(s*100)%2 == 0) {
                            p.X += 0.5*s * v.X;
                            p.Y += 0.4*s * v.Y;
                        }
                        a.a+=s;
                        break;
                }
            };
            this.drawBO = function (i, p, s, a, t , l, ctx){
                switch (t%3){
                    case 0:
                        ctx.drawImage(i, p.X, p.Y, i.width*l/3, i.height*l/3);
                        break;
                    case 1:
                        ctx.drawImage(i, p.X , p.Y, i.width*l/3, i.height*l/3);
                        break;
                    case 2:
                        drawRotatedImage (i, p.X, p.Y, a.a* a.v, l);
                        break;
                }

                function drawRotatedImage(image, xx, yy, angle, kk) {
                    var TO_RADIANS = Math.PI/180;
                    // save the current co-ordinate system
                    // before we screw with it
                    ctx.save();
                    // move to the middle of where we want to draw our image
                    ctx.translate(xx, yy);
                    // rotate around that point, converting our
                    // angle from degrees to radians
                    ctx.rotate(angle * TO_RADIANS );
                    // draw it up and to the left by half the width
                    // and height of the image
                    ctx.drawImage(image, -(image.width*kk/6), -(image.height*kk/6), image.width*kk/3, image.height*kk/3);
                    // and restore the co-ords to how they were when we began
                    ctx.restore();
                }
            }

        }

        function BackObject (gameSize, ctx, l, i){
            backObjectClass.call(this, gameSize, ctx);
            this.image = arrayOfImages[i];
            this.point = {X : Math.random() * (gameSize.x + gameSize.y) - gameSize.y/2,
                         Y : Math.random() * (2 * gameSize.y) - gameSize.y/2};
            this.level = l;
            this.speed = l * 0.05 + Math.random();
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

		while(flag_array!=this.img_count +1);//обработать ошибку загрузки
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
		//console.log('got message ' + event.data);

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

				//this.fillWithLines("x", "y", ctx, gameSize);
				//this.fillWithLines("y", "x", ctx, gameSize);

				if (prev_flag == 1 ) {
					var deltaX = (freshData.inputData.player.x - previousX);
					var deltaY = (freshData.inputData.player.y - previousY);

					for (var i = 0; i < this.number_of_objects1; i++) {
                        this.bObjects1[i].point.X -= (deltaX) % gameSize.x;
                        this.bObjects1[i].point.Y -= (deltaY) % gameSize.y;
                        this.bObjects1[i].move(this.bObjects1[i].point, this.bObjects1[i].speed, this.bObjects1[i].vector, this.bObjects1[i].angle, this.bObjects1[i].traectory);
                        this.bObjects1[i].check(this.bObjects1[i].point, this.bObjects1[i].speed, this.bObjects1[i].vector, this.bObjects1[i].traectory);
                        this.bObjects1[i].drawBO(this.bObjects1[i].image, this.bObjects1[i].point, this.bObjects1[i].speed, this.bObjects1[i].angle, this.bObjects1[i].traectory, this.bObjects1[i].level, ctx);
					}
                    for (i = 0; i < this.number_of_objects2; i++) {
                        this.bObjects2[i].point.X -= (deltaX) % gameSize.x;
                        this.bObjects2[i].point.Y -= (deltaY) % gameSize.y;
                        this.bObjects2[i].move(this.bObjects2[i].point, this.bObjects2[i].speed, this.bObjects2[i].vector, this.bObjects2[i].angle, this.bObjects2[i].traectory);
                        this.bObjects2[i].check(this.bObjects2[i].point, this.bObjects2[i].speed, this.bObjects2[i].vector,  this.bObjects2[i].traectory);
                        this.bObjects2[i].drawBO(this.bObjects2[i].image, this.bObjects2[i].point, this.bObjects2[i].speed, this.bObjects2[i].angle, this.bObjects2[i].traectory, this.bObjects2[i].level, ctx);

                    }
                    for (i = 0; i < this.number_of_objects3; i++) {
                        this.bObjects3[i].point.X -= deltaX % gameSize.x;
                        this.bObjects3[i].point.Y -= deltaY % gameSize.y;
                        this.bObjects3[i].move(this.bObjects3[i].point, this.bObjects3[i].speed, this.bObjects3[i].vector, this.bObjects3[i].angle, this.bObjects3[i].traectory);
                        this.bObjects3[i].check(this.bObjects3[i].point, this.bObjects3[i].speed, this.bObjects3[i].vector,  this.bObjects3[i].traectory);
                        this.bObjects3[i].drawBO(this.bObjects3[i].image, this.bObjects3[i].point, this.bObjects3[i].speed, this.bObjects3[i].angle, this.bObjects3[i].traectory, this.bObjects3[i].level, ctx);
                    }
				}
				else prev_flag = 1;
				previousX = freshData.inputData.player.x;
				previousY = freshData.inputData.player.y;
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
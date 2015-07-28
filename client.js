;(function() {
	var Noch = function(canvasId) {
		this.canvas = document.getElementById(canvasId);
		var ctx = canvas.getContext('2d');

		this.started = false;

		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		this.gameSize = { x: this.canvas.width,
						  y: this.canvas.height };

		var self = this;

		var gameLoop = function() {
			self.update();
			self.draw(ctx, self.gameSize);
			requestAnimationFrame(gameLoop);
		};

		gameLoop();
	};

	var Game = {};

	window.onload = function() {
		 Game = new Noch('canvas');
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
                this.previousRadius = newData.newRadius;
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
		//updateInput(event.data);
	};

	//sending data
	document.onmousemove = function(event) {
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

	document.onkeydown = function(event) {
        console.log(event);
		if (event.keyCode == 32) {
            event.preventDefault();
            var shot = {
                "shotX": freshData.outputData.mouseX,
                "shotY": freshData.outputData.mouseY
            };
            socket.send(JSON.stringify(shot));
        }
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

	Noch.prototype = {

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

		drawElement: function(ctx, x, y, radius) {
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, 2 * Math.PI);
			ctx.stroke();
			ctx.fillStyle = 'white';
			ctx.fill();
		},

        drawStuff: function(stuff, letter, radius, ctx) {

            if (freshData.inputData[stuff]) {
                for (var i = 0; i < freshData.inputData[stuff].length; ++i) {
                    var pos = freshData.inputData[stuff][i];

                    pos = freshData.Scale(pos);

                    if (pos) {
                        this.drawElement(ctx, pos.x, pos.y, radius * freshData.getCoefficient());
                        this.addLetter(ctx, pos.x, pos.y, letter, radius * freshData.getCoefficient());
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

                    var pos = freshData.Scale(border[i].position);

                    ctx.translate(pos.x, pos.y);
                    ctx.rotate(border[i].angle);

                    ctx.rect(-width * half, - height * half, width, height);
                    ctx.strokeStyle = 'White';
                    ctx.lineWidth = 4 * freshData.getCoefficient();

                    var grd = ctx.createLinearGradient(-width * half, - height * half,
                                                        width * half, -height * half);

                    grd.addColorStop(0.6, 'white');
                    grd.addColorStop(0.9, "rgba(255, 255, 255, 0.6)");
                    grd.addColorStop(1, "rgba(255, 255, 255, 0)");

                    ctx.fillStyle = grd;
                    //temporary
                    //ctx.fill();

                    ctx.stroke();
                    ctx.restore();
                }
            }
        },


		addLetter: function(ctx, x, y, letter, radius) {
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

		drawBackground: function(ctx, gameSize) {
			if (freshData.inputData.player) {
				this.fillWithLines("x", "y", ctx, gameSize);
				this.fillWithLines("y", "x", ctx, gameSize);
			}
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
			ctx.clearRect(0 ,0, gameSize.y, gameSize.x);

			//creating black background
			ctx.fillStyle = "rgb(0, 0, 0)";
			ctx.fillRect(0, 0, gameSize.x, gameSize.y);

			//draws squares to help player navigate
			this.drawBackground(ctx, gameSize);

			//this.drawPlayer(ctx, gameSize);
            this.drawStuff("Hydrogen", "H", 26, ctx);
            this.drawStuff("Carbon", "C", 40, ctx);
			this.drawStuff("Helium", "He", 18, ctx);
			this.drawStuff("Lithium", "Li", 72, ctx);
			this.drawStuff("Beryllium", "Be", 56, ctx);
			this.drawStuff("Boron", "B", 49, ctx);
			this.drawStuff("Oxygen", "O", 30, ctx);
			this.drawStuff("Neon", "Ne", 19, ctx);
			this.drawStuff("Fluorine", "F", 36, ctx);
            this.drawStuff("proton", "p", 9, ctx);
            this.drawStuff("Nitrogen", "N", 31, ctx);
            this.drawBorder(ctx);
			//this.drawProtons(ctx);
		}

	};

})();
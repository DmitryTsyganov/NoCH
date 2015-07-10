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

	Noch.prototype = {

		start: function() {
			this.started = true;
		},

		isStarted: function() {
			return this.started;
		},

		update: function() {
			console.log('hi');
			if (this.started) {
				socket.send(JSON.stringify(freshData.outputData));
			}

		},
		drawPlayer: function(ctx, gameSize) {
			if (Game.gameSize) {
				ctx.beginPath();
				//console.log(freshData.inputData.player.x);
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
			ctx.clearRect(0 ,0, gameSize.y, gameSize.x);

			//creating black background
			ctx.fillStyle = "rgb(0, 0, 0)";
			ctx.fillRect(0, 0, gameSize.x, gameSize.y);

			//draws squares to help player navigate
			this.drawBackground(ctx, gameSize);

			this.drawPlayer(ctx, gameSize);
			this.drawOpponents(ctx, gameSize);
		}

	};

})();
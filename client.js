;(function() {
	var Noch = function(canvasId) {
		this.canvas = document.getElementById(canvasId);
		var ctx = canvas.getContext('2d');

		canvas.width = window.outerWidth;
		canvas.height = window.outerHeight;

		this.gameSize = { x: canvas.width, y: canvas.height };

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
		Game.canvas.width = Game.gameSize.x = window.outerWidth;
		Game.canvas.height = Game.gameSize.y = window.outerHeight;
	};

	var freshData = {
		actualData: {},
		setLastData: function(data) {
			this.actualData = JSON.parse(data);
		}
	};

	//creating connection
	var socket = new WebSocket('ws://localhost:8085');

	//getting data
	socket.onmessage = function(event) {
		//console.log('got message ' + event.data);

		freshData.setLastData(event.data);
		//setLastData(event.data);
	};

	//sending data
	document.onmousemove = function(event) {
		var message = { "mouseX": event.clientX,
						"mouseY": event.clientY };
		socket.send(JSON.stringify(message));
	};

	socket.onclose = function(event) {
		if (event.wasClean) {
			alert('Connection closed. All clear.');
		} else {
			alert("Connection failed.");
		}
		alert('Code ' + event.code + " reason: " + event.data);
	};

	socket.onerror = function(error) {
		alert("Error " + error.message);
	};

	Noch.prototype = {
		update: function() {
			console.log('hi');

		},
		drawPlayer: function(ctx, gameSize) {
			if (freshData.actualData.player) {
				ctx.beginPath();
				//console.log(freshData.actualData.player.x);
				ctx.arc(freshData.actualData.player.x, freshData.actualData.player.y, 40, 0, 2 * Math.PI);
				ctx.stroke();
				ctx.fillStyle = 'white';
				ctx.fill();
			}
		},
		drawOpponents: function(ctx, gameSize) {
			if (freshData.actualData.total) {
				for (var i = 1; i <= freshData.actualData.total; ++i) {
					ctx.beginPath();
					ctx.arc(freshData.actualData["position" + i].x,
						freshData.actualData["position" + i].y, 40, 0, 2 * Math.PI);
					ctx.stroke();
					ctx.fillStyle = 'white';
					ctx.fill();
				}
			}
		},
		draw: function(ctx, gameSize) {
			ctx.clearRect(0 ,0, gameSize.y, gameSize.x);

			//creating black background
			ctx.fillStyle = "rgb(0, 0, 0)";
			ctx.fillRect(0, 0, gameSize.x, gameSize.y);

			this.drawPlayer(ctx, gameSize);
			this.drawOpponents(ctx, gameSize);
		},

	};

})();
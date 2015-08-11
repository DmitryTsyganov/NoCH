/**
 * Created by fatman on 06/07/15.
 */

var Player = function(id, ws, width, height) {

    this.mapSize = {
        x: width,
        y: height
    };
    this.id = id;
    this.position = { x: 0, y: 0 };
    this.ws = ws;
    this.resolution = { width: 0, height: 0 };
    /*some game related stuff*/

};

Player.prototype = {
    setResolution: function(res) {
        this.resolution.width = res["x"];
        this.resolution.height = res["y"];
    },
    setPosition: function(pos) {
        this.position.x = pos["x"];
        this.position.y = pos["y"];
    },
    getLocalPosition: function() {
        return { x: this.resolution.width / 2,
                 y: this.resolution.height / 2 };
    },
    addToPos: function(axis, value) {
        newVal = this.position[axis] + value;
        if (newVal > this.mapSize[axis]) {
            newVal = this.mapSize[axis];
        }
        if (newVal < 0) {
            newVal = 0;
        }
        this.position[axis] = newVal;
    }
};

module.exports = Player;
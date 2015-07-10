var params;
exports.connect = function() {
    params = require("./parametrs");
};

exports.getParameter = function(name) {
    if (!params[name]) {
        throw new Error("Unknow parametr " + name);
    }
    return params[name];
};
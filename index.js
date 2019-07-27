require("dotenv").config();

var bot = require("./src/bot");
require("./web")(bot);

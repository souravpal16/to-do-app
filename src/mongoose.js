const mongoose = require("mongoose");

const connectionUrl = process.env.MONGO_URL;

mongoose
  .connect(connectionUrl)
  .then(() => console.log("database connected"))
  .catch((err) => console.log("could not connect to database"));

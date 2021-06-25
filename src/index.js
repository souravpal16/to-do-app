const express = require("express");
require("./mongoose");
const User = require("./db/models/User");
const Task = require("./db/models/Task");

const app = express();
const port = process.env.PORT || "3000";

// we need to recieve data as request body, in JSON, for a post request
app.use(express.json());

// users
app.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    res.status(201).send(user);
  } catch (err) {
    res.status(400).send(`Error: ${err}`);
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/users/:id", async (req, res) => {
  const _id = req.params.id;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(400).send(`Error: user with id ${_id} not found`);
    }
    res.send(user);
  } catch (err) {
    res.status(500).send(err);
  }
});

// tasks
app.post("/tasks", async (req, res) => {
  const task = new Task(req.body);

  try {
    await task.save();
    res.status(201).send(task);
  } catch (err) {
    res.status(400).send(err);
  }
});

app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.send(tasks);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/tasks/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findById(_id);
    if (!task) {
      return res.status(400).send(`Task does not exist in database`);
    }
    res.send(task);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(port, () => console.log(`listening to port ${port}`));

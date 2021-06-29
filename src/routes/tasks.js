const express = require("express");
const Task = require("../db/models/Task");
const { findOne } = require("../db/models/User");

const auth = require("../middlewares/auth");

const taskRouter = new express.Router();

// tasks
taskRouter.post("/tasks", auth, async (req, res) => {
  const task = new Task({ ...req.body, owner: req.user._id });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (err) {
    res.status(400).send(err);
  }
});

taskRouter.get("/tasks", auth, async (req, res) => {
  // return all tasks which have their owner prop== authenticated user
  // we can use populate method or manually find by filtering owner;
  try {
    // populate the tasks property (which is virtual in our case) of req.user, and execute it
    await req.user.populate("tasks").execPopulate();
    const tasks = req.user.tasks;

    res.send(tasks);
  } catch (err) {
    res.status(500).send("failed");
  }
});

taskRouter.get("/tasks/:id", auth, async (req, res) => {
  // return the task which has the required id, AND an owner property = the user who is authenticated
  const _id = req.params.id;
  try {
    const task = await Task.findOne({ _id: _id, owner: req.user._id });
    if (!task) {
      return res.status(400).send();
    }
    res.send(task);
  } catch (err) {
    res.status(500).send(err);
  }
});

taskRouter.patch("/tasks/:id", auth, async (req, res) => {
  const allowedProps = ["description", "completed"];
  const requestedProps = Object.keys(req.body);
  // check if the client tried to change a property that does not exist in user model
  const isValidUpdate = requestedProps.every((prop) =>
    allowedProps.includes(prop)
  );

  if (!isValidUpdate) {
    return res
      .status(400)
      .send(
        "Invalid update request. You tried to update a property that does not exist"
      );
  }

  try {
    const _id = req.params.id;
    // options object: sets updatedUser to the updated user from database, and runs validator before updating
    // complex methods like findOneAndUpdate will override middlewares, so we need to do it manually.
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      return res.status(400).send(`Error: task not found`);
    }
    requestedProps.forEach((prop) => (task[prop] = req.body[prop]));

    res.send(task);
  } catch (err) {
    res.status(500).send(err);
  }
});

taskRouter.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) return res.status(400).send(`task not found`);

    await task.remove();
    res.send(task);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = taskRouter;

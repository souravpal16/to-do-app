const express = require("express");
const Task = require("../db/models/Task");

const taskRouter = new express.Router();

// tasks
taskRouter.post("/tasks", async (req, res) => {
  const task = new Task(req.body);

  try {
    await task.save();
    res.status(201).send(task);
  } catch (err) {
    res.status(400).send(err);
  }
});

taskRouter.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.send(tasks);
  } catch (err) {
    res.status(500).send(err);
  }
});

taskRouter.get("/tasks/:id", async (req, res) => {
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

taskRouter.patch("/tasks/:id", async (req, res) => {
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
    const updatedTask = await Task.findByIdAndUpdate(_id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedTask) {
      return res.status(400).send(`Error: task with id ${_id} not found`);
    }
    res.send(updatedTask);
  } catch (err) {
    res.status(500).send(err);
  }
});

taskRouter.delete("/tasks/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    const deletedTask = await Task.findByIdAndDelete(_id);
    if (!deletedTask)
      return res.status(400).send(`task with id ${_id} not found`);

    res.send(deletedTask);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = taskRouter;

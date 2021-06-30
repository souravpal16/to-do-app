const express = require("express");
const Task = require("../db/models/Task");

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

// GET /tasks?completed=true ,  returns all tasks which are completed
// GET /tasks?limit=num , limits number of tasks returned to num
// GET /tasks?page=num , sends data of the nth page,based on the limit set
// GET /tasks?sortBy=createdAt:asc , sorts by createdAt prop in ascending order
// GET /tasks?sortBy=completed
taskRouter.get("/tasks", auth, async (req, res) => {
  const { completed, limit, page, sortBy } = req.query;

  // return all tasks which have their owner prop== authenticated user
  // we can use populate method or manually find by filtering owner;
  try {
    // populate the tasks property (which is virtual in our case) of req.user, and execute it
    // await req.user.populate("tasks").execPopulate();
    // but we also want to apply some filters to the search, so we need to pass an object instead of just a string
    const match = {};
    const sort = {};
    if (sortBy) {
      const [propToSort, order] = sortBy.split(":");
      sort[propToSort] = order === "des" ? -1 : 1;
    }

    if (completed) {
      // this works because query is a string, so even if the query is "false", it wont be a falsy value
      // we convert the string to bool and store in match
      match.completed = completed === "true";
    }
    // first arg is the field that is to be populated, second arg is an object containing fields that much match
    // if no query, match.completed will be undefined and no filteration will be applied
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(limit),
          skip: limit ? parseInt(page - 1) * parseInt(limit) : page,
          // -1 pages start from 1, and at , say page 1, we skip 0 itmes
          // if no limit set, you cant set pages, so just skip (page) number of items. (fallback)
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (err) {
    res.status(500).send(err);
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

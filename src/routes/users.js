const express = require("express");
const User = require("../db/models/User");

const userRouter = new express.Router();

// users
userRouter.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    res.status(201).send(user);
  } catch (err) {
    res.status(400).send(`Error: ${err}`);
  }
});

userRouter.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (err) {
    res.status(500).send(err);
  }
});

userRouter.get("/users/:id", async (req, res) => {
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

userRouter.patch("/users/:id", async (req, res) => {
  const allowedProps = ["name", "age", "password", "email"];
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

    // complex methods like findbyidanupdate, bypass mongoose, and hence middlewares like bcrypt, so we have to manually update
    const user = await User.findById(_id);
    if (!user) {
      return res.status(400).send(`Error: user with id ${_id} not found`);
    }

    requestedProps.forEach((prop) => (user[prop] = req.body[prop]));
    await user.save();
    res.send(user);
  } catch (err) {
    res.status(500).send(err);
  }
});

userRouter.delete("/users/:id", async (req, res) => {
  const _id = req.params.id;

  try {
    const deletedUser = await User.findByIdAndDelete(_id);
    if (!deletedUser)
      return res.status(400).send(`Error: user with id ${_id} not found`);
    res.send(deletedUser);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = userRouter;

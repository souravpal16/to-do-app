const express = require("express");
const User = require("../db/models/User");
const auth = require("../middlewares/auth");

const userRouter = new express.Router();

// we'll add auth as a second optional argument in each route which should only run when token is verified

// users
userRouter.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    const token = await user.getAuthToken();
    user.tokens = user.tokens.concat({ token });
    await user.save();
    res.status(201).send({ user, token });
  } catch (err) {
    res.status(400).send(err);
  }
});

// post request, data is sent from the client in request body, while in get request
// data is sent in the URL, so it is less secure.
// also, if private data like password is sent in the request through url, you can just copy paste the
// link to get access to the user profile without logging in
userRouter.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // using custom method
    const user = await User.findByCredentials(email, password);
    const token = await user.getAuthToken();
    // push the new token in the tokens array of user, so that user can have multiple tokens for different devices.
    user.tokens = user.tokens.concat({ token });
    await user.save();
    res.send({ user, token });
  } catch (err) {
    res.status(400).send("error");
  }
});

userRouter.post("/users/logout", auth, async (req, res) => {
  // remove the current auth token from the lists of tokens for current user, and save in the database
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    res.send();
  } catch (err) {
    res.status(400).send();
  }
});

userRouter.post("/users/logoutall", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (err) {
    res.status(400).send();
  }
});

// use to show profile of a user. no need to find user by id , since we have the current user via req.user (from middleware)
// client will have to manually send the token as Authentication prop of headers, when they make any request that requires auth;
// we are using postman for automatically do this thing for us
userRouter.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

userRouter.patch("/users/me", auth, async (req, res) => {
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
    const user = req.user;

    requestedProps.forEach((prop) => (user[prop] = req.body[prop]));
    await user.save();
    res.send(user);
  } catch (err) {
    res.status(500).send(err);
  }
});

userRouter.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = userRouter;

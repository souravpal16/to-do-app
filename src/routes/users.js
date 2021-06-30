const express = require("express");
const User = require("../db/models/User");
const auth = require("../middlewares/auth");
const multer = require("multer");
const userRouter = new express.Router();

// create an instance of multer, lke we create app as an instance of express
// the options obj contains dest, which will be the folder in which files will be saved;
const megabytes = 1000000;
const uploads = multer({
  // dest: "avatars",   =>this will create a new avatars folder if its not there already, and cut off access from the file in handler fnc

  limits: {
    fileSize: 1 * megabytes,
  },
  fileFilter(req, file, callback) {
    // this function gets called by multer internally, to filter the file types
    // the file arg contains info abour the received fie
    // the callback function allows to exit the fileFilter fnc when we are done.
    // callback has first arg as an err, second as a bool we set it to true when the file is OK
    const acceptableMimes = ["image/jpeg", "image/png"];
    const isFileOkay = acceptableMimes.some((mime) => mime === file.mimetype);
    if (!isFileOkay) {
      // must call return or the the other callback will be called anyway
      return callback(new Error("File type not supported"), undefined);
    }
    callback(undefined, true);
  },
});

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

// post user avatars
// user uploads as a middleware, use single method as we only need one file
// pass in the name of the file you want to look for in the sent data
// the data received should be form-data type
// multer will look for a file with key name avatar, and save it in avatar folder
userRouter.post(
  "/users/me/avatar",
  auth,
  uploads.single("avatar"),
  async (req, res) => {
    // file from multer can be accessed with req.file.
    if (req.file.buffer) {
      req.user.avatar = req.file.buffer;
      await req.user.save();
    }
    res.send();
  },
  (err, req, res, next) => {
    // if we pass a fnctn after our request handler, with 4 args as above,
    // express will use this fnc to handle any thrown errors that were not handled,
    // like if our middleware throws an error here, the handler wont be called, so we can handle that error here
    res.status(400).send({ error: err.message });
  }
);

// use to show profile of a user. no need to find user by id , since we have the current user via req.user (from middleware)
// client will have to manually send the token as Authentication prop of headers, when they make any request that requires auth;
// we are using postman for automatically do this thing for us
userRouter.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

userRouter.get("/users/me/avatar", auth, async (req, res) => {
  try {
    if (!req.user.avatar) throw new Error();
    res.set("Content-Type", "image/jpg");
    res.send(req.user.avatar);
  } catch (err) {
    res.status(404).send();
  }
});

// public fetch avatar
userRouter.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user?.avatar) throw new Error();

    res.set("Content-Type", "image/jpg");
    res.send(user.avatar);
  } catch (err) {}
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

// edit avatar
userRouter.patch(
  "/users/me/avatar",
  auth,
  uploads.single("avatar"),
  async (req, res) => {
    try {
      req.user.avatar = req.file.buffer;
      await req.user.save();
      res.send();
    } catch (err) {
      res.status(400).send();
    }
  }
);

// delete avatar
userRouter.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    if (!req.user.avatar) {
      throw new Error({ error: "No avatar found in user profile" });
    }
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (err) {
    res.status(400).send();
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

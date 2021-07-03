const mongoose = require("mongoose");
const User = require("../src/db/models/User");
const Task = require("../src/db/models/Task");
const jwt = require("jsonwebtoken");

// we are manually providing id so that we can save and use it for auth testing
const userOneId = new mongoose.Types.ObjectId();
const userOne = {
  _id: userOneId,
  name: "ginny butcher",
  age: 20,
  email: "sasha@example.com",
  password: "ginnyButcher",
  tokens: [
    {
      token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET_KEY),
    },
  ],
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
  _id: userTwoId,
  name: "jeff bezos",
  age: 31,
  email: "jeff@example.com",
  password: "jeff337",
  tokens: [
    {
      token: jwt.sign({ _id: userTwoId }, process.env.JWT_SECRET_KEY),
    },
  ],
};

// tasks
const taskOne = {
  _id: new mongoose.Types.ObjectId(),
  description: "look for a job",
  owner: userOneId,
};

const taskTwo = {
  _id: new mongoose.Types.ObjectId(),
  description: "clean house",
  completed: true,
  owner: userOneId,
};

const taskThree = {
  _id: new mongoose.Types.ObjectId(),
  description: "meeting at 5 o clock",
  owner: userTwoId,
};

// cleanup before every test runs
const setupDatabase = async () => {
  try {
    await User.deleteMany();
    await Task.deleteMany();
    await new User(userOne).save();
    await new User(userTwo).save();
    await new Task(taskOne).save();
    await new Task(taskTwo).save();
    await new Task(taskThree).save();
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  userOne,
  userOneId,
  userTwo,
  userTwoId,
  taskOne,
  taskTwo,
  taskThree,
  setupDatabase,
};

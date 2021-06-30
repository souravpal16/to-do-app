const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Task = require("./Task");

// to use a middleware before user.save(). we will have to define the schema seperately before calling mongoose.model;
// second arg is optional, we used it to set timestamps to user object when it gets created and updated

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Anonymous",
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      validate(email) {
        if (!isEmail(email)) {
          throw new Error("Invalid Email address.");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      validate(password) {
        if (password.trim().length <= 6)
          throw new Error("Password is too short");
        if (password.toLowerCase().includes("password".toLowerCase()))
          throw new Error('Password can not include the word "password" in it');
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(age) {
        if (age < 0) {
          throw new Error("Age should be greater than 0.");
        }
      },
    },
    // tokens will be an array of objects, with each obj having token property as a string
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// filter out the tokens array and password from user object before sending it as a response
UserSchema.methods.toJSON = function () {
  // toJSON is a specal function available on js objects
  // it can be used to customize the object data before object.stringify, which is called behind the scenes before sending data as json string.
  // flow: obj.toJSON() =>obj.stringify()=>obj gets send as json string
  const user = this;
  // to remove unneccesary mongoose info from user
  const userObj = user.toObject();
  delete userObj.tokens;
  delete userObj.password;
  return userObj;
};

// custom method that can be accessed on instances of User, not directly on User. it will be called on a user, hence 'this' will be that user;
UserSchema.methods.getAuthToken = async function () {
  const user = this;

  // jwt.sign generates and returns a web token
  // arg1: an opject of properties that is distinct for each user, in our case, _id works
  // arg2: a secret signature, which behind the scene verifies that someone did not temper the token, this can be any string that only the developer will know
  // arg3: optional. sets some options. like in how many days will the token expire automatically
  const token = jwt.sign({ _id: user._id.toString() }, "taskToken5379", {
    expiresIn: "7 days",
  });
  return token;
};

// linking relation bw user and task, adding a tasks array for
// all the tasks (foreign) which have their owner prop === _id prop of the user (local)
// virtual means this tasks array wont save in db, but we can use it temporarily
// this will save us space in the database
UserSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

// custom function on User model to find user by credentials
UserSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email: email });
  if (!user) {
    throw new Error("Invalid credentials. Could not log in");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new Error("Invalid credentials. Could not log in");
  }
  return user;
};

// hash password before saving
UserSchema.pre("save", async function (next) {
  // the function will get access to complete current user object as 'this'
  // this function gets called everytime before user.save() is called.
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  // next tells that our execution is done, user can now be saved (so that async functions can pe performed, and when they get finished we call next)
  next();
});

// delete all tasks associated to user when a user is removed.
UserSchema.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model("User", UserSchema);

module.exports = User;

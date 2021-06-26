const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");

// to use a middleware before user.save(). we will have to define the schema seperately before calling mongoose.model;

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "Anonymous",
    trim: true,
  },
  email: {
    type: String,
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
      if (password.trim().length <= 6) throw new Error("Password is too short");
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
  console.log("hashing user password");
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  // next tells that our execution is done, user can now be saved (so that async functions can pe performed, and when they get finished we call next)
  next();
});

const User = mongoose.model("User", UserSchema);

module.exports = User;

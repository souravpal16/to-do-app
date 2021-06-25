const mongoose = require("mongoose");
const { isEmail } = require("validator");

const User = mongoose.model("User", {
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

module.exports = User;

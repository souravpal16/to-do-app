const jwt = require("jsonwebtoken");
const User = require("../db/models/User");

// auth will be called before routers run, will get access to req and res, same as routers
// only if and when next() is called in auth, the routers will trigger
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    // jwt.verify returns the decoded token with an obj which contains the _id, which we provided while creating the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)._id;
    // the 'tokens.token' is a special mongodb syntax for querying arrya of objects.
    // it checks if the the user has an object with token property equal to our token, in the tokens array (tokens array is a property of user)
    const user = await User.findOne({
      _id: decodedToken,
      "tokens.token": token,
    });
    if (!user) {
      throw new Error();
    }
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    res.status(400).send("Error: Please provide authentication token");
  }
};

module.exports = auth;

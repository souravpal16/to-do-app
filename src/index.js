const express = require("express");
require("./mongoose");

const taskRouter = require("./routes/tasks");
const userRouter = require("./routes/users");
const app = express();
const port = process.env.PORT;

// set up middleware, a function that runs when a request is sent, and before the userRouter/TaskROuter start running
// request=>middleware function=>(if and when next() is called in middleware) routers run
// but if we use app.use(middlewareFnction) here, it will be applied to all routes, we want it only for user routes.

// we need to recieve data (if any) as request body, in JSON
app.use(express.json());
app.use(taskRouter);
app.use(userRouter);

app.listen(port, () => console.log(`listening to port ${port}`));

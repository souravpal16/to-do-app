const express = require("express");
require("./mongoose");

const taskRouter = require("./routes/tasks");
const userRouter = require("./routes/users");
const app = express();
const port = process.env.PORT || "3000";

// we need to recieve data (if any) as request body, in JSON
app.use(express.json());
app.use(taskRouter);
app.use(userRouter);

app.listen(port, () => console.log(`listening to port ${port}`));

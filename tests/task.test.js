const request = require("supertest");
const Task = require("../src/db/models/Task");
const app = require("../src/app");
const { userOne, userTwo, taskOne, setupDatabase } = require("./db");

beforeEach(setupDatabase);

test("should post task", async () => {
  await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: "get plumbing done",
    })
    .expect(201);

  const task = await Task.findById(taskOne._id);
  // for objects and arrays, use toEqual
  expect(task).not.toEqual(null);
  expect(task.completed).toEqual(false);
});

test("should not post task for invalid input fields", async () => {
  await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: "buy groceries",
      completed: 9,
    })
    .expect(400);

  const task = await Task.findOne({ description: "buy groceries" });
  // for objects and arrays, use toEqual
  expect(task).toEqual(null);
});

test("should fetch user tasks", async () => {
  const response = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  // userOne created only two tasks
  expect(response.body.length).toEqual(2);
});

test("should fetch user task by id", async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id.toString()}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body._id.toString()).toEqual(taskOne._id.toString());
});

test("should not fetch user task by id if not authenticated", async () => {
  await request(app).get(`/tasks/${taskOne._id.toString()}`).send().expect(401);
});

test("should not fetch task if the user did not create it", async () => {
  await request(app)
    .get(`/tasks/${taskOne._id.toString()}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);
});

test("should update task", async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id.toString()}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ completed: true })
    .expect(200);

  const task = await Task.findById(taskOne._id);
  expect(task.completed).toBe(true);
});

test("should not update task for invalid input fields", async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id.toString()}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ location: "india" })
    .expect(400);

  const task = await Task.findById(taskOne._id);

  expect(task.completed).toBe(false);
});

test("should not update task if user did not create it", async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id.toString()}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send({ completed: true })
    .expect(404);

  const task = await Task.findById(taskOne._id);

  expect(task.completed).toBe(false);
});

test("should delete task", async () => {
  const response = await request(app)
    .delete(`/tasks/${taskOne._id.toString()}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const task = await Task.findById(response.body._id);
  expect(task).toBe(null);
});

test("should not delete task if user did not create it", async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id.toString()}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);

  const task = await Task.findById(taskOne._id);
  expect(task).not.toBe(null);
});

test("should fetch only completed tasks if query: completed=true is used", async () => {
  const response = await request(app)
    .get("/tasks?completed=true")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.length).toEqual(1);
});

test("should fetch only completed tasks if query: completed=false is used", async () => {
  const response = await request(app)
    .get("/tasks?completed=false")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.length).toEqual(1);
});

test("should sort by time of creation in ascending order if query: sortBy=createdAt:asc is used", async () => {
  const response = await request(app)
    .get("/tasks?sortBy=createdAt:asc")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  // convert date strings to timestamp
  const dateOne = new Date(response.body[0].createdAt).getTime();
  const dateTwo = new Date(response.body[1].createdAt).getTime();
  expect(dateOne).toBeLessThan(dateTwo);
});

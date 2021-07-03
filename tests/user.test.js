const request = require("supertest");
const app = require("../src/app");
const User = require("../src/db/models/User");
const { userOne, userOneId, setupDatabase } = require("./db");

// deletes all users in db before every test runs,
// so that if a user is created in one test, creating it again in the next test wont fail
// then create a user for test purposes
beforeEach(setupDatabase);

test("should signup user", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "mike",
      age: "28",
      email: "mic@example.com",
      password: "mike282",
    })
    .expect(201);

  // assert that the user was added in database
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBe(null);
  // assert the password was hashed
  expect(user.password).not.toBe(userOne.password);
  expect(response.body).toMatchObject({
    user: {
      name: "mike",
      email: "mic@example.com",
    },
    token: user.tokens[0].token,
  });
});

test("should not signup user, if the email is already registered in database", async () => {
  await request(app)
    .post("/users")
    .send({
      name: "ginny butcher",
      age: 20,
      email: "sasha@example.com",
      password: "ginnyButcher",
    })
    .expect(400);
});

test("should login existing user", async () => {
  // response receives the response that the api sends
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  const user = await User.findById(response.body.user._id);
  expect(response.body).toMatchObject({
    user: {
      email: userOne.email,
    },
    token: user.tokens[1].token,
  });
});

test("should not login user with bad credentials", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: "wrongemail@example.com",
      password: "wrongpassword",
    })
    .expect(400);
});

test("should read active user, if user is authenticated", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test("should not read active user, if user is not authenticated", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}wrongAuth`)
    .send()
    .expect(401);
});

test("should delete account for user, if authenticated", async () => {
  // since before this test runs, userOne is automatically saved in db by beforeAll method
  // we delete the user with auth token= userOne
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user).toBe(null);
});

test("should not delete account for user, if not authenticated", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}wrongAuth`)
    .send()
    .expect(401);
});

test("should post avatar for authenticated user", async () => {
  // attact can be used to attach files(supertest)
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .attach("avatar", "tests/files/profilePic.png")
    .expect(200);
  const user = await User.findById(userOneId);
  // check if user.avatar is of buffer type. hence **any** data with type buffer will pass
  // toEqual is lose equality check, toBe is strict equality check
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test("should update valid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: "garry bosh",
    })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.name).toBe("garry bosh");
});

test("should not update valid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: "garry bosh",
      location: "delhi",
    })
    .expect(400);

  const user = await User.findById(userOneId);
  expect(user.name).not.toBe("garry bosh");
});

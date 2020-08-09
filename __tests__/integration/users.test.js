/** Integration tests for users routes */
process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../../app");
const db = require("../../db");

//Username for example user
let ex_username;

beforeEach(async () => {
    let result = await db.query(
        `INSERT INTO users (username, password, first_name, last_name, email)
        VALUES ('asdf', '1234', 'Alex', 'S', 'email@gmail.com')
        RETURNING username`);
  
    ex_username = result.rows[0].username;
});

describe("GET /users", function () {
    test("Gets a list of 1 user", async function () {
        const response = await request(app).get("/users");
        const users = response.body.users;
        expect(users).toHaveLength(1);
        expect(users[0]).toHaveProperty("username");
        expect(users[0]).toHaveProperty("first_name");
        expect(users[0].username).toBe("asdf");
    });
});

describe("POST /users", function () {
    test("Creates a new user", async function () {
        const response = await request(app).post(`/users`).send({
            username: "qwer",
            password: "9999",
            first_name: "John",
            last_name: "Smith",
            email: "email@hotmail.com"
        });
        expect(response.statusCode).toBe(201);
        const user = response.body.user;
        expect(user).toHaveProperty("last_name");
        expect(user).toHaveProperty("email");
        expect(user.last_name).toBe("Smith");
    });

    test("Creating a new user without a first_name", async function () {
        const response = await request(app).post(`/users`).send({
            username: "zxcv",
            password: "99998",
            last_name: "They make windows",
            email: "email@yahoo.com"
        });
        expect(response.statusCode).toBe(400);
    });

    test("Creating a new user with invalid fields", async function () {
        const response = await request(app).post(`/users`).send({
            email: "notanemail"
        });
        expect(response.statusCode).toBe(400);
    });
});

describe("GET /users/:username", function () {
    test("Get a single user by their username", async function () {
        const response = await request(app).get(`/users/${ex_username}`);
        const user = response.body.user;
        expect(user).toHaveProperty("first_name");
        expect(user).toHaveProperty("last_name");
        expect(user.first_name).toBe("Alex");
    });

    test("Respond 404 if the username doesn't exist", async function () {
        const response = await request(app).get("/users/fhgdfggwae");
        expect(response.statusCode).toBe(404);
    });
})

describe("PATCH /users/:username", function () {
    test("Update a user by their username", async function () {
        const response = await request(app).patch(`/users/${ex_username}`).send({
            last_name: "Sy"
        });
        const user = response.body.user;
        expect(user).toHaveProperty("first_name");
        expect(user).toHaveProperty("last_name");
        expect(user.first_name).toBe("Alex");
        expect(user.last_name).toBe("Sy");
    });

    test("Updating a user with invalid fields", async function () {
        const response = await request(app).patch(`/users/${ex_username}`).send({
            email: "microsoft.com"
        });
        expect(response.statusCode).toBe(400);
    });

    test("Respond 404 if the username doesn't exist", async function () {
        const response = await request(app).patch("/users/fhgdfggwae").send({
            first_name: "Al"
        });
        expect(response.statusCode).toBe(404);
    });
});

afterEach(async function () {
    await db.query("DELETE FROM users");
});
  
  
afterAll(async function () {
    await db.end()
});
/** Integration tests for companies routes */
process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../../app");
const db = require("../../db");

//Handle for example company
let ex_handle;

beforeEach(async () => {
    let result = await db.query(
        `INSERT INTO companies (handle, name, num_employees, description, logo_url)
        VALUES ('amzn', 'Amazon', 100000, 'The online bookstore', 'http://logo.com')
        RETURNING handle`);
  
    ex_handle = result.rows[0].handle;
});

describe("GET /companies", function () {
    test("Gets a list of 1 company", async function () {
        const response = await request(app).get("/companies");
        const companies = response.body.companies;
        expect(companies).toHaveLength(1);
        expect(companies[0]).toHaveProperty("handle");
        expect(companies[0]).toHaveProperty("name");
        expect(companies[0].name).toBe("Amazon");
    });

    test("Gets a list of 1 company while using query strings", async function () {
        const response = await request(app).get("/companies?search=amaz&min_employees=1&max_employees=100001");
        const companies = response.body.companies;
        expect(companies).toHaveLength(1);
        expect(companies[0]).toHaveProperty("handle");
        expect(companies[0]).toHaveProperty("name");
        expect(companies[0].name).toBe("Amazon");
    });

    test("Gets a list of 0 company while using query strings that don't match a company", async function () {
        const response = await request(app).get("/companies?search=inte&min_employees=1&max_employees=100001");
        const companies = response.body.companies;
        expect(companies).toHaveLength(0);
    });

    test("Respond 400 when using invalid query strings parameters (min is higher than max)", async function () {
        const response = await request(app).get("/companies?search=amaz&min_employees=2&max_employees=1");
        expect(response.statusCode).toBe(400);
    });

    test("Respond 400 when using invalid query strings parameters (min and max are negative)", async function () {
        const response = await request(app).get("/companies?search=amaz&min_employees=-2&max_employees=-1");
        expect(response.statusCode).toBe(400);
    });

    test("Respond 400 when using invalid query strings parameters (min and max are letters)", async function () {
        const response = await request(app).get("/companies?search=amaz&min_employees=asdf&max_employees=qwer");
        expect(response.statusCode).toBe(400);
    });

    test("Respond 400 when using invalid query strings parameters (min and max include spaces)", async function () {
        const response = await request(app).get("/companies?search=amaz&min_employees=as df&max_employees=qw er");
        expect(response.statusCode).toBe(400);
    });
});

describe("POST /companies", function () {
    test("Creates a new company", async function () {
        const response = await request(app).post(`/companies`).send({
            handle: "intl",
            name: "Intel",
            num_employees: 99999,
            description: "They make processors",
            logo_url: "http://intel.com"
        });
        expect(response.statusCode).toBe(201);
        const company = response.body.company;
        expect(company).toHaveProperty("description");
        expect(company).toHaveProperty("num_employees");
        expect(company.description).toBe("They make processors");
    });

    test("Creating a new company without a name", async function () {
        const response = await request(app).post(`/companies`).send({
            handle: "msft",
            num_employees: 99998,
            description: "They make windows",
            logo_url: "http://microsoft.com"
        });
        expect(response.statusCode).toBe(400);
    });

    test("Creating a new company with invalid fields", async function () {
        const response = await request(app).post(`/companies`).send({
            handle: "msft",
            num_employees: "99998",
            description: 23,
            logo_url: "microsoft.com"
        });
        expect(response.statusCode).toBe(400);
    });
});

describe("GET /companies/:handle", function () {
    test("Get a single company by it's handle", async function () {
        const response = await request(app).get(`/companies/${ex_handle}`);
        const company = response.body.company;
        expect(company).toHaveProperty("description");
        expect(company).toHaveProperty("num_employees");
        expect(company.num_employees).toBe(100000);
    });

    test("Respond 404 if the handle doesn't exist", async function () {
        const response = await request(app).get("/companies/fhgdfggwae");
        expect(response.statusCode).toBe(404);
    });
})

describe("PATCH /companies/:handle", function () {
    test("Update a company by it's handle", async function () {
        const response = await request(app).patch(`/companies/${ex_handle}`).send({
            num_employees: 100001
        });
        const company = response.body.company;
        expect(company).toHaveProperty("description");
        expect(company).toHaveProperty("num_employees");
        expect(company.name).toBe("Amazon");
        expect(company.num_employees).toBe(100001);
    });

    test("Updating a company with invalid fields", async function () {
        const response = await request(app).patch(`/companies/${ex_handle}`).send({
            num_employees: "99998",
            description: 23,
            logo_url: "microsoft.com"
        });
        expect(response.statusCode).toBe(400);
    });

    test("Respond 404 if the handle doesn't exist", async function () {
        const response = await request(app).patch("/companies/fhgdfggwae").send({
            num_employees: 100001
        });
        expect(response.statusCode).toBe(404);
    });
});

afterEach(async function () {
    await db.query("DELETE FROM companies");
});
  
  
afterAll(async function () {
    await db.end()
});
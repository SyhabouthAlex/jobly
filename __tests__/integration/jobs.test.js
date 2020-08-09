/** Integration tests for jobs routes */
process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../../app");
const db = require("../../db");

//Id for example job
let ex_id;

beforeAll(async () => {
    await db.query(
        `INSERT INTO companies (handle, name, num_employees, description, logo_url)
        VALUES ('intl', 'Intel', 100000, 'They make processors', 'http://logo.com')`);
})
beforeEach(async () => {
    let job = await db.query(
        `INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES ('Software Engineer', 100000, 0.3, 'intl')
        RETURNING id`);
    ex_id = job.rows[0].id;
});

describe("GET /jobs", function () {
    test("Gets a list of 1 job", async function () {
        const response = await request(app).get("/jobs");
        const jobs = response.body.jobs;
        expect(jobs).toHaveLength(1);
        expect(jobs[0]).toHaveProperty("company_handle");
        expect(jobs[0]).toHaveProperty("title");
        expect(jobs[0].title).toBe("Software Engineer");
    });

    test("Gets a list of 1 job while using query strings", async function () {
        const response = await request(app).get("/jobs?search=soft&min_salary=1&min_equity=0.1");
        const jobs = response.body.jobs;
        expect(jobs).toHaveLength(1);
        expect(jobs[0]).toHaveProperty("company_handle");
        expect(jobs[0]).toHaveProperty("title");
        expect(jobs[0].title).toBe("Software Engineer");
    });

    test("Gets a list of 0 job while using query strings that don't match a job", async function () {
        const response = await request(app).get("/jobs?search=dev&min_salary=1&min_equity=1");
        const jobs = response.body.jobs;
        expect(jobs).toHaveLength(0);
    });

    test("Respond 400 when using invalid query strings parameters (min_salary and min_equity are negative)", async function () {
        const response = await request(app).get("/jobs?search=soft&min_salary=-1&min_equity=-0.1");
        expect(response.statusCode).toBe(400);
    });

    test("Respond 400 when using invalid query strings parameters (min_salary and min_equity are letters)", async function () {
        const response = await request(app).get("/jobs?search=soft&min_salary=asdf&min_equity=qwer");
        expect(response.statusCode).toBe(400);
    });

    test("Respond 400 when using invalid query strings parameters (min_salary and min_equity include spaces)", async function () {
        const response = await request(app).get("/jobs?search=soft&min_salary=as df&min_equity=qw er");
        expect(response.statusCode).toBe(400);
    });
});

describe("POST /jobs", function () {
    test("Creates a new job", async function () {
        const response = await request(app).post(`/jobs`).send({
            title: "Software Developer",
            salary: 150000,
            equity: 0.2,
            company_handle: "intl"
        });
        expect(response.statusCode).toBe(201);
        console.log(response.body)
        const job = response.body.job;
        expect(job).toHaveProperty("company_handle");
        expect(job).toHaveProperty("equity");
        expect(job.equity).toBe("0.20");
    });

    test("Creating a new job without a salary", async function () {
        const response = await request(app).post(`/jobs`).send({
            title: "Software Developer",
            equity: 0.2,
            company_handle: "intl"
        });
        expect(response.statusCode).toBe(400);
    });

    test("Creating a new job with invalid fields", async function () {
        const response = await request(app).post(`/jobs`).send({
            title: 123,
            equity: "hello",
            company_handle: 23
        });
        expect(response.statusCode).toBe(400);
    });
});

describe("GET /jobs/:id", function () {
    test("Get a single job by it's id", async function () {
        const response = await request(app).get(`/jobs/${ex_id}`);
        const job = response.body.job;
        expect(job).toHaveProperty("salary");
        expect(job).toHaveProperty("equity");
        expect(job.equity).toBe("0.30");
    });

    test("Respond 404 if the id doesn't exist", async function () {
        const response = await request(app).get("/jobs/1234");
        expect(response.statusCode).toBe(404);
    });
})

describe("PATCH /jobs/:id", function () {
    test("Update a job by it's id", async function () {
        const response = await request(app).patch(`/jobs/${ex_id}`).send({
            equity: 0.5
        });
        const job = response.body.job;
        expect(job).toHaveProperty("salary");
        expect(job).toHaveProperty("equity");
        expect(job.salary).toBe("100000.00");
        expect(job.equity).toBe("0.50");
    });

    test("Updating a company with invalid fields", async function () {
        const response = await request(app).patch(`/jobs/${ex_id}`).send({
            salary: "hi",
            equity: 23
        });
        expect(response.statusCode).toBe(400);
    });

    test("Respond 404 if the id doesn't exist", async function () {
        const response = await request(app).patch("/jobs/1234").send({
            equity: 0.5
        });
        expect(response.statusCode).toBe(404);
    });
});

afterEach(async function () {
    await db.query("DELETE FROM jobs");
});
  
  
afterAll(async function () {
    await db.query("DELETE FROM companies");
    await db.end()
});
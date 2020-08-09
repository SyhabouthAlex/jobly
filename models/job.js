//Job model

const db = require("../db");

class Job {
    static async getOne(id) {
        //Retrives information for a job from the database using it's id
        const result = await db.query(
            `SELECT j.id, j.title, j.salary, j.equity, c.handle, c.name,
            c.num_employees, c.description, c.logo_url, j.date_posted
            FROM jobs AS j
            JOIN companies AS c ON j.company_handle = c.handle
            WHERE j.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            throw { message: `There is no job with id '${id}`, status: 404 };
        };
        const job = result.rows[0];
        return {
            id: job.id,
            title: job.title,
            salary: job.salary,
            equity: job.equity,
            company: {
                handle: job.handle,
                name: job.name,
                num_employees: job.num_employees,
                description: job.description,
                logo_url: job.logo_url
            },
            date_posted: job.date_posted
        };
    };

    static async getAll(search, min_salary, min_equity) {
        //Retrives information for all jobs in the database
        if (min_salary && (isNaN(+min_salary) || min_salary.includes(' ') || parseInt(min_salary) <= 0)) {
            throw { message: "min_salary must be a number greater than 0", status: 400 };
        }
        if (min_equity && (isNaN(+min_equity) || min_equity.includes(' ') || parseFloat(min_equity) <= 0 || parseFloat(min_equity) > 1)) {
            throw { message: "min_equity must be a number greater than 0 and less than or equal to 1", status: 400 };
        }

        let searchText = "";
        let salaryText = "";
        let equityText = "";
        let multipleParams = false;

        if (search) {
            searchText = `WHERE title ILIKE '%${search}%'`;
            multipleParams = true;
        };
        if (min_salary) {
            if (multipleParams) {
                salaryText = `AND salary > ${min_salary}`;
            }
            else {
                salaryText = `WHERE salary > ${min_salary}`
                multipleParams = true;
            };
        };
        if (min_equity) {
            if (multipleParams) {
                equityText = `AND equity > ${min_equity}`;
            }
            else {
                equityText = `WHERE equity > ${min_equity}`
                multipleParams = true;
            };
        };
        const result = await db.query(
            `SELECT title, company_handle
            FROM jobs ${searchText} ${salaryText} ${equityText}`
        );
        return result.rows;
    };

    static async create(data) {
        //Create a new job using incoming data
        try {
            const result = await db.query(
                `INSERT INTO jobs (title, salary, equity, company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING id, title, salary, equity, company_handle, date_posted`,
                [data.title, data.salary, data.equity, data.company_handle]
            );
            return result.rows[0]
        }
        catch (e){
            throw e;
        }
    };

    static async update(id, data) {
        //Update an existing job using incoming data
        try {
            const result = await db.query(
                `UPDATE jobs
                SET title = COALESCE($1, title), salary = COALESCE($2, salary), equity = COALESCE($3, equity), company_handle = COALESCE($4, company_handle)
                WHERE id = $5
                RETURNING id, title, salary, equity, company_handle`,
                [data.title, data.salary, data.equity, data.company_handle, id]
            );
            if (result.rows.length === 0) {
                throw { message: `There is no job with id '${id}`, status: 404 };
            };
            return result.rows[0];
        }
        catch (e){
            throw e;
        }
    };

    static async delete(id) {
        //Delete an exisitng job
        const result = await db.query(
            `DELETE FROM jobs
            WHERE id = $1
            RETURNING id`,
            [id]
        );
        if (result.rows.length === 0) {
            throw { message: `There is no job with id '${id}`, status: 404 };
        };
        return "Job deleted";
    }
}

module.exports = Job;
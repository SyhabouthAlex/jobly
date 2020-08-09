//Company model

const db = require("../db");

class Company {
    static async getOne(handle) {
        //Retrives information for a company from the database using it's handle
        const result = await db.query(
            `SELECT handle, name, num_employees, description, logo_url
            FROM companies
            WHERE handle = $1`,
            [handle]
        );
        if (result.rows.length === 0) {
            throw { message: `There is no company with handle '${handle}`, status: 404 };
        };
        return result.rows[0];
    }

    static async getAll(search, min_employees, max_employees) {
        //Retrives information for all companies in the database
        if (min_employees && (isNaN(+min_employees) || min_employees.includes(' ') || parseInt(min_employees) <= 0)) {
            throw { message: "min_employees must be a number greater than 0", status: 400 };
        }
        if (max_employees && (isNaN(+max_employees) || max_employees.includes(' ') || parseInt(max_employees) <= 0)) {
            throw { message: "max_employees must be a number greater than 0", status: 400 };
        }
        if (min_employees && max_employees && min_employees > max_employees) {
            throw { message: "min_employees cannot be greater than max_employees", status: 400 };
        };

        let searchText = "";
        let minText = "";
        let maxText = "";
        let multipleParams = false;

        if (search) {
            searchText = `WHERE name ILIKE '%${search}%'`;
            multipleParams = true;
        };
        if (min_employees) {
            if (multipleParams) {
                minText = `AND num_employees > ${min_employees}`;
            }
            else {
                minText = `WHERE num_employees > ${min_employees}`
                multipleParams = true;
            };
        };
        if (max_employees) {
            if (multipleParams) {
                maxText = `AND num_employees < ${max_employees}`;
            }
            else {
                maxText = `WHERE num_employees < ${max_employees}`
                multipleParams = true;
            };
        };
        const result = await db.query(
            `SELECT handle, name
            FROM companies ${searchText} ${minText} ${maxText}`
        );
        return result.rows;
    }

    static async create(data) {
        //Create a new company using incoming data
        try {
            const result = await db.query(
                `INSERT INTO companies (handle, name, num_employees, description, logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING handle, name, num_employees, description, logo_url`,
                [data.handle, data.name, data.num_employees, data.description, data.logo_url]
            );
            return result.rows[0]
        }
        catch (e){
            if (e.constraint === "companies_pkey") {
                throw { message: "That handle already exists", status: 400 };
            }
            else if (e.constraint === "companies_name_key") {
                throw { message: "That name already exists", status: 400 };
            }
            else {
                throw e;
            }
        }
    }

    static async update(handle, data) {
        //Update an existing company using incoming data
        try {
            const result = await db.query(
                `UPDATE companies
                SET name = COALESCE($1, name), num_employees = COALESCE($2, num_employees), description = COALESCE($3, description), logo_url = COALESCE($4, logo_url)
                WHERE handle = $5
                RETURNING handle, name, num_employees, description, logo_url`,
                [data.name, data.num_employees, data.description, data.logo_url, handle]
            );
            if (result.rows.length === 0) {
                throw { message: `There is no company with handle '${handle}`, status: 404 };
            };
            return result.rows[0];
        }
        catch (e){
            if (e.constraint === "companies_name_key") {
                throw { message: "That name already exists", status: 400 };
            }
            else {
                throw e;
            }
        }
    }

    static async delete(handle) {
        //Delete an exisitng company
        const result = await db.query(
            `DELETE FROM companies
            WHERE handle = $1
            RETURNING handle`,
            [handle]
        );
        if (result.rows.length === 0) {
            throw { message: `There is no company with handle '${handle}`, status: 404 };
        };
        return "Company deleted";
    }
}

module.exports = Company;
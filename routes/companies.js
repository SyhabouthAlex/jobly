//Companies routes
const express = require("express");
const ExpressError = require("../expressError");
const Company = require("../models/company");
const jsonschema = require("jsonschema");
const newCompanySchema = require("../schemas/company_schemas/newCompanySchema.json");
const editCompanySchema = require("../schemas/company_schemas/editCompanySchema.json");
const {ensureLoggedIn, ensureAdmin} = require("../middleware/auth");

const router = new express.Router();

/*
    GET /companies : Return the handle and name for all of the company objects. It should also allow for the following query string parameters

    search - Displays a filtered list of handles and names based on the search term and if the name includes it.
    min_employees - Displays a list titles and company handles that have a number of employees greater than the value of the query string parameter.
    max_employees - Displays a list of titles and company handles that have a number of employees less than the value of the query string parameter.

    If the min_employees parameter is greater than the max_employees parameter, responds with a 400 status and a message notifying that the parameters are incorrect.
*/
router.get("/", ensureLoggedIn, async function (req, res, next) {
    try {
        const companies = await Company.getAll(req.query.search, req.query.min_employees, req.query.max_employees);
        return res.json({companies: companies});
    } catch (err) {
        return next(err);
    }
});

/*
    POST /companies : Create a new company and return the data for it after validating against jsonschema
*/
router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, newCompanySchema);
        if (!result.valid) {
            let listOfErrors = result.errors.map(error => error.stack);
            let error = new ExpressError(listOfErrors, 400);
            return next(error);
        }
    
        const company = await Company.create(req.body);
        return res.status(201).json({company: company});
    } catch (err) {
        return next(err);
    }
});

/*
    GET /companies/[handle] : Search for a company by it's handle and return the result (if it exists)
*/
router.get("/:handle", ensureLoggedIn, async function (req, res, next) {
    try {
        const company = await Company.getOne(req.params.handle);
        return res.json({company: company});
    } catch (err) {
        return next(err);
    }
});

/*
    PATCH /companies/[handle] : Search for a company by it's handle and update it's data based on incoming data and return the result (if it exists)
*/
router.patch("/:handle", ensureAdmin, async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, editCompanySchema);
        if (!result.valid) {
            let listOfErrors = result.errors.map(error => error.stack);
            let error = new ExpressError(listOfErrors, 400);
            return next(error);
        }
        const company = await Company.update(req.params.handle, req.body);
        return res.json({company: company});
    } catch (err) {
        return next(err);
    }
});

/*
    DELETE /companies/[handle] : Search for a company by it's handle and delete it (if it exists)
*/
router.delete("/:handle", ensureAdmin, async function (req, res, next) {
    try {
        const company = await Company.delete(req.params.handle);
        return res.json({message: company});
    } catch (err) {
        return next(err);
    }
});
module.exports = router;
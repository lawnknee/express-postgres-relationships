"use strict"

const express = require("express");
const router = new express.Router();
const db = require("../db");

const { NotFoundError } = require("../expressError");


/** GET / => get all invoices like:
 * {invoices: [{id, comp_code}, ...]}
 */

router.get("/", async function (req, res, next) {
    const results = await db.query(
        `SELECT id, comp_code
           FROM invoices`
    );
    const invoices = results.rows;

    return res.json({ invoices });
});

module.exports = router;


/** GET /:code => get a single invoice like:
 * {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
 */

router.get("/:id", async function (req, res, next) {
    const id = req.params.id;

    const invoiceResults = await db.query(
        `SELECT id, amt, paid, add_date, paid_date, comp_code
          FROM invoices
          WHERE code = $1`,
        [id]
    );
    const invoice = invoiceResults.rows[0];

    const companyResults = await db.query(
        `SELECT code, name, description
            FROM companies
            WHERE code = $1`,
        [invoice.comp_code]
    );
    const company = companyResults.rows[0];

    let invoiceJson = {
        id : invoice.id,
        amt : invoice.amt,
        paid : invoice.paid,
        add_date : invoice.add_date,
        paid_date : invoice.paid_date,
    }

    if (!invoice) throw new NotFoundError();

    return res.json({ company });
});
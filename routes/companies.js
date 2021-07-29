"use strict";

const express = require("express");
const slugify = require("slugify");
const router = new express.Router();
const db = require("../db");

const { NotFoundError } = require("../expressError");

/** GET / => get all companies like:
 * { companies: [{code, name}, ...]} }
 */

router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name
         FROM companies`
  );
  const companies = results.rows;

  return res.json({ companies });
});

/** GET /:code => get a single company like:
 * {company: {code, name, description, invoices:[id, ...]}}
 */
router.get("/:code", async function (req, res, next) {
  const code = slugify(req.params.code, { lower: true, strict: true });

  const results = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code = $1`,
    [code]
    // WHERE code like $1`, ['%'+ code '%']
    // don't want this for GET route because we want the code that's EXACTLY
  );
  let company = results.rows[0];

  if (!company) throw new NotFoundError();

  const invoiceResults = await db.query(
    `SELECT id
        FROM invoices
        WHERE comp_code = $1`,
    [code]
  );

  let invoicesIds = invoiceResults.rows.map( e => e.id);

  company["invoices"] = invoicesIds;

  return res.json({ company });
});

/** POST / => add a new company like:
 * {company: {code, name, description}}
 */
router.post("/", async function (req, res, next) {
  let { code, name, description } = req.body;
  code = slugify(code, { lower: true, strict: true });

  const results = await db.query(
    `INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`,
    [code, name, description]
  );

  const company = results.rows[0];
  return res.status(201).json({ company });
});

/** PUT / => Update a company by company code
 * input: {name, description}
 * output: {company: {code, name, description}}
 */
router.put("/:code", async function (req, res, next) {
  const code = slugify(req.params.code, { lower: true, strict: true });
  let { name, description } = req.body;

  const results = await db.query(
    `UPDATE companies 
      SET name=$2, description=$3
      WHERE code=$1
      RETURNING code, name, description`,
    [code, name, description]
  );

  const company = results.rows[0];

  if (!company) throw new NotFoundError();
  return res.json({ company });
});

/** DELETE /:code => Delete a company by company code:
 *  output: {status: "deleted"}
 */
router.delete("/:code", async function (req, res, next) {
  const code = slugify(req.params.code, { lower: true, strict: true });

  let results = await db.query(
    `DELETE FROM companies 
        WHERE code = $1
        RETURNING code`,
    [code]
  );

  let company = results.rows[0];
  if (!company) throw new NotFoundError();
  // if (!results.row) throw new NotFoundError();
  res.json({ status: "deleted" });
});

module.exports = router;

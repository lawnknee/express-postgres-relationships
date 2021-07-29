const express = require("express");
const router = new express.Router();
const db = require("../db");

const { NotFoundError } = require("../expressError");


/** GET / => get all companies like:
 * companies: [{code, name}, ...]} 
 */

router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name
         FROM companies`);
  const companies = results.rows;

  return res.json({ companies });
});


/** GET /:code => get a single company like:
 * {company: {code, name, description}} 
 */

router.get("/:code", async function (req, res, next) {
  const code = req.params.code;

  const results = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code like $1`, [code]
  );
  const company = results.rows[0];
  
  if (!company) throw new NotFoundError();

  return res.json({ company })
})

/** POST / => add a new company like:
 * {company: {code, name, description}}
*/
router.post("/", async function(req, res, next) {
  let {code, name, description} = req.body;

  const results = await db.query(
    `INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`, [ code, name, description]
  );

  const company = results.rows[0];
  return res.status(201).json({ company })
})

/** PUT / => Update a company by company code
 * input: {name, description}
 * output: {company: {code, name, description}}
*/
router.put("/:code", async function (req, res, next) {
  const code = req.params.code;
  let {name, description} = req.body;

  const results = await db.query(
    `UPDATE companies 
      SET name=$2, description=$3
      WHERE code=$1
      RETURNING code, name, description`, [ code, name, description]
  );

  const company = results.rows[0];

  if (!company) throw new NotFoundError();
  return res.json({ company })
})



module.exports = router;
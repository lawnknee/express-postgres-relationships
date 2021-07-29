"use strict";

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

/** GET /:id => get a single invoice like:
 * {invoice: {id, amt, paid, add_date, paid_date,
 *    company: {code, name, description} }
 */

router.get("/:id", async function (req, res, next) {
  const id = req.params.id;

  const invoiceResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, comp_code
        FROM invoices
        WHERE id = $1`,
    [id]
  );

//   const invoice = invoiceResults.rows[0];
  console.log("THIS IS THE INVOICE_RESULTS[0]", invoiceResults.rows[0]);
  const {comp_code, ...invoice} = invoiceResults.rows[0];
  console.log("THIS IS THE COMP_CODE", comp_code);
  console.log("THIS IS THE INVOICE", invoice);

  if (!invoice) throw new NotFoundError();

  const companyResults = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code = $1`,
    [comp_code]
  );
  const company = companyResults.rows[0];

  invoice.company = company;

//   let invoiceJson = {
//     id: invoice.id,
//     amt: invoice.amt,
//     paid: invoice.paid,
//     add_date: invoice.add_date,
//     paid_date: invoice.paid_date,
//     company: {
//       code: company.code,
//       name: company.name,
//       description: company.descrpition,
//     },
//   };
  return res.json({ invoice });
});

/** POST /invoices => create a new invoice like:
 *  input: { comp_code, amt }
 *  output: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post("/", async function (req, res, next) {
  let { comp_code, amt } = req.body;

  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [comp_code, amt]
  );

  const invoice = results.rows[0];

  return res.status(201).json({ invoice });
});

/** PUT /invoices/:id => update an invoice.
 * input: {amt, paid}
 * output: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.put("/:id", async function (req, res, next) {
  let id = req.params.id;
  let { amt, paid } = req.body;

  const oldInvoiceResults = await db.query(
    `SELECT paid, paid_date
        FROM invoices
        WHERE id = $1`,
        [id]
  );
  
  const oldInvoice = oldInvoiceResults.rows[0]

  if (!oldInvoice) throw new NotFoundError(`Not a valid invoice id: ${id}`);

  let paidDate;

  if (oldInvoice.paid === false && paid === true) {
    paidDate = new Date();
  } else if (oldInvoice.paid === true && paid === false) {
    paidDate = null;
  } else {
    paidDate = oldInvoice.paid_date;
  }

  // if paid === true
    // set paid_date to today
  // else if paid was true, but now paid === false
    // set paid_date to null
  // else
    // keep current paid_date
  
  const results = await db.query(
    `UPDATE invoices 
      SET amt=$2,
          paid=$3,
          paid_date=$4
      WHERE id=$1
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [id, amt, paid, paidDate]
  );

  const invoice = results.rows[0];
  
  return res.json({invoice});
});

/** DELETE /:id => Delete an invoice by invoice id:
 *  output: {status: "deleted"}
 */
 router.delete("/:id", async function (req, res, next) {
    const id = req.params.id;
  
    let results = await db.query(
      `DELETE FROM invoices 
          WHERE id = $1
          RETURNING id`,
      [id]
    );
  
    let invoice = results.rows[0];
    if (!invoice) throw new NotFoundError();
    res.json({ status: "deleted" });
  });

  module.exports = router;
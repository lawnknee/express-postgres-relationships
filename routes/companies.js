const express = require("express");
const router = new express.Router();
const db = require("../db");

router.get("/", async function (req, res, next) {
  
  debugger;
  const results = await db.query(
    `SELECT code, name, description
    FROM companies`);

  let companies = results.rows;
  // let companies = "aaaa";
  
  return res.json({ companies });
});

module.exports = router;
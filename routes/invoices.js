"use strict"

const express = require("express");
const router = new express.Router();
const db = require("../db");

const { NotFoundError } = require("../expressError");


module.exports = router;
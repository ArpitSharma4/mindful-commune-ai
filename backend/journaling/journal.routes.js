const express = require("express");
const router = express.Router();

// Import controller
const { getJournalEntries, createJournalPost } = require("./journal.controller");

// Define API endpoints
router.get("/", getJournalEntries);
router.post("/", createJournalPost);

module.exports = router;

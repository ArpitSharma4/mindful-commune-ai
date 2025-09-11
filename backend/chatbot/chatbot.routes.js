const express = require("express");
const router = express.Router();

// Import controller
const { getFeature1Data } = require("./chatbot.controller");

// Define API endpoints
router.get("/", getFeature1Data);

module.exports = router;

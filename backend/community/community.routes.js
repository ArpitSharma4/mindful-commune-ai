const express = require("express");
const router = express.Router();
const { createPost, getPosts } = require("./community.controller");

router.post("/", createPost); // Create post
router.get("/", getPosts);    // Fetch posts

module.exports = router;

const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { createPost } = require('./posts.controller');
const authMiddleware = require('../middleware/auth');

const router = Router();

// --- Multer Configuration ---
// This tells Multer where and how to save the files.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    // Create a unique filename to avoid overwriting files
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// --- Route Definition ---
// The URL is structured to show that we are creating a post "in" a specific community.
// POST /api/posts/in/:communityId
//
// The middleware chain runs in order:
// 1. authMiddleware: Checks for a valid JWT and attaches user info to req.user.
// 2. upload.single('media'): Handles a single file upload from a form field named 'media'.
//    If a file is uploaded, it attaches file info to req.file.
// 3. createPost: The main controller logic runs last.
router.post('/in/:communityId', authMiddleware, upload.single('media'), createPost);


module.exports = router;


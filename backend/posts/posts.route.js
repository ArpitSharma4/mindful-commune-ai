const { Router } = require('express');
const multer = require('multer');
const path = require('path');
// Import all three controller functions
const { createPost, getPostsByCommunity, voteOnPost } = require('./posts.controller');
const authMiddleware = require('../middleware/auth');

const router = Router();

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// --- Route Definitions ---

// Creates a new post in a specific community (Protected)
router.post('/in/:communityId', authMiddleware, upload.single('media'), createPost);

// Gets all posts for a specific community (Public)
router.get('/in/:communityId', getPostsByCommunity);

// Casts a vote on a specific post (Protected)
router.post('/:postId/vote', authMiddleware, voteOnPost);


module.exports = router;


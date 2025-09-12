const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { createPost, getPostsByCommunity, voteOnPost, getTrendingPosts, getRecentPosts } = require('./posts.controller');
const authMiddleware = require('../middleware/auth');
const commentRoutes = require('../comments/comments.route'); // <-- 1. Import the comment router

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


// --- Post-Specific Routes ---
// Creates a new post in a specific community (Protected)
router.post('/in/:communityId', authMiddleware, upload.single('media'), createPost);

// Gets all posts for a specific community (Public)
router.get('/in/:communityId', getPostsByCommunity);

// Gets trending posts across all communities (Public)
router.get('/trending', getTrendingPosts);

// Gets recent posts across all communities (Public)
router.get('/recent', getRecentPosts);

// Casts a vote on a specific post (Protected)
router.post('/:postId/vote', authMiddleware, voteOnPost);


// --- Nested Comment Routes ---
// 2. This line tells Express: "For any request that matches '/:postId/comments',
//    hand it over to the commentRoutes file to handle it from there."
router.use('/:postId/comments', commentRoutes);


module.exports = router;


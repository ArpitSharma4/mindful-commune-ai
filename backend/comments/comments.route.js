const { Router } = require('express');
// 1. Import all three controller functions
const { createComment, getCommentsByPost, voteOnComment } = require('./comments.controller');
const authMiddleware = require('../middleware/auth');

// This router is nested, so it can access parent route parameters (like :postId)
const router = Router({ mergeParams: true });

// --- Routes for the collection of comments under a post ---
// Full URL: POST /api/posts/:postId/comments (Create a comment)
router.post('/', authMiddleware, createComment);

// Full URL: GET /api/posts/:postId/comments (Get all comments for a post)
router.get('/', getCommentsByPost);


// --- Route for actions on a specific comment ---
// 2. This is the new route for voting.
// Full URL: POST /api/posts/:postId/comments/:commentId/vote
router.post('/:commentId/vote', authMiddleware, voteOnComment);


module.exports = router;


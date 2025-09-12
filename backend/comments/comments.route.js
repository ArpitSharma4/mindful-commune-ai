const { Router } = require('express');
const { createComment } = require('./comments.controller');
const authMiddleware = require('../middleware/auth');

// Using { mergeParams: true } is the key to nested routing.
// It allows this router to access URL parameters from its parent router
// (in this case, we can get :postId from the posts router).
const router = Router({ mergeParams: true });

// Defines the route for: POST /api/posts/:postId/comments
// The path here is just '/' because the '/:postId/comments' part is handled
// in the posts.route.js file where this router is used.
//
// This is a protected route, so only logged-in users can comment.
router.post('/', authMiddleware, createComment);

// We will add the route for GETTING comments here later.
// router.get('/', getCommentsByPost);

module.exports = router;


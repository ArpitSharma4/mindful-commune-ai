const { Router } = require('express');
const multer = require('multer');
const path = require('path');
// 1. Import the updated list of controller functions, including 'updatePost'
const { 
  createPost, 
  getPostsByCommunity, 
  voteOnPost, 
  updatePost, 
  getPostById

} = require('./posts.controller');
const authMiddleware = require('../middleware/auth');
const commentRoutes = require('../comments/comments.route');

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

// This will handle requests like GET /api/posts/some-post-uuid
router.get('/:postId', getPostById);

// Casts a vote on a specific post (Protected)
router.post('/:postId/vote', authMiddleware, voteOnPost);

// 2. Add the new route for updating a post (Protected & Authorized)
router.put('/:postId', authMiddleware, updatePost);

// --- Nested Comment Routes ---
// This tells Express to hand off requests for '/:postId/comments' to the comment router.
router.use('/:postId/comments', commentRoutes);


module.exports = router;


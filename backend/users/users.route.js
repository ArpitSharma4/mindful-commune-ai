const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { 
  createUser, 
  loginUser, 
  getCurrentUser, 
  deleteUser, 
  changePassword, 
  updateAvatar, 
  removeAvatar,
  getUserProfile 
} = require('./users.controller');
const authenticateToken = require('../middleware/auth');

const router = Router();

// Multer configuration for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
router.post('/signup', createUser);
router.post('/login', loginUser);
router.get('/profile/:username', getUserProfile); // Public profile endpoint

// Protected routes (require authentication)
router.get('/me', authenticateToken, getCurrentUser);
router.delete('/me', authenticateToken, deleteUser); // Delete account route
router.put('/change-password', authenticateToken, changePassword);
router.put('/avatar', authenticateToken, upload.single('avatar'), updateAvatar);
router.delete('/avatar', authenticateToken, removeAvatar);
module.exports = router;
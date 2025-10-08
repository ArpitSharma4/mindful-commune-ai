const { Router } = require('express');
const { createUser, loginUser, getCurrentUser, deleteUser } = require('./users.controller');
const authenticateToken = require('../middleware/auth');

const router = Router();

router.post('/signup', createUser);
router.post('/login', loginUser);
router.get('/me', authenticateToken, getCurrentUser);
router.delete('/me', authenticateToken, deleteUser); // Delete account route

module.exports = router;
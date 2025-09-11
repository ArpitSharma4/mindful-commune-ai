// backend/users/users.route.js

const { Router } = require('express');
const { createUser, loginUser } = require('./users.controller');

const router = Router();

// Define the route for creating a new user.
// When a POST request is made to '/api/users/', the createUser function will be called.
router.post('/signup', createUser);
router.post('/login', loginUser);
// We can add other routes here later, like:
// router.get('/:id', getUserById);
// router.put('/:id', updateUser);

module.exports = router;

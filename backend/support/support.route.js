const { Router } = require('express');
const { handleContactForm } = require('./support.controller');
const router = Router();

// --- ADD THIS NEW ROUTE ---
// POST /api/support/contact
router.post('/contact', handleContactForm);

module.exports = router;
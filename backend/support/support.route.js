const { Router } = require('express');
const { sendSupportMessage } = require('./support.controller');

const router = Router();

router.post('/contact', sendSupportMessage);

module.exports = router;



const express = require('express');
const router = express.Router();

const { register } = require('./auth.controller');
const { login } = require('./auth.controller');

router.post('/register', register);
router.post('/login', login);

module.exports = router;
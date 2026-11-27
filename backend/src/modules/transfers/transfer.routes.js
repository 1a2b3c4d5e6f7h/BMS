const express = require('express');
const router = express.Router();

const {
    createTransfer
} = require('./transfer.controller');

const {
    authenticateToken,
    authorizeRoles
} = require('../auth/auth.middleWare');

router.post(
    '/', 
      authenticateToken,
    authorizeRoles('CUSTOMER'),
    createTransfer
);

module.exports = router;
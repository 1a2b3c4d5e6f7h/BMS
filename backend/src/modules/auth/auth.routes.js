const express = require('express');
const router = express.Router();

const { register, login, logout} = require('./auth.controller');
const { authenticateToken } = require('./auth.middleware');



router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
});

module.exports = router;
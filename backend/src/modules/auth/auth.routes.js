const express = require('express');
const router = express.Router();

const { register, login} = require('./auth.controller');
const { authenticateToken } = require('./auth.middleware');



router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
});

module.exports = router;
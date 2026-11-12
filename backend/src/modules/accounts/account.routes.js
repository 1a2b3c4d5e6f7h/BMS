const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
    res.json({
        message: 'Accounts API is running.'
    });
});

module.exports = router;
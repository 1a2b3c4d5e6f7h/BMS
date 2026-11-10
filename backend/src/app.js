
const express = require('express');

const app = express();

// Middleware: allows Express to read JSON request bodies.
app.use(express.json());

// Initial test route.
app.get('/', (req, res) => {
    res.json({
        message: 'Bank Management System API is running.'
    });
});

module.exports = app;

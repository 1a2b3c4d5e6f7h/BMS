const express = require('express');
const router = express.Router();
const {
    getAllCustomers,
    getCustomerById,
    createCustomer
} = require('./customer.controller');


router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);

module.exports = router;
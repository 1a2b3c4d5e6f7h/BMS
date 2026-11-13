const express = require('express');
const router = express.Router();

//.....Import controller functions for customer operations........
const {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
} = require('./customer.controller');

//......Define routes for customer-related operations........
router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);
module.exports = router;
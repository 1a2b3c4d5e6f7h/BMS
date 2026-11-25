const express = require('express');
const router = express.Router();

//.....Import controller functions for customer operations........
const {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerAccounts
} = require('./customer.controller');
// Import authorization middleware
const {
    authenticateToken,
    authorizeRoles
} = require('../auth/auth.middleware');

// All customers: Only for employees and administrators
router.get(
    '/', authenticateToken, 
    authorizeRoles('ADMIN', 'EMPLOYEE'),
     getAllCustomers
    );

// Individual customer: temporarily restricted to employees/admins.
// We will add customer self-access in the next step.
router.get(
    '/:id',
    authenticateToken,
    authorizeRoles('EMPLOYEE', 'ADMIN'),
    getCustomerById
);

// Customer creation: employees and administrators
router.post(
    '/',
    authenticateToken,
    authorizeRoles('EMPLOYEE', 'ADMIN'),
    createCustomer
);
// Customer updates: employees and administrators
router.put(
    '/:id',
    authenticateToken,
    authorizeRoles('EMPLOYEE', 'ADMIN'),
    updateCustomer
);
router.delete(
    '/:id',
    authenticateToken,
    authorizeRoles('ADMIN'),
    deleteCustomer
);
// Customer account information: employees and administrators
router.get(
    '/:id/accounts',
    authenticateToken,
    authorizeRoles('EMPLOYEE', 'ADMIN'),
    getCustomerAccounts
);

module.exports = router;

const express = require('express');
const router = express.Router();

// Import account controllers
const {
    createAccount,
    getAllAccounts,
    getAccountById,
    updateAccountStatus,
    deposit,
    withdraw,
    checkBalance,
    getAccountTransactions,
    getAccountSummary,
    getAccountStatement
} = require('./account.controller');

// Import authentication and authorization middleware
const {
    authenticateToken,
    authorizeAccountOwner,
    authorizeRoles
} = require('../auth/auth.middleWare');

// Account creation and listing need separate role-based protection.
// Only administrators can create accounts
router.post(
    '/',
    authenticateToken,
    authorizeRoles('ADMIN'),
    createAccount
);
// Only employees and administrators can view all accounts
router.get(
    '/',
    authenticateToken,
    authorizeRoles('EMPLOYEE', 'ADMIN'),
    getAllAccounts
);

// Protected customer account routes
router.get(
    '/:id/summary',
    authenticateToken,
    authorizeAccountOwner,
    getAccountSummary
);

router.get(
    '/:id',
    authenticateToken,
    authorizeAccountOwner,
    getAccountById
);

router.get(
    '/:id/balance',
    authenticateToken,
    authorizeAccountOwner,
    checkBalance
);

router.get(
    '/:id/transactions',
    authenticateToken,
    authorizeAccountOwner,
    getAccountTransactions
);

router.get(
    '/:id/statement',
    authenticateToken,
    authorizeAccountOwner,
    getAccountStatement
);

// These operations also require ownership verification.
// Additional business rules remain in their controllers.
router.post(
    '/:id/deposit',
    authenticateToken,
    authorizeAccountOwner,
    deposit
);

router.post(
    '/:id/withdraw',
    authenticateToken,
    authorizeAccountOwner,
    withdraw
);

// Account status changes should eventually require an ADMIN role,
// not ordinary customer ownership.
router.patch(
    '/:id/status',
    authenticateToken,
    authorizeRoles('ADMIN'),
    updateAccountStatus
);

module.exports = router;

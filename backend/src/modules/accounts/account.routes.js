const express = require('express');
const router = express.Router();
//........Import the account controller........!!!!
 const  { 
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
const {
    authenticateToken,
    authorizeAccountOwner
} = require('../auth/auth.middleware');

router.post('/', createAccount);
router.get('/', getAllAccounts);
router.get('/:id/summary', getAccountSummary, authenticateToken, authorizeAccountOwner);
router.get('/:account_id', getAccountById, authenticateToken, authorizeAccountOwner);
router.patch('/:account_id/status', updateAccountStatus, authenticateToken, authorizeAccountOwner);
router.post('/:id/deposit', deposit, authenticateToken, authorizeAccountOwner);
router.post('/:id/withdraw', withdraw, authenticateToken, authorizeAccountOwner);
router.get('/:id/balance', checkBalance, authenticateToken, authorizeAccountOwner);
router.get('/:id/transactions', getAccountTransactions, authenticateToken, authorizeAccountOwner);
router.get('/:id/statement', getAccountStatement, authenticateToken, authorizeAccountOwner);
module.exports = router;
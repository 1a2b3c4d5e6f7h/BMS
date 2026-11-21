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

router.post('/', createAccount);
router.get('/', getAllAccounts);
router.get('/:id/summary', getAccountSummary);
router.get('/:account_id', getAccountById);
router.patch('/:account_id/status', updateAccountStatus);
router.post('/:id/deposit', deposit);
router.post('/:id/withdraw', withdraw);
router.get('/:id/balance', checkBalance);
router.get('/:id/transactions', getAccountTransactions);
router.get('/:id/statement', getAccountStatement);
module.exports = router;
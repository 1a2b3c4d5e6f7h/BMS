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
    checkBalance
} = require('./account.controller');

router.post('/', createAccount);
router.get('/', getAllAccounts);
router.get('/:account_id', getAccountById);
router.patch('/:account_id/status', updateAccountStatus);
router.post('/:id/deposit', deposit);
router.post('/:id/withdraw', withdraw);
router.get('/:id/balance', checkBalance);
module.exports = router;
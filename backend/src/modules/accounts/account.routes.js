const express = require('express');
const router = express.Router();
//........Import the account controller........!!!!
 const  { 
    createAccount,
    getAllAccounts,
    getAccountById,
    updateAccountStatus,
    deposit
} = require('./account.controller');

router.post('/', createAccount);
router.get('/', getAllAccounts);
router.get('/:account_id', getAccountById);
router.patch('/:account_id/status', updateAccountStatus);
router.post('/:id/deposit', deposit);

module.exports = router;
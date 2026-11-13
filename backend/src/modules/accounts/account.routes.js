const express = require('express');
const router = express.Router();
//........Import the account controller........!!!!
 const  { 
    createAccount,
    getAllAccounts,
    getAccountById,
    updateAccountStatus
} = require('./account.controller');

router.post('/', createAccount);
router.get('/', getAllAccounts);
router.get('/:account_id', getAccountById);
router.patch('/:account_id/status', updateAccountStatus);

module.exports = router;
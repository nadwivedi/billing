const express = require('express');
const router = express.Router();
const {
  createParty,
  getAllParties,
  getPartyById,
  updateParty,
  deleteParty,
  updateBalance
} = require('../controllers/partyController');
const auth = require('../middleware/auth');

// All party routes are protected
router.use(auth);

router.post('/', createParty);
router.get('/', getAllParties);
router.get('/:id', getPartyById);
router.put('/:id', updateParty);
router.delete('/:id', deleteParty);
router.patch('/:id/balance', updateBalance);

module.exports = router;

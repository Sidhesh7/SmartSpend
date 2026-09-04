const express = require('express');
const router = express.Router();
const graphController = require('../controllers/graphController');

router.get('/topology', graphController.getTopology);
router.get('/mule-rings', graphController.getMuleRings);
router.post('/freeze-ring', graphController.freezeRing);

module.exports = router;

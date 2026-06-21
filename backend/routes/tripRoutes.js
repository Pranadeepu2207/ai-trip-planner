const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const protect = require('../middleware/auth');

// All trip planning operations are protected by JWT authentication
router.use(protect);

router.post('/', tripController.generateNewTrip);
router.get('/', tripController.getUserTrips);
router.get('/:id', tripController.getTripById);
router.put('/:id', tripController.updateTrip);
router.post('/:id/days/:dayNumber/activities', tripController.addActivity);
router.delete('/:id/days/:dayNumber/activities/:activityId', tripController.removeActivity);
router.post('/:id/days/:dayNumber/regenerate', tripController.regenerateDay);

module.exports = router;

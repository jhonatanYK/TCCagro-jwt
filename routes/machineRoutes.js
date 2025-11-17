const express = require('express');
const router = express.Router();
const machineController = require('../controllers/machineController');

router.get('/new', machineController.renderNewForm);
router.post('/new', machineController.create);
router.get('/', machineController.list);
router.get('/edit/:id', machineController.renderEditForm);
router.post('/edit/:id', machineController.update);
router.post('/delete/:id', machineController.delete);

module.exports = router;

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

router.get('/', clientController.renderList);
router.get('/new', clientController.renderNew);
router.post('/new', clientController.createClient);
router.get('/edit/:id', clientController.renderEdit);
router.post('/edit/:id', clientController.updateClient);
router.post('/delete/:id', clientController.deleteClient);

module.exports = router;

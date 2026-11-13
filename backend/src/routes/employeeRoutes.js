
const express = require('express');
const router = express.Router();

const {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
} = require('../controllers/employeeController');

router.post('/', createEmployee);
router.get('/', getAllEmployees);
router.get('/:id', getEmployeeById);
router.patch('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;

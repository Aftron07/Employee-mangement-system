
const pool = require('../config/db');

const isPositiveInteger = value =>
    /^[1-9]\d*$/.test(String(value));

const isValidEmail = value =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const allowedFields = [
    'employee_code',
    'first_name',
    'last_name',
    'email',
    'designation',
    'department_id',
    'is_active'
];

const textLimits = {
    employee_code: 30,
    first_name: 100,
    last_name: 100,
    email: 150,
    designation: 100
};

const validateText = (field, value) =>
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= textLimits[field];

const handleEmployeeError = (res, error, operation) => {
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            message: 'Employee code or email already exists'
        });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(404).json({
            message: 'Department not found'
        });
    }

    console.error(`${operation} error:`, error.message);

    return res.status(500).json({
        message: 'Internal server error'
    });
};


// POST /api/v1/employees
const createEmployee = async (req, res) => {
    try {
        const {
            employee_code,
            first_name,
            last_name,
            email,
            designation,
            department_id,
            is_active = true
        } = req.body;

        if (
            !validateText('employee_code', employee_code) ||
            !validateText('first_name', first_name) ||
            !validateText('last_name', last_name) ||
            !validateText('email', email) ||
            !isValidEmail(email.trim()) ||
            !validateText('designation', designation) ||
            !isPositiveInteger(department_id) ||
            typeof is_active !== 'boolean'
        ) {
            return res.status(400).json({
                message: 'Provide valid employee_code, first_name, last_name, email, designation, department_id, and optional boolean is_active'
            });
        }

        const [departments] = await pool.execute(
            `SELECT id FROM departments
             WHERE id = ? AND deleted_at IS NULL AND is_active = TRUE`,
            [department_id]
        );

        if (departments.length === 0) {
            return res.status(404).json({
                message: 'Active department not found'
            });
        }

        const employee = {
            employee_code: employee_code.trim(),
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: email.trim(),
            designation: designation.trim(),
            department_id: Number(department_id),
            is_active
        };

        const [result] = await pool.execute(
            `INSERT INTO employees
             (employee_code, first_name, last_name, email,
              designation, department_id, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                employee.employee_code,
                employee.first_name,
                employee.last_name,
                employee.email,
                employee.designation,
                employee.department_id,
                employee.is_active
            ]
        );

        return res.status(201).json({
            message: 'Employee created successfully',
            employee: {
                id: result.insertId,
                ...employee
            }
        });
    } catch (error) {
        return handleEmployeeError(res, error, 'Create employee');
    }
};


// GET /api/v1/employees
const getAllEmployees = async (req, res) => {
    try {
        const {
            page = '1',
            limit = '10',
            search,
            department_id
        } = req.query;

        if (
            !/^[1-9]\d*$/.test(page) ||
            !/^[1-9]\d*$/.test(limit) ||
            Number(limit) > 100
        ) {
            return res.status(400).json({
                message: 'page must be positive and limit must be between 1 and 100'
            });
        }

        if (
            search !== undefined &&
            (typeof search !== 'string' || search.length > 100)
        ) {
            return res.status(400).json({
                message: 'search must be a string of at most 100 characters'
            });
        }

        if (
            department_id !== undefined &&
            !isPositiveInteger(department_id)
        ) {
            return res.status(400).json({
                message: 'Invalid department_id'
            });
        }

        const conditions = ['e.deleted_at IS NULL'];
        const params = [];

        if (search !== undefined && search.trim() !== '') {
            conditions.push(
                `(e.first_name LIKE ? OR e.last_name LIKE ?
                  OR e.employee_code LIKE ? OR e.email LIKE ?)`
            );

            const searchValue = `%${search.trim()}%`;
            params.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );
        }

        if (department_id !== undefined) {
            conditions.push('e.department_id = ?');
            params.push(Number(department_id));
        }

        const whereClause = conditions.join(' AND ');
        const pageNumber = Number(page);
        const pageSize = Number(limit);
        const offset = (pageNumber - 1) * pageSize;

        const [countRows] = await pool.execute(
            `SELECT COUNT(*) AS total
             FROM employees e
             WHERE ${whereClause}`,
            params
        );

        const [employees] = await pool.execute(
            `SELECT e.id, e.employee_code, e.first_name,
                    e.last_name, e.email, e.designation,
                    e.department_id, d.name AS department_name,
                    e.is_active, e.created_at
             FROM employees e
             JOIN departments d ON d.id = e.department_id
             WHERE ${whereClause}
             ORDER BY e.id DESC
             LIMIT ? OFFSET ?`,
            [...params, pageSize, offset]
        );

        const total = countRows[0].total;

        return res.status(200).json({
            page: pageNumber,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            employees
        });
    } catch (error) {
        return handleEmployeeError(res, error, 'Get employees');
    }
};


// GET /api/v1/employees/:id
const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isPositiveInteger(id)) {
            return res.status(400).json({
                message: 'Invalid employee ID'
            });
        }

        const [employees] = await pool.execute(
            `SELECT e.id, e.employee_code, e.first_name,
                    e.last_name, e.email, e.designation,
                    e.department_id, d.name AS department_name,
                    e.is_active, e.created_at, e.updated_at
             FROM employees e
             JOIN departments d ON d.id = e.department_id
             WHERE e.id = ? AND e.deleted_at IS NULL`,
            [id]
        );

        if (employees.length === 0) {
            return res.status(404).json({
                message: 'Employee not found'
            });
        }

        return res.status(200).json({
            employee: employees[0]
        });
    } catch (error) {
        return handleEmployeeError(res, error, 'Get employee');
    }
};


// PATCH /api/v1/employees/:id
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;

        if (!isPositiveInteger(id)) {
            return res.status(400).json({
                message: 'Invalid employee ID'
            });
        }

        if (
            !body ||
            typeof body !== 'object' ||
            Array.isArray(body)
        ) {
            return res.status(400).json({
                message: 'Request body must be a JSON object'
            });
        }

        const fields = Object.keys(body);

        if (
            fields.length === 0 ||
            fields.some(field => !allowedFields.includes(field))
        ) {
            return res.status(400).json({
                message: 'Provide valid employee fields to update'
            });
        }

        const updates = [];
        const values = [];

        for (const field of [
            'employee_code',
            'first_name',
            'last_name',
            'email',
            'designation'
        ]) {
            if (Object.hasOwn(body, field)) {
                if (!validateText(field, body[field])) {
                    return res.status(400).json({
                        message: `Invalid ${field}`
                    });
                }

                if (field === 'email' && !isValidEmail(body.email.trim())) {
                    return res.status(400).json({
                        message: 'Invalid email address'
                    });
                }

                updates.push(`${field} = ?`);
                values.push(body[field].trim());
            }
        }

        if (Object.hasOwn(body, 'department_id')) {
            if (!isPositiveInteger(body.department_id)) {
                return res.status(400).json({
                    message: 'Invalid department_id'
                });
            }

            const [departments] = await pool.execute(
                `SELECT id FROM departments
                 WHERE id = ? AND deleted_at IS NULL AND is_active = TRUE`,
                [body.department_id]
            );

            if (departments.length === 0) {
                return res.status(404).json({
                    message: 'Active department not found'
                });
            }

            updates.push('department_id = ?');
            values.push(Number(body.department_id));
        }

        if (Object.hasOwn(body, 'is_active')) {
            if (typeof body.is_active !== 'boolean') {
                return res.status(400).json({
                    message: 'is_active must be true or false'
                });
            }

            updates.push('is_active = ?');
            values.push(body.is_active);
        }

        values.push(id);

        const [result] = await pool.execute(
            `UPDATE employees
             SET ${updates.join(', ')}
             WHERE id = ? AND deleted_at IS NULL`,
            values
        );

        const [employees] = await pool.execute(
            `SELECT id, employee_code, first_name, last_name,
                    email, designation, department_id, is_active
             FROM employees
             WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );

        if (employees.length === 0) {
            return res.status(404).json({
                message: 'Employee not found'
            });
        }

        return res.status(200).json({
            message: result.affectedRows === 0
                ? 'No changes made'
                : 'Employee updated successfully',
            employee: employees[0]
        });
    } catch (error) {
        return handleEmployeeError(res, error, 'Update employee');
    }
};


// DELETE /api/v1/employees/:id
const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isPositiveInteger(id)) {
            return res.status(400).json({
                message: 'Invalid employee ID'
            });
        }

        const [result] = await pool.execute(
            `UPDATE employees
             SET is_active = FALSE, deleted_at = CURRENT_TIMESTAMP
             WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Employee not found'
            });
        }

        return res.status(200).json({
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        return handleEmployeeError(res, error, 'Delete employee');
    }
};


module.exports = {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
};


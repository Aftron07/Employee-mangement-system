
const pool = require('../config/db');

// Create a department
const createDepartment = async (req, res) => {
    try {
        const { name, code } = req.body;

        if (
            typeof name !== 'string' ||
            typeof code !== 'string' ||
            !name.trim() ||
            !code.trim()
        ) {
            return res.status(400).json({
                message: 'Department name and code are required'
            });
        }

        const departmentName = name.trim();
        const departmentCode = code.trim();

        if (departmentName.length > 100 || departmentCode.length > 20) {
            return res.status(400).json({
                message: 'Name must be at most 100 characters and code at most 20'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO departments (name, code)
             VALUES (?, ?)`,
            [departmentName, departmentCode]
        );

        return res.status(201).json({
            message: 'Department created successfully',
            department: {
                id: result.insertId,
                name: departmentName,
                code: departmentCode,
                is_active: true
            }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Department name or code already exists'
            });
        }

        console.error('Create department error:', error.message);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};


// Retrieve all active, non-deleted departments
const getAllDepartments = async (req, res) => {
    try {
        const [departments] = await pool.execute(
            `SELECT id, name, code, is_active
             FROM departments
             WHERE deleted_at IS NULL
             ORDER BY id DESC`
        );

        return res.status(200).json({
            count: departments.length,
            departments
        });
    } catch (error) {
        console.error('Get departments error:', error.message);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};


// Retrieve one department by ID
const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                message: 'Invalid department ID'
            });
        }

        const [departments] = await pool.execute(
            `SELECT id, name, code, is_active
             FROM departments
             WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );

        if (departments.length === 0) {
            return res.status(404).json({
                message: 'Department not found'
            });
        }

        return res.status(200).json({
            department: departments[0]
        });
    } catch (error) {
        console.error('Get department error:', error.message);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};


// Update department fields
const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                message: 'Invalid department ID'
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

        const allowedFields = ['name', 'code', 'is_active'];
        const providedFields = Object.keys(body);

        if (
            providedFields.length === 0 ||
            providedFields.some(field => !allowedFields.includes(field))
        ) {
            return res.status(400).json({
                message: 'Provide name, code, or is_active to update'
            });
        }

        const updates = [];
        const values = [];

        if (Object.hasOwn(body, 'name')) {
            if (
                typeof body.name !== 'string' ||
                !body.name.trim() ||
                body.name.trim().length > 100
            ) {
                return res.status(400).json({
                    message: 'Name must be a non-empty string of at most 100 characters'
                });
            }

            updates.push('name = ?');
            values.push(body.name.trim());
        }

        if (Object.hasOwn(body, 'code')) {
            if (
                typeof body.code !== 'string' ||
                !body.code.trim() ||
                body.code.trim().length > 20
            ) {
                return res.status(400).json({
                    message: 'Code must be a non-empty string of at most 20 characters'
                });
            }

            updates.push('code = ?');
            values.push(body.code.trim());
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
            `UPDATE departments
             SET ${updates.join(', ')}
             WHERE id = ? AND deleted_at IS NULL`,
            values
        );

        if (result.affectedRows === 0) {
            const [existing] = await pool.execute(
                `SELECT id FROM departments
                 WHERE id = ? AND deleted_at IS NULL`,
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    message: 'Department not found'
                });
            }
        }

        const [departments] = await pool.execute(
            `SELECT id, name, code, is_active
             FROM departments
             WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );

        return res.status(200).json({
            message: 'Department updated successfully',
            department: departments[0]
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Department name or code already exists'
            });
        }

        console.error('Update department error:', error.message);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};


// Soft-delete a department
const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                message: 'Invalid department ID'
            });
        }

        const [departments] = await pool.execute(
            `SELECT id
             FROM departments
             WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );

        if (departments.length === 0) {
            return res.status(404).json({
                message: 'Department not found'
            });
        }

        const [employees] = await pool.execute(
            `SELECT id
             FROM employees
             WHERE department_id = ? AND deleted_at IS NULL
             LIMIT 1`,
            [id]
        );

        if (employees.length > 0) {
            return res.status(409).json({
                message: 'Cannot delete a department that has employees'
            });
        }

        await pool.execute(
            `UPDATE departments
             SET is_active = FALSE, deleted_at = CURRENT_TIMESTAMP
             WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );

        return res.status(200).json({
            message: 'Department deleted successfully'
        });
    } catch (error) {
        console.error('Delete department error:', error.message);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};


module.exports = {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment
};

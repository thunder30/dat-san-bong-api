const express = require('express')
const router = express.Router()
const slugify = require('slugify')
const Role = require('../models/Role')

/**
 * @POST /api/role
 * @description
 */
router.post('/', async (req, res) => {
    const { name } = req.body
    try {
        if (!name)
            return res.status(400).json({
                success: false,
                message: 'Name not found!',
            })

        const newRole = new Role({
            name,
            code: slugify(name.toUpperCase(), {
                replacement: '_',
            }),
        })
        const role = await newRole.save()
        res.status(200).json({
            success: true,
            message: 'Create successfully!',
            role,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})

/**
 * @GET /api/role
 * @description get all
 */
router.get('/', async (req, res) => {
    try {
        const roles = await Role.find({})

        if (roles.length === 0)
            return res.status(200).json({
                success: false,
                message: 'Roles empty!',
            })
        res.status(200).json({
            success: true,
            message: 'Get all roles',
            roles,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})

/**
 * @GET /api/role/:id
 * @description get detail
 */
router.get('/:id', async (req, res) => {
    try {
        const role = await Role.findById(req.params.id)
        if (!role)
            return res.status(400).json({
                success: false,
                message: 'Role not found.',
            })
        res.status(200).json({
            success: true,
            message: 'Get role by Id',
            role,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})

/**
 * @PUT /api/role/:id
 * @description update role
 */
router.put('/:id', async (req, res) => {
    const { name } = req.body
    try {
        const newRole = await Role.findOneAndUpdate(
            { _id: req.params.id },
            {
                name,
                code: slugify(name.toUpperCase(), {
                    replacement: '_',
                }),
            },
            { new: true }
        )
        if (!newRole)
            return res.status(400).json({
                success: false,
                message: 'Role not found.',
            })
        res.status(200).json({
            success: true,
            message: 'Update successfully!',
            newRole,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})

/**
 * @DELETE /api/role/:id
 * @description delete role
 */
router.delete('/:id', async (req, res) => {
    try {
        const role = await Role.findOneAndDelete({ _id: req.params.id })
        if (!role)
            return res.status(400).json({
                success: false,
                message: 'Role not found.',
            })
        res.status(200).json({
            success: true,
            message: 'Delete successfully!',
            role,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error,
        })
    }
})

module.exports = router

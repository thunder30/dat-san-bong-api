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
                message: 'Not found field!',
            })

        const newRole = new Role({
            name,
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
        res.status(200).json({
            success: true,
            message: 'Get role',
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
    try {
        const newRole = await Role.findByIdAndUpdate(req.params.id, {
            name: req.body.name,
            slug: slugify(req.body.name, {
                lower: true,
            }),
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
        await Role.findByIdAndDelete(req.params.id)
        res.status(200).json({
            success: true,
            message: 'Delete successfully!',
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

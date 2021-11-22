const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')

const Status = require('../models/Status') 

// /**
//  * @POST /api/status
//  * @desc Create a new status
//  */
// router.post('/', async (req, res) => {
//     try {
//         const status = new Status({
//             ...req.body
//         })
//         const _status = await status.save()
//         res.status(201).json({
//             message: 'Status created successfully',
//             _status
//         })
//     } catch (error) {
//         res.status(500).json({
//             message: 'Creating status failed',
//             error
//         })
//     }
// })

/**
 * @GET /api/status
 * @desc Get all status
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const status = await Status.find()
        res.status(200).json({
            success: true,
            message: 'Get Status successfully',
            status
        })
    } catch (error) {
        res.status(500).json({
            message: 'Fetching status failed',
            error
        })
    }
})

module.exports = router
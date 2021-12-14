const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')
const {
    validatePost,
    validateGetById,
    validatePut,
    validateDelete,
    validateGetByPitchType,
    validateResult
} = require('../middlewares/pitch')
const Pitch = require('../models/Pitch')
const PitchType = require('../models/PitchType')
const BookingDetail = require('../models/BookingDetail')
const Status = require('../models/Status')
const booking = require('../middlewares/booking')

/**
 * @POST /api/pitch
 * @desc Create a new pitch
 */
router.post('/', verifyToken, validatePost(), validateResult, async (req, res) => {
    try{
        const { isAdmin, userId } = req.payload

        //Check if user valid
        const pit = await PitchType.find({})
        .where('_id').equals(req.body.pitchType)
        .populate({
            path: 'pitchBranch',
            match: {owner : userId}
        })
        let valTrueUser = pit.some(function (value, index) {
        return value.pitchBranch !== null;
        });
        console.log(pit)
        console.log(valTrueUser)
        if(!valTrueUser && !isAdmin){
        {
            return res.status(400).json({
                success: false,
                messageEn: 'You dont have permission to create this pitch',
                message: 'Bạn không có quyền tạo sân này'
            })
        }
        }

        const pitch = new Pitch({
            ...req.body,
        })
        let _pitch = await pitch.save()
        res.status(201).json({
            success: true,
            messageEn: 'Create successfully!',
            message: 'Tạo sân thành công!',
            pitch: _pitch,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình tạo sân!',
            error: error.message
        })
    }
})

/**
 * @PUT /api/pitch/:id
 * @desc Update a pitch by id
 */
router.put('/:id', verifyToken, validatePut(), validateResult, async (req, res) => {
    try{
        const { isAdmin, userId } = req.payload
        const id = req.params.id
        const _pitch = await Pitch.findById(id)
        .populate({
            path: 'pitchType',
            populate: {
                path: 'pitchBranch',
                match: {owner : userId}
            }
        })
   
        if(!_pitch.pitchType.pitchBranch && !isAdmin){
            return res.status(403).json({
                success: false,
                messageEn: 'You don\'t have permission!',
                message: 'Bạn không có quyền sửa sân này!'
            })
        }

        delete req.body.pitchType
        let pitch = await Pitch.findByIdAndUpdate(req.params.id, req.body, { new: true })
        res.status(200).json({
            success: true,
            messageEn: 'Update successfully!',
            message: 'Cập nhật thành công!',
            pitch,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình cập nhật sân!',
            error: error.message
        })
    }
})

/**
 * @DELETE /api/pitch/:id
 * @desc Delete a pitch by id
 */
router.delete('/:id', verifyToken, validateDelete, async (req, res) => {
    try{

        const { isAdmin, userId } = req.payload
        const id = req.params.id
        const _pitch = await Pitch.findById(id)
        .populate({
            path: 'pitchType',
            populate: {
                path: 'pitchBranch',
                match: {owner : userId}
            }
        })
   
        if(!_pitch.pitchType.pitchBranch && !isAdmin){
            return res.status(403).json({
                success: false,
                messageEn: 'You don\'t have permission!',
                message: 'Bạn không có quyền xóa sân này!'
            })
        }
        
        const statusCanceled = await Status.findOne({}).where('status').equals('ST3')
        const statusCanceled2 = await Status.findOne({}).where('status').equals('ST4')

        const _bookingDetail = await BookingDetail.find({pitch: _pitch._id})
        for(let i = 0; i < _bookingDetail.length; i++){
            const endtime = convertStringToDate(_bookingDetail[i].endTime)
            if(_bookingDetail[i].status == statusCanceled || _bookingDetail[i].status == statusCanceled2)
                continue
            if(endtime > Date.now()){
                return res.status(400).json({
                    success: false,
                    messageEn: 'You can not delete this pitch!',
                    message: 'Bạn không thể xóa sân này!'
                })
            }
        }

        let pitch = await Pitch.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })

        if(!pitch){
            return res.status(404).json({
                success: false,
                messageEn: 'Pitch not found!',
                message: 'Không tìm thấy sân!'
            })
        }

        res.status(200).json({
            success: true,
            messageEn: 'Delete successfully!',
            message: 'Xóa thành công!',
            pitch,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình xóa sân!',
            error: error.message
        })
    }
})

/**
 * @GET /api/pitch/:id
 * @desc Get a pitch by id
 */
router.get('/:id', verifyToken, validateGetById(), validateResult, async (req, res) => {
    try{
        let pitch = await Pitch.findById(req.params.id).populate(path = 'pitchType', select = '-pitchBranch')
        res.status(200).json({
            success: true,
            messageEn: 'Get successfully!',
            message: 'Lấy thành công!',
            pitch,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình lấy sân!',
            error: error.message
        })
    }
})

/**
 * @GET /api/pitch?pitchType=:pitchType
 * @desc Get all pitches by pitchType
 */
router.get('/', verifyToken, validateGetByPitchType, async (req, res) => {
    try{
        const isAdmin = req.payload.isAdmin
        if (Object.keys(req.query).length === 0){
        
            let pitches = await Pitch.find()
            return res.status(200).json({
                success: true,
                messageEn: 'Get successfully!',
                message: 'Lấy thành công!',
                pitches,
            })
        }

        const pitchTypeId = req.query.pitchType
        let pitches = await Pitch.find({ pitchType: pitchTypeId })
        res.status(200).json({
            success: true,
            messageEn: 'Get successfully!',
            message: 'Lấy thành công!',
            pitches,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình lấy sân!',
            error: error.message
        })
    }
})

function convertStringToDate(s) {
    const splDayTime = s.split(' ')
    const splDay = splDayTime[0].split('/')
    const dateTime = new Date(splDay[2], splDay[1] - 1, splDay[0])
    return dateTime
}


module.exports = router
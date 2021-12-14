const express = require('express')
const router = express.Router()
const PitchType = require('../models/PitchType')
const { verifyToken } = require('../middlewares/auth')
const {
    validatePost,
    validatePut,
    validateDelete,
    validateGetById,
    validateGetByBranch
} = require('../middlewares/pitchType')
const PitchBranch = require('../models/PitchBranch')
const Pitch = require('../models/Pitch')
const BookingDetail = require('../models/BookingDetail')
const Status = require('../models/Status')


/**
 * @POST /api/pitchType
 * @description Create a new pitchType
 */
router.post('/', verifyToken, validatePost, async (req, res) => {
   try{
      
        const { isAdmin, userId } = req.payload
        
        //check if branch of user is owner
        const _pitchBranch = await PitchBranch.find({})
        .where('owner').equals(userId)
        .select('_id')
        .populate(
            {
                path: 'owner',
                select: 'id',
                match: {owner: userId}
            }
        )

        const isOwner = _pitchBranch.some((value,index) => {
            return value._id.toString() === req.body.pitchBranch
        })

        if(!isOwner && !isAdmin){
            return res.status(403).json({
                success: false,
                messageEn: 'You are not owner of this branch!',
                message: 'Bạn không phải là chủ của sân này'
            })
        }

        const pitchType = new PitchType({
            ...req.body
        })

        // save to database
        let _pitchType = await pitchType.save()
        res.status(201).json({
            success: true,
            message: 'Create successfully!',
            pitchType: _pitchType,
        })

   }
    catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình xử lý!',
            error,
        })
    }
})

/**
 * @PUT /api/pitchType/:id
 * @description Update a pitchType
 */
router.put('/:id', verifyToken, validatePut, async (req, res) => {
    try{
        const { id } = req.params.id
        const { isAdmin, userId } = req.payload
        
        //check if branch of user is owner
        const _pitchBranch = await PitchBranch.find({})
        .where('owner').equals(userId)
        .select('_id')
        .populate(
            {
                path: 'owner',
                select: 'id',
                match: {owner: userId}
            }
        )

        let isOwner
        isOwner = _pitchBranch.some((value,index) => {
            return value._id.toString() === req.body.pitchBranch
        })

        if(!isOwner && !isAdmin){
            return res.status(403).json({
                success: false,
                messageEn: 'You are not owner of this branch!',
                message: 'Bạn không phải là chủ của sân này'
            })
        }
    
        delete req.body.pitchBranch

        const _pitchType = await PitchType.findOneAndUpdate(id, req.body, { new: true })
        res.status(200).json({
            success: true,
            messageEn: 'Update successfully!',
            message: 'Cập nhật thành công!',
            _pitchType,
        })
        
    }
    catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình xử lý!',
            error,
        })
    }
})

/**
 * @DELETE /api/pitchType/:id
 * @description Delete a pitchType
 */
router.delete('/:id', verifyToken, validateDelete, async (req, res) => {
    try{
        // //check if branch of user
        const id = req.params.id
        const { isAdmin, userId } = req.payload
        const _pitchType = await PitchType.findById(id)
        .where('owner').equals(userId)
        .populate(
                path = 'pitchBranch',
                select = 'owner',
                match = {owner: userId}
        )
        if(!_pitchType.pitchBranch){
            return res.status(403).json({
                success: false,
                messageEn: 'You are not owner of this branch!',
                message: 'Bạn không phải là chủ của sân này'
            })
        }

        const statusCanceled = await Status.findOne({}).where('status').equals('ST3')
        const statusCanceled2 = await Status.findOne({}).where('status').equals('ST4')

        const pitch = await Pitch.find({}).where('pitchType').equals(id)
        for(let i = 0; i < pitch.length; i++){
            const _bookingDetail = await BookingDetail.find({}).where('pitch').equals(pitch[i]._id)
            for(let j = 0; j < _bookingDetail.length; j++){
                const endtime = convertStringToDate(_bookingDetail[j].endTime)
                if(_bookingDetail[j].status == statusCanceled || _bookingDetail[i].status == statusCanceled2)
                    continue
                if(endtime > Date.now()){
                    return res.status(400).json({
                        success: false,
                        messageEn: 'You can not delete this pitchtype!',
                        message: 'Bạn không thể xóa loại sân này!'
                    })
                }
            }
        }

        // delete from database _pitchType
        const pitchTypeDel = await PitchType.findByIdAndUpdate(id, { isActive: false }, { new: true })

        // const _pitchType = await PitchType.findOneAndDelete({ _id: req.params.id })
        if(!pitchTypeDel){
            return res.status(404).json({
                success: false,
                messageEn: 'PitchType not found!',
                message: 'Không tìm thấy sân này!',
            })
        }
        res.status(200).json({
            success: true,
            messageEn: 'Delete successfully!',
            message: 'Xóa thành công!',
            pitchTypeDel,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình xử lý!',
            error: error.message,
        })
    }
})


/**
 * @GET /api/pitchType?branchId=id
 * @description Get all pitchType of branch
 */
 router.get('/', verifyToken, validateGetByBranch, async (req, res) => {
    try{

        console.log(req.query)
        //if req.query isEmpyuy
        if(Object.keys(req.query).length === 0){
            //get all pitchType
            let _pitchType = await PitchType.find({})
            //return nos veef
            return res.status(200).json({
                success: true,
                messageEn: 'Get all pitchType successfully!',
                message: 'Lấy tất cả loại sân thành công!',
                _pitchType,
            })
        }

        if(!req.query.branchId){
            return res.status(400).json({
                success: false,
                messageEn: 'Bad request!',
                message: 'Yêu cầu không hợp lệ!',
            })
        }

        const pitchType = await PitchType.find({})
        .where('pitchBranch').equals(id)
        .populate
        ({
            path: 'pitchBranch',
        })
        res.status(200).json({
            success: true,
            messageEn: 'Get successfully!',
            message: 'Lấy thành công!',
            pitchType,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình xử lý!',
            error,
        })
    }
})

/**
 * @GET /api/pitchType/:id
 * @description Get a pitchType by id
 */
router.get('/:id', verifyToken, validateGetById, async (req, res) => {
    try{

        let _pitchType = await PitchType.findById(req.params.id).populate('pitchBranch')
        res.status(200).json({
            success: true,
            messageEn: 'Get successfully!',
            message: 'Lấy thành công!',
            _pitchType,
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Có lỗi xảy ra trong quá trình xử lý!',
            error,
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

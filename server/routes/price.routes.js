const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')
const {
    validateDelete,
    validatePost,
    validatePut,
    validateGetByid,
    validatePostArrTime
} = require('../middlewares/price')
const Price = require('../models/Price')
const PitchType = require('../models/PitchType')
const Time = require('../models/Time')

/**
 * @POST /api/price
 * @desc Add new price
 */
router.post('/', verifyToken, validatePost, async (req, res) => {
    try{
        const { pitchType, time, price} = req.body
        const { isAdmin, userId } = req.payload

        // Check if user is admin
        const valPriceOwner = await PitchType.find({})
        .where('_id').equals(pitchType)
        .populate(
            {
                path: 'pitchBranch',
                match: { owner: userId },
            }
        )
        console.log(valPriceOwner)
        
        let isOwner
        isOwner = valPriceOwner.some((value) => {
            return value.pitchBranch !== null
        })

        //check valid user 
        if(!isOwner && !isAdmin){
            return res.status(400).json({
                success: false,
                messageEn: 'You are not owner of this PitchType!',
                message: 'Bạn không phải chủ sân này!'
            })
        }
            
        // Check if price already exist
        const valprice = await Price.findOne({ pitchType, time })
        if(valprice) {
            return res.status(400).json({
                success: false,
                messageEn: 'Price already exists',
                message: 'Giá đã tồn tại'
            })
        }

        const newPrice = await Price.create({
            pitchType,
            time,
            price
        })

        return res.status(201).json(
            {
                success: true,
                message: 'Add new price success',
                newPrice
            }
        ) 
    }catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Lỗi server!',
            error: error.message
        })
    }
})

/**
 * @POST /api/price/ArrTime
 * @desc Add new price by array time
 */
router.post('/arrtime', verifyToken, validatePostArrTime, async (req, res) => {
    try{
        const {pitchType, prices} = req.body
        
        //check time in pitchBranch
        const pitchBranch = await PitchType.findOne({_id: pitchType})
        .populate('pitchBranch').select('startTime endTime')
        if(!pitchBranch){
            return res.status(400).json({
                success: false,
                messageEn: 'PitchType not found!',
                message: 'Không tìm thấy sân!'
            })
        }
        let pbStartTime = pitchBranch.pitchBranch.startTime.split(':')
        let pbEndTime = pitchBranch.pitchBranch.endTime.split(':')
        let _pbStartTime = new Date(2020, 0, 1, pbStartTime[0], pbStartTime[1])
        let _pbEndTime = new Date(2020, 0, 1, pbEndTime[0], pbEndTime[1])
        pitchBranch.startTime = new Date(pitchBranch.startTime)
        // set arrTimes as starTime, endTime in array time of every prices [ [ '01:30', '02:00', '02:30' ], [ '05:30', '06:00' ] ]
        let arrTimes = []
        for(let i = 0; i < prices.length; i++){
            let { startTime, endTime } = prices[i]
            // startTime and endTime to Dateformat
            startTime = startTime.split(':')
            let _startTime = new Date(2020, 0, 1, startTime[0], startTime[1])
            endTime = endTime.split(':')
            let _endTime = new Date(2020, 0, 1, endTime[0], endTime[1])

            if(_startTime < _pbStartTime || _endTime > _pbEndTime){
                return res.status(400).json({
                    success: false,
                    messageEn: 'Time not in pitchBranch!',
                    message: 'Thời gian không trong vòng thời gian của chi nhánh!',
                })
            }

            let arrTime = []
            while ( _startTime <= _endTime ){
                times = _startTime.getHours() + ':' + _startTime.getMinutes()
                if(_startTime.getHours() < 10){
                    times = '0' + times
                    // console.log(times)
                }
                if(_startTime.getMinutes() < 10){
                    times = times + '0'
                    // console.log(times)
                }
                arrTime.push(times)
                _startTime.setMinutes(_startTime.getMinutes() + 30)
            }
            arrTimes.push(arrTime)
            // console.log(arrTimes)
        }
        // console.log(arrTimes)
        // save if price not exist 
        let arrResult = []
        for (let i = 0; i < arrTimes.length; i++){
            for ( let j = 0; j < arrTimes[i].length ; j++ ){

                const time = await Time.findOne({ startTime: arrTimes[i][j] })
                const _price = await Price.find({pitchType, time : time._id}) 

                // console.log(_price)
                if(_price.length !== 0)
                {
                    //update price
                    let upPrice = await Price.findOneAndUpdate({pitchType, time : time._id}, {price : prices[i].price})
                    arrResult.push(upPrice)
                }else{
                     //save price
                    let newPrice = await Price.create({
                        pitchType,
                        time: time._id,
                        price: prices[i].price
                    })
                    arrResult.push(newPrice)
                }
            }
        }

        if(arrResult.length === 0){
            return res.status(500).json({
                success: false,
                messageEn: 'Something went wrong',
                message: 'Có lỗi xảy ra'
            })
        }

        res.status(200).json(
            {
                success: true,
                messageEn: 'Config price success',
                message: 'Cấu hình giá thành công',
                // arrResult
            }
        )

    }catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Lỗi server!',
            error: error.message
        })
    }
})

/**
 * @PUT /api/price/:id
 * @desc Update price by id
 */
router.put('/:id', verifyToken, validatePut, async (req, res) => {
    try{
        const {id} = req.params
        const { isAdmin, userId } = req.payload

        const _price = await Price.findById(id)
        .populate({
            path: 'pitchType',
            populate: {
                path: 'pitchBranch',
                match: { owner: userId },
            }
        })

        if(_price.pitchType.pitchBranch === null && !isAdmin){
            return res.status(400).json({
                success: false,
                messageEn: 'You are not owner of this PitchType!',
                message: 'Bạn không phải chủ của sân này!'
            })
        }


        const price = await Price.findByIdAndUpdate(id, req.body.price, {new: true})
        if(!price){
            return res.status(404).json({
                success: false,
                messageEn: 'Price not found',
                message: 'Không tìm thấy giá'
            })
        }
        return res.status(200).json(
            {
                success: true,
                messageEn: 'Update price success',
                message: 'Cập nhật giá thành công',
                price
            }
        )

    }catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Lỗi server!',
            error: error.message
        })
    }
})

/**
 * @DELETE /api/price/:id
 * @desc Delete price by id
 */
router.delete('/:id', verifyToken, validateDelete, async (req, res) => {
    try{
        const {id} = req.params
        const { isAdmin, userId } = req.payload

        const _price = await Price.findById(id)
        .populate({
            path: 'pitchType',
            populate: {
                path: 'pitchBranch',
                match: { owner: userId },
            }
        })

        if(!_price.pitchType.pitchBranch && !isAdmin){
            return res.status(400).json({
                success: false,
                messageEn: 'You are not owner of this PitchType!',
                message: 'Bạn không phải chủ của sân này!'
            })
        }

        await Price.findByIdAndDelete(id)
        return res.status(200).json(
            {
                success: true,
                messageEn: 'Delete price success',
                message: 'Xóa giá thành công'
            }
        )
    }
    catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Lỗi server!',
            error: error.message
        })
    }
})


/**
 * @GET /api/price/:id
 * @desc Get price by id
 */
 router.get('/:id', verifyToken, validateGetByid, async (req, res) => {
    try{
        const {id} = req.params
        const price = await Price.findById(id).populate(
            path = 'pitchType time',
            )
        return res.status(200).json(
            {
                success: true,
                messageEn: 'Get price success',
                message: 'Lấy giá thành công',
                price
            }
        )
    }
    catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Lỗi server!',
            error: error.message
        })
    }
})


/**
 * @GET /api/price?pitchType=123
 * @desc Get price by pitchType
 */
router.get('/', verifyToken, async (req, res) => {
    try{
        const isAdmin = req.payload.isAdmin
        console.log(isAdmin)
        //if req.query isEmpty
        if(Object.keys(req.query).length === 0){
            //get all pitchType
            let _price = await Price.find({})
            //return 
            return res.status(200).json({
                success: true,
                messageEn: 'Get all price successfully!',
                message: 'Lấy tất cả giá thành công',
                _price,
            })
        }

        const pitchTypeId = req.query.pitchType

        if(!pitchTypeId){
            return res.status(400).json({
                success: false,
                messageEn: 'Bad request!',
                message: 'Yêu cầu không hợp lệ!'
            })
        }

        const prices = await Price.find({})
        .where('pitchType').equals(pitchTypeId)
        .populate({
            path: 'pitchType time',
            select: '-pitchBranch',
        })
        return res.status(200).json(
            {
                success: true,
                messageEn: 'Get prices success',
                message: 'Lấy giá thành công',
                prices
            }
        )

    }catch(error){
        res.status(500).json({
            success: false,
            messageEn: 'Internal server error!',
            message: 'Lỗi server!',
            error: error.message
        })
    }
})

module.exports = router
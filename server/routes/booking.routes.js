const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/auth')
const {
    validatePost,
    validateGetByID,
    validatePut,
    validateDelete,
    validateResult,
    validatePostFunction,
    validateCheckout,
    validateCheckoutFunction,
    validatePostConfirmFunction,
    validatePostConfirm,
    validatePutCheckinFunction,
    validatePutCancelFunction,
    validatePutRefreshFunction,
    validatePostStaticFunction
} = require('../middlewares/booking')
const sendmail = require('../helpers/mailerBooked')
const Booking = require('../models/Booking')
const BookingDetail = require('../models/BookingDetail')
const User = require('../models/User')
const Pitch = require('../models/Pitch')
const Status = require('../models/Status')
const PitchBranch = require('../models/PitchBranch')

/**
 * @POST /api/booking/checkout
 * @desc check booking
 */
router.post('/checkout', verifyToken, validateCheckout(), validateResult, validateCheckoutFunction, async (req, res) => {
    try {
        const { startTime, endTime, customer, pitch } = req.body

        res.status(200).json({
            success: true,
            message: 'success',
            price: req.body.price,
        })

    }catch(err){
        res.status(400).json({
            success: false,
            message: err.message
        })
    }
})

/**
 * @POST /api/booking/confirm
 * @desc confirm booking
 */
router.post('/confirm', verifyToken, validatePostConfirm(), validateResult, validatePostConfirmFunction, async (req, res) => {
    try {
        //create new booking
        const { startDate, endDate, price, customer, pitch, startTime, endTime, status, address, pitchName, receiver } = req.body

        const booking = new Booking({
            startDate,
            endDate,
            total: price,
            isPaid: true,
            customer,
        })

        const newBooking = await booking.save()

        //create new bookingDetail
        const bookingDetail = new BookingDetail({
            booking: newBooking._id,
            pitch,
            startTime,
            endTime,
            status,
            price,
        })
        const newBookingDetail = await bookingDetail.save()

        const code = newBookingDetail._id.toString().substring(newBookingDetail._id.toString().length - 6)
        
        //update user
        const user = await Pitch.findOne({ _id: pitch })
        .populate({
            path: 'pitchType',
            select : 'pitchBranch',
            populate: {
                path: 'pitchBranch',
                select: 'owner',
                populate: {
                    path: 'owner',
                    // select: '_id name email phone users'
                }
            }
        })
        let checkRepeatUser = false
        for(let i = 0; i < user.pitchType.pitchBranch.owner.users.length; i++){
            if(user.pitchType.pitchBranch.owner.users[i]._id.toString() === customer.toString()){
                check = true
                break
            }
        }

        if(!checkRepeatUser){
            const userUpdate = await User.findOneAndUpdate({ _id: user.pitchType.pitchBranch.owner._id.toString() }, { $push: { users: customer } }, { new: true })
        }

        res.status(200).json({
            success: true,
            message: 'success',
            Booking: newBooking,
            BookingDetail: newBookingDetail,
            code,
        })

        sendmail(receiver,code,startTime,endTime,address,pitchName,price)

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
})

/**
 * @POST /api/booking/static
 * @desc get sum countBookings, Price as time, pitchBranchId
 */
 router.post('/static', verifyToken, validatePostStaticFunction, async (req, res) => {
    try {
        
        const { startDate, endDate, pitchBranchId } = req.body
        const isAdmin = req.payload.isAdmin
        const _startDate = convertStringToDate(startDate)
        const _endDate = convertStringToDate(endDate)

        const booking = await Booking.find({})
        // console.log(booking)
        const bk = []

        let count = 0
        let price = 0

        if(isAdmin){
            for(let i = 0; i < booking.length; i++){
                if(convertStringToDate(booking[i].startDate).getTime() >= _startDate.getTime() && convertStringToDate(booking[i].endDate).getTime() <= _endDate.getTime()){
                    const bd = await BookingDetail.findOne({ booking: booking[i]._id })
                    let stt = await Status.findOne({ _id: bd.status })
                    if(bd !== null && (stt.status !== 'ST3' || stt.status !== 'ST4')){
                        // bk.push(bd)
                        count++
                        price += booking[i].total
                    }
                }
            }
        }else
        for(let i = 0; i < booking.length; i++){
            if(convertStringToDate(booking[i].startDate).getTime() >= _startDate.getTime() && convertStringToDate(booking[i].endDate).getTime() <= _endDate.getTime()){
                const bd = await BookingDetail.findOne({ booking: booking[i]._id })
                .populate({
                    path: 'pitch',
                    populate: {
                        path: 'pitchType',
                        match: { pitchBranch: pitchBranchId },
                    }
                })
                if(bd === null)
                    continue
                let stt = await Status.findOne({ _id: bd.status })
                if(bd.pitch.pitchType !== null && (stt.status !== 'ST3' || stt.status !== 'ST4')){
                {
                    // bk.push(bd)
                    count++
                    price += booking[i].total
                }
                
            }
        }
        }

        return res.status(200).json({
            success: true,
            message: 'Get successfully!',
            count,
            price,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @POST /api/booking
 * @desc Create a new booking
 */
router.post('/', verifyToken, validatePost(), validateResult, validatePostFunction, async (req, res) => {
    try {
        const { isAdmin, userId } = req.payload

        const booking = new Booking({
            ...req.body,
        })
        const _booking = await booking.save()
        res.status(201).json({
            success: true,
            message: 'Create successfully!',
            _booking
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @PUT /api/booking/checkin/:id
 * @desc update status by a bookingDetail code
 */
 router.put('/checkin/:id', verifyToken, validatePutCheckinFunction, async (req, res) => {
    try {

        const status = req.body.status
        const statusId = await Status.findOne({ status: status })
        if(!req.body.bookingDetailId){
            return res.status(404).json({
                success: false,
                message: 'Not found',
            })
        }
        let bookingDetailUpdate = await BookingDetail.findOneAndUpdate(
            { 
                _id: req.body.bookingDetailId
            }, 
            { status: statusId._id }, 
            { new: true })
            .select('status startTime endTime price booking pitch')
            // console.log(bookingDetail[i]._id)
        
        res.status(200).json({
            success: true,
            message: 'Update successfully!',
            bookingDetailUpdate
        })


    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @PUT /api/booking/cancel/:id
 * @desc update status by a bookingDetail code
 */
router.put('/cancel/:id', verifyToken, validatePutCancelFunction, async (req, res) => {
    try {
        
        const status = req.body.status
        const bookingDetailId = req.params.id
        const statusId = await Status.findOne({ status: status })

        let bookingDetailUpdate = await BookingDetail.findOneAndUpdate(
            { 
                _id: bookingDetailId
            }, 
            { status: statusId._id }, 
            { new: true })
        
        res.status(200).json({
            success: true,
            message: 'Update successfully!',
            bookingDetailUpdate
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @PUT /api/booking/:id
 * @desc Update a booking by id
 */
router.put('/:id', verifyToken, validatePut, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        })
        return res.status(200).json({
            success: true,
            message: 'Update successfully!',
            booking
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @PUT /api/booking/refresh/:id
 * @desc Update a booking by branch id
 */
router.put('/refresh/:id', validatePutRefreshFunction, async (req, res) => {
    try {
        // const bookingDetail = await BookingDetail.find({})
        // .populate({
        //     path: 'pitch',
        //     populate: {
        //         path: 'pitchType',
        //         match: { pitchBranch: req.params.id },
        //     }
        // })

        // for(let i = 0; i < bookingDetail.length; i++){
        //     if(bookingDetail[i].pitch.pitchType !== null){

        //     }
        // }



        // console.log(bookingDetail)

        return res.status(200).json({
            success: true,
            message: 'Update successfully!',
            bookingDetail
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @DELETE /api/booking/:id
 * @desc Delete a booking by id
 */
router.delete('/:id', verifyToken, validateDelete, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id)
        return res.status(200).json({
            success: true,
            message: 'Delete successfully!',
            booking
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})

/**
 * @POST /api/booking/static
 * @desc get sum countBookings, Price as time, pitchBranchId
 */
 router.get('/static', verifyToken, validatePostStaticFunction, async (req, res) => {
    try {
        const { startDate, endDate, pitchBranchId } = req.query
        const isAdmin = req.payload.isAdmin

        const booking = await Booking.find({})
        // const bk = []

        const static = []
        let staticAsPitchBranch = {
            pitchBranchId: '',
            branchName: '',
            bookingAmount: 0,
            total: 0
        }

        if(isAdmin){
            for(let i = 0; i < booking.length; i++){
                staticAsPitchBranch = {
                    pitchBranchId: '',
                    branchName: '',
                    bookingAmount: 0,
                    total: 0
                }
                const bookingDetail = await BookingDetail.findOne({ booking: booking[i]._id })
                    .populate({
                        path: 'pitch',
                        populate: {
                            path: 'pitchType',
                            populate: {
                                path: 'pitchBranch',
                                select: '_id displayName'
                            }
                        }
                    })
                // console.log(bookingDetail.pitch.pitchType.pitchBranch._id.toString())
                staticAsPitchBranch = await getStaticAsPitchBranch(bookingDetail.pitch.pitchType.pitchBranch._id.toString(),booking)
                staticAsPitchBranch.pitchBranchId = bookingDetail.pitch.pitchType.pitchBranch._id.toString()
                staticAsPitchBranch.branchName = bookingDetail.pitch.pitchType.pitchBranch.displayName
                static.push(staticAsPitchBranch)
            }

            // sum bookingamount and total for similar pitchBranchId
            for(let i = 0; i < static.length; i++){
                for(let j = i+1; j < static.length; j++){
                    if(static[i].pitchBranchId === static[j].pitchBranchId){
                        static[i].bookingAmount += static[j].bookingAmount
                        static[i].total += static[j].total
                        static.splice(j,1)
                        j--
                    }
                }
            }


            console.log(static)
        return res.status(200).json({
            success: true,
            message: 'Get successfully!',
            static
        })
        }else{
            // console.log(await getStaticAsPitchBranch(pitchBranchId ,booking ))
            staticAsPitchBranch = await getStaticAsPitchBranch(pitchBranchId ,booking )
            delete staticAsPitchBranch.pitchBranchId
            delete staticAsPitchBranch.branchName
            return res.status(200).json({
                success: true,
                message: 'Get successfully!',
                static: staticAsPitchBranch
            })
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})


let getStaticAsPitchBranch = async (pitchBranchId, booking) => {
    // console.log(pitchBranchId)
    let staticAsPitchBranch = {
        pitchBranchId: '',
        branchName: '',
        bookingAmount: 0,
        total: 0
    }

    for(let i = 0; i < booking.length; i++){
        if(convertStringToDate(booking[i].startDate).getTime() >= _startDate.getTime() && convertStringToDate(booking[i].endDate).getTime() <= _endDate.getTime()){
            const bd = await BookingDetail.findOne({ booking: booking[i]._id })
            .populate({
                path: 'pitch',
                populate: {
                    path: 'pitchType',
                    match: { pitchBranch: pitchBranchId },
                }
            })
            if(bd === null)
                continue
            let stt = await Status.findOne({ _id: bd.status })
            if(bd.pitch.pitchType !== null && (stt.status !== 'ST3' || stt.status !== 'ST4')){
            {
                // bk.push(bd)
                staticAsPitchBranch.bookingAmount++
                staticAsPitchBranch.total += booking[i].total
            }
        }
    }
    }
    // console.log(staticAsPitchBranch)
    return staticAsPitchBranch
}

/**
 * @GET /api/booking/pitchbranch/:id
 * @desc Get a booking by branch id
 */


/**
 * @GET /api/booking/:id
 * @desc Get a booking by id
 */
 router.get('/:id', verifyToken, validateGetByID, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
        return res.status(200).json({
            success: true,
            message: 'Get successfully!',
            booking
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})


/**
 * @GET /api/booking?customerId=:customerId?pitchBranchId=:pitchBranchId
 * @desc Get all bookings
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        let pitchBranch
        if(Object.keys(req.query).length === 0) {
            //check if user is admin
            const isAdmin = req.payload.isAdmin
            if(!isAdmin){
                return res.status(403).json({
                    success: false,
                    message: 'You are not Admin !',
                })
            }
            let bookings = []
            let booking = await Booking.find()
            for(let i = 0; i < booking.length; i++){
                let bookingDetails = []
                let bookingDetail = await BookingDetail.find({ booking: booking[i]._id })
                for(let j = 0 ; j < bookingDetail.length; j++){
                    let status = await Status.findById(bookingDetail[j].status).select("-createdAt -updatedAt -__v")
                    bookingDetail[j].status = status
                    let pitch = await Pitch.findById(bookingDetail[j].pitch).select("displayName")
                        .populate({
                            path: 'pitchType',
                            select: 'displayName description',
                            populate: {
                                path: 'pitchBranch',
                                select: 'displayName description',
                            }
                        })
                    pitchBranch = pitch.pitchType.pitchBranch
                    bookingDetail[j].pitch = pitch
                    bookingDetails.push(bookingDetail[j])
                }
                let customer = await User.findById(booking[i].customer).select('email -_id')
                bookings.push({
                    _id : booking[i]._id,
                    startDate: booking[i].startDate,
                    endDate: booking[i].endDate,
                    total: booking[i].total,
                    isPaid: booking[i].isPaid,
                    pitchBranch,
                    customer,
                    bookingDetails
                })
            }
            return res.status(200).json({ 
                success: true,
                message: 'Get all bookings successfully!',
                bookings
            })
        }
        const customerId = req.query.customerId
        const pitchBranchId = req.query.pitchBranchId

        if(!customerId && !pitchBranchId) {
            return res.status(400).json({
                success: false,
                message: 'Bad request',
            })
        }

        if(pitchBranchId) {

            //validate owner
            const _pitchBranch = await PitchBranch.findById(pitchBranchId)
            .populate({
                path: 'owner',
            })
            // console.log(pitchBranch)
            // console.log(req.payload.userId)
            if(_pitchBranch.owner._id.toString() !== req.payload.userId && !req.payload.isAdmin) {
                return res.status(404).json({
                    success: false,
                    message: 'You are not owner of this branch !',
                })
            }

            //get all bookingDetail match pitchBranchId
            const bookingDetail = await BookingDetail.find({})
            .populate({
                path: 'pitch',
                select : 'displayName',
                populate: {
                    path: 'pitchType',
                    select: 'displayName description',
                    match: { pitchBranch: pitchBranchId },
                    populate: {
                        path: 'pitchBranch',
                        select: 'displayName description owner',
                    }
                },
            })
            //get booking detail by pitch branch id
            let trueBookingDetail = []
            for(let j = 0; j < bookingDetail.length; j++) {
                if(bookingDetail[j].pitch.pitchType !== null) {
                    let stt = await Status.findById(bookingDetail[j].status.toString()).select('_id status description')
                    bookingDetail[j].status = stt
                    trueBookingDetail.push(bookingDetail[j])
                }
            }
            // push bookingDetail to booking
            const booking = await Booking.find({})
            let bookings = []
            //for all booking to get bookingDetail
            for(let i = 0; i < booking.length; i++) {
                //filter by booking
                let bookingDetails = []
                for(let j = 0; j < trueBookingDetail.length; j++) {
                    if(booking[i]._id.toString() === trueBookingDetail[j].booking._id.toString() 
                    && (trueBookingDetail[j].pitch.pitchType.pitchBranch.owner.toString() === req.payload.userId 
                    || req.payload.isAdmin)) {
                        pitchBranch = trueBookingDetail[j].pitch.pitchType.pitchBranch
                        bookingDetails.push(trueBookingDetail[j])
                    }
                }
                let customer = await User.findById(booking[i].customer).select('email -_id')
                if(bookingDetails.length > 0) {
                    bookings.push({
                        _id : booking[i]._id,
                        startDate: booking[i].startDate,
                        endDate: booking[i].endDate,
                        total: booking[i].total,
                        isPaid: booking[i].isPaid,
                        pitchBranch: pitchBranch,
                        customer,
                        bookingDetails
                    })
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Get successfully!',
                bookings
            })
        }

        //validate customerId
        if(customerId !== req.payload.userId && !req.payload.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You don\'t have permission to get this booking!',
            })
        }

        //get all Booking match customerId
        let bookings = []
        let _bookings = await Booking.find({}).where('customer').equals(customerId)
        for(let i = 0 ; i < _bookings.length ; i ++ )
        {
            let bookingDetails = []
            let _bookingDetail = await BookingDetail.find({}).where('booking').equals(_bookings[i]._id.toString())
            for(let j = 0 ; j < _bookingDetail.length ; j ++ )
            {
                let stt = await Status.findById(_bookingDetail[j].status.toString()).select('_id status description')
                _bookingDetail[j].status = stt
                let pitch = await Pitch.findById(_bookingDetail[j].pitch).select('displayName').populate({
                    path: 'pitchType',
                    select: 'displayName description',
                    populate: {
                        path: 'pitchBranch',
                        select: 'displayName description',
                    }
                })
                pitchBranch = pitch.pitchType.pitchBranch
                _bookingDetail[j].pitch = pitch
                bookingDetails.push(_bookingDetail[j])
            }
            const customer = await User.findById(_bookings[i].customer).select('email -_id')
            bookings.push({ 
                _id: _bookings[i]._id,
                startDate: _bookings[i].startDate,
                endDate: _bookings[i].endDate,
                total: _bookings[i].total,
                ispaid: _bookings[i].ispaid,
                pitchBranch: pitchBranch,
                customer,
                bookingDetails
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Get successfully!',
            bookings
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
            error: error.message
        })
    }
})


//function convert StringDate to Date
function convertStringToDate(s) {
    const splDay = s.split('/')
    const dateTime = new Date(splDay[2], splDay[1] - 1, splDay[0])
    return dateTime
}

module.exports = router
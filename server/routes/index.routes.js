const authRouter = require('./auth.routes')
const roleRouter = require('./role.routes')
const userRouter = require('./user.routes')
const timeRouter = require('./time.routes')
const pitchBranchRouter = require('./pitchBranch.routes')
const pitchTypeRouter = require('./pitchType.routes')
const priceRouter = require('./price.routes')
const pitchRouter = require('./pitch.routes')
const bookingRouter = require('./booking.routes')
const statusRouter = require('./status.routes')
const bookingDetailRouter = require('./bookingDetail.routes')


function routes(app) {
    // Router Role
    app.use('/api/roles', roleRouter)

    // Router Auth
    app.use('/api/auth', authRouter)

    // Router User
    app.use('/api/users', userRouter)

    // Router Time
    app.use('/api/times', timeRouter)

    // Router PitchBranch
    app.use('/api/pitchbranch', pitchBranchRouter)

    // Router PitchBranch
    app.use('/api/pitchtype', pitchTypeRouter)

    // Router Price
    app.use('/api/price', priceRouter)

    // Router pitch
    app.use('/api/pitch', pitchRouter)

    // Router booking
    app.use('/api/booking', bookingRouter)

    // Router status
    app.use('/api/status', statusRouter)

    // Router bookingDetail
    app.use('/api/bookingdetail', bookingDetailRouter)

    // Home
    app.get('/', (req, res) => {
        res.send('Welcome to my website!')
    })
}

module.exports = routes

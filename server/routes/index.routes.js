const authRouter = require('./auth.routes')
const roleRouter = require('./role.routes')
const userRouter = require('./user.routes')
const timeRouter = require('./time.routes')
const pitchBranchRouter = require('./pitchBranch.routes')
const pitchTypeRouter = require('./pitchType.routes')
const priceRouter = require('./price.routes')
const pitchRouter = require('./pitch.routes')


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

    // Home
    app.get('/', (req, res) => {
        res.send('Welcome to my website!')
    })
}

module.exports = routes

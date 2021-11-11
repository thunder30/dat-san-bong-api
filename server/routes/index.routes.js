const authRouter = require('./auth.routes')
const roleRouter = require('./role.routes')
const userRouter = require('./user.routes')

function routes(app) {
    // Router Role
    app.use('/api/roles', roleRouter)

    // Router Auth
    app.use('/api/auth', authRouter)

    // Router User
    app.use('/api/users', userRouter)

    // Home
    app.get('/', (req, res) => {
        res.send('Welcome to my website!')
    })
}

module.exports = routes

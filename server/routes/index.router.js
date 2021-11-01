const authRouter = require('./auth.route')
const roleRouter = require('./role.route')

function routes(app) {
    // Router Role
    app.use('/api/role', roleRouter)

    // Router Auth
    app.use('/api/auth', authRouter)

    // Home
    app.get('/', (req, res) => {
        res.send('Welcome to my website!')
    })
}

module.exports = routes

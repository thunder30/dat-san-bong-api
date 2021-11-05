const authRouter = require('./auth.routes')
const roleRouter = require('./role.routes')

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

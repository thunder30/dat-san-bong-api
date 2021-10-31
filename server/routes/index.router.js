const authRouter = require('./auth.route')

function routes(app) {
    // Router Auth
    app.use('/auth', authRouter)

    // Home
    app.get('/', (req, res) => {
        res.send('Welcome to my website!')
    })
}

module.exports = routes

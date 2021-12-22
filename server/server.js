require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mailer = require('./helpers/mailer')
const routes = require('./routes/index.routes')
const db = require('./config/db.config')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// connect database
db.connect()

// set inteval for change status
// setInterval(() => {
//     db.query('UPDATE orders SET status = ? WHERE status = ?', ['delivered', 'pending'])
// }, 1000 * 60 * 60 * 24)

// routes init
routes(app)

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))

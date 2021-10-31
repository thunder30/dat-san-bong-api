require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mailer = require('./helpers/mailer')
const routes = require('./routes/index.router')
const db = require('./config/db/index.db')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// connect database
db.connect()

// routes init
routes(app)

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))

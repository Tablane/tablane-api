const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const mongoose = require("mongoose")
const passport = require("passport")
const session = require('express-session')
const dotenv = require('dotenv')
const app = express()
const users = require('./routes/users')

dotenv.config()
mongoose.connect(process.env.DB_CONNECT, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}, () => console.log('connected to database'))

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(
    session({
        secret: "secretcode",
        resave: true,
        saveUninitialized: true,
    })
)
app.use(cookieParser("secretcode"))
app.use(passport.initialize())
app.use(passport.session())
require("./passportConfig")(passport)

app.use(cors({
    origin: ['http://localhost:3000', 'https://web.postman.co'],
    credentials: true
}))

app.use('/api/user', users)

app.listen(3001, () => {
    console.log('Listening on port 3001')
})
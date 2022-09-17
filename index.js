const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const passport = require('passport')
const session = require('express-session')
const dotenv = require('dotenv')
const app = express()
const users = require('./routes/users')
const workspaces = require('./routes/workspaces')
const spaces = require('./routes/spaces')
const boards = require('./routes/boards')
const tasks = require('./routes/tasks')
const attributes = require('./routes/attributes')
const notification = require('./routes/notifications')
const MongoDBStore = require('connect-mongodb-session')(session)
const http = require('http').createServer(app)
const { Server } = require('socket.io')
const { isLoggedIn, hasWritePerms, wrapAsync } = require('./middleware')
const Board = require('./models/board')
const Task = require('./models/task')
const io = new Server(http)

dotenv.config()
mongoose.connect(
    process.env.DB_CONNECT,
    {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    },
    () => console.log('connected to database')
)

// middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(
    session({
        secret: process.env.COOKIE_SECRET,
        resave: true,
        saveUninitialized: true,
        store: new MongoDBStore({
            uri: process.env.DB_CONNECT,
            collection: 'session'
        }),
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 60 * 60 * 24 * 1000
        }
    })
)
app.set('trust proxy', 1)
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(passport.initialize())
app.use(passport.session())
require('./passportConfig')(passport)

app.use(
    cors({
        origin: [process.env.FRONTEND_HOST],
        credentials: true
    })
)

app.use('/api/user', users)
app.use('/api/workspace', workspaces)
app.use('/api/space', spaces)
app.use('/api/board', boards)
app.use('/api/task', tasks)
app.use('/api/attribute', attributes)
app.use('/api/notification', notification)

app.get('/socket/:message', async (req, res) => {
    const { message } = req.params
    io.emit('endpoint', message)
    res.json({ success: true, message: 'OK' })
})

app.use(function (err, req, res, next) {
    const { status = 500, message = 'Internal Server Error' } = err
    res.status(status).json({ message })
})

http.listen(process.env.PORT || 3001, () => {
    console.log(`Listening on port ${process.env.PORT || 3001}`)
})

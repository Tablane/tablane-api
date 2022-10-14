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

const sessionOptions = {
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
        maxAge: 60 * 60 * 24 * 1000 // 24 hours
    }
}

const corsOptions = {
    origin: [process.env.FRONTEND_HOST],
    credentials: true
}
const io = new Server(http, { cors: corsOptions })
const wrap = middleware => (socket, next) =>
    middleware(socket.request, {}, next)
io.use(wrap(session(sessionOptions)))

// middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session(sessionOptions))
app.set('socketio', io)
app.set('trust proxy', 1)
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(passport.initialize())
app.use(passport.session())
require('./passportConfig')(passport)
app.use(cors(corsOptions))

app.use('/api/user', users)
app.use('/api/workspace', workspaces)
app.use('/api/space', spaces)
app.use('/api/board', boards)
app.use('/api/task', tasks)
app.use('/api/attribute', attributes)
app.use('/api/notification', notification)

io.on('connect', socket => {
    if (!socket.request.session.passport?.user) {
        socket.emit('not authenticated')
        return socket.disconnect()
    }

    socket.join(socket.request.session.passport.user.toString())

    socket.on('subscribe', room => {
        socket.join(room)
        socket.emit('message', 'successfully joined room')
    })

    socket.on('unsubscribe', room => {
        socket.leave(room)
        socket.emit('message', 'successfully left room')
    })
})

app.use((err, req, res, next) => {
    const { status = 500, message = 'Internal Server Error' } = err
    res.status(status).json({
        success: false,
        message
    })
})

http.listen(process.env.PORT || 3001, () => {
    console.log(`Listening on port ${process.env.PORT || 3001}`)
})

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const app = express()
const users = require('./routes/users')
const workspaces = require('./routes/workspaces')
const spaces = require('./routes/spaces')
const boards = require('./routes/boards')
const tasks = require('./routes/tasks')
const attributes = require('./routes/attributes')
const notification = require('./routes/notifications')
const roles = require('./routes/roles')
const comments = require('./routes/comments')
const http = require('http').createServer(app)
const { Server } = require('socket.io')
const { rateLimit } = require('./utils/rateLimit')
const AppError = require('./HttpError')
const { verify } = require('jsonwebtoken')
const User = require('./models/user')
const Board = require('./models/board')
const Workspace = require('./models/workspace')

dotenv.config()
mongoose.connect(process.env.DB_CONNECT, {}, () =>
    console.log('connected to database')
)

const corsOptions = {
    origin: [process.env.FRONTEND_HOST],
    credentials: true,
    maxAge: 86400
}
const io = new Server(http, { cors: corsOptions })

// middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.set('socketio', io)
app.set('trust proxy', 1)
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(cors(corsOptions))
app.use(rateLimit)

app.use('/api/user', users)
app.use('/api/workspace', workspaces)
app.use('/api/space', spaces)
app.use('/api/board', boards)
app.use('/api/task', tasks)
app.use('/api/attribute', attributes)
app.use('/api/notification', notification)
app.use('/api/role', roles)
app.use('/api/comment', comments)

io.use(async (socket, next) => {
    const authorization = socket.handshake.headers['authorization']
    if (!authorization) return next(new AppError('Invalid access tokens', 403))

    try {
        const token = authorization.split(' ')[1]
        const payload = verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(payload.user._id)
        socket.user = {
            username: user.username,
            _id: user._id
        }
    } catch (err) {
        return next(new AppError('Invalid access token', 403))
    }
    next()
})

io.on('connect', socket => {
    socket.on('subscribe', async ({ room, type }) => {
        try {
            let user
            if (type === 'board') {
                const board = await Board.findById(room).populate({
                    path: 'workspace',
                    populate: 'members'
                })
                user = board.workspace.members.find(
                    x => x.user.toString() === socket.user._id.toString()
                )
            } else if (type === 'workspace') {
                const workspace = await Workspace.findOne({
                    id: room
                }).populate('members')
                user = workspace.members.find(
                    x => x.user.toString() === socket.user._id.toString()
                )
            }
            if (user) {
                socket.join(room)
                socket.emit('message', 'successfully joined room')
            }
        } catch (err) {
            console.log(err)
        }
    })

    socket.on('unsubscribe', room => {
        socket.leave(room)
        socket.emit('message', 'successfully left room')
    })
})

app.use((err, req, res, next) => {
    const {
        status = 500,
        message = 'Internal Server Error',
        options = {}
    } = err
    console.log(err)
    res.status(status).json({
        success: false,
        message,
        ...options
    })
})

http.listen(process.env.PORT || 3001, () => {
    console.log(`Listening on port ${process.env.PORT || 3001}`)
})

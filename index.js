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
const http = require('http').createServer(app)
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')

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

const corsOptions = {
    origin: [process.env.FRONTEND_HOST],
    credentials: true
}
const io = new Server(http, { cors: corsOptions })

// middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.set('socketio', io)
app.set('trust proxy', 1)
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(cors(corsOptions))

app.use('/api/user', users)
app.use('/api/workspace', workspaces)
app.use('/api/space', spaces)
app.use('/api/board', boards)
app.use('/api/task', tasks)
app.use('/api/attribute', attributes)
app.use('/api/notification', notification)
app.use('/api/role', roles)

io.on('connect', socket => {
    socket.on('token', payload => {
        try {
            const token = jwt.verify(
                payload.token,
                process.env.ACCESS_TOKEN_SECRET
            )
            socket.join(token.user._id)
            socket.authenticated = true
        } catch (err) {
            socket.disconnect()
        }
    })

    setInterval(() => {
        socket.emit('token', 'jwt_expiring')
        socket.authenticated = false
        setTimeout(() => {
            if (!socket.authenticated) {
                socket.emit('jwt_auth_failed', 'socket disconnected')
                socket.disconnect()
            }
        }, 1000 * 15)
    }, 1000 * 60 * 15)

    socket.on('subscribe', room => {
        if (socket.authenticated) {
            socket.join(room)
            socket.emit('message', 'successfully joined room')
        }
    })

    socket.on('unsubscribe', room => {
        if (socket.authenticated) {
            socket.leave(room)
            socket.emit('message', 'successfully left room')
        }
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

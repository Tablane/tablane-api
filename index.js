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
const views = require('./routes/views')
const tasks = require('./routes/tasks')
const attributes = require('./routes/attributes')
const notification = require('./routes/notifications')
const roles = require('./routes/roles')
const comments = require('./routes/comments')
const http = require('http').createServer(app)
const { rateLimit } = require('./utils/rateLimit')
const Board = require('./models/board')
const Workspace = require('./models/workspace')
const { wrapAsync, isLoggedIn } = require('./middleware')
const PermissionError = require('./PermissionError')
const pusher = require('./pusher')

dotenv.config()
mongoose.connect(process.env.DB_CONNECT, {}, () =>
    console.log('connected to database')
)

const corsOptions = {
    origin: [process.env.FRONTEND_HOST],
    credentials: true,
    maxAge: 86400
}

// middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.set('trust proxy', 1)
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(cors(corsOptions))
app.use(rateLimit)
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Cache-Control', 'public, max-age=86400')
        res.end()
    } else {
        next()
    }
})

app.use('/api/user', users)
app.use('/api/workspace', workspaces)
app.use('/api/space', spaces)
app.use('/api/board', boards)
app.use('/api/view', views)
app.use('/api/task', tasks)
app.use('/api/attribute', attributes)
app.use('/api/notification', notification)
app.use('/api/role', roles)
app.use('/api/comment', comments)

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        message: 'api is online'
    })
})

app.post(
    '/api/pusher/auth',
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const { socket_id, channel_name } = req.body

        try {
            const type = channel_name.split('-')[1]
            const id = channel_name.split('-')[2]

            if (type === 'board') {
                const board = await Board.findById(id).populate({
                    path: 'workspace',
                    populate: 'members'
                })
                const localUser = board.workspace.members.find(
                    x => x.user.toString() === req.user._id.toString()
                )
                if (!localUser) throw new PermissionError('READ:PUBLIC')
            } else if (type === 'workspace') {
                const workspace = await Workspace.findOne({
                    id
                }).populate('members')
                const localUser = workspace.members.find(
                    x => x.user.toString() === req.user._id.toString()
                )
                if (!localUser) throw new PermissionError('READ:PUBLIC')
            } else {
                throw new PermissionError('READ:PUBLIC')
            }

            const channelAuthResponse = pusher.authorizeChannel(
                socket_id,
                channel_name
            )

            res.send(channelAuthResponse)
        } catch (err) {
            throw new PermissionError('READ:PUBLIC')
        }
    })
)

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

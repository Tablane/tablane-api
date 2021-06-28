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
const Workspaces = require('./models/workspace')
const Spaces = require('./models/space')
const Boards = require('./models/board')
const TaskGroups = require('./models/taskGroup')
const Tasks = require('./models/task')
const {wrapAsync, isLoggedIn} = require("./middleware");

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
    origin: ['http://localhost:3000', 'http://192.168.0.239:3000', 'https://web.postman.co'],
    credentials: true
}))

app.use('/api/user', users)

// app.get('/api/workspace/new', (req, res) => {
//     let id = ''
//     for (let i = 0; i < 4; i++) {
//         id += Math.floor(Math.random() * 10)
//     }
//     res.send(id)
// })

app.get('/api/workspace/:workspaceId', isLoggedIn, wrapAsync(async (req, res) => {
    const { workspaceId } = req.params
    const workspace = await Workspaces.findOne({ id: workspaceId }).populate({
        path: 'spaces',
        model: 'Space',
        populate: {
            path: 'boards',
            model: 'Board',
            select: 'name'
        }
    })
    if (workspace.owner !== req.user.username) return res.status(401).send('no perms')
    res.json(workspace)
}))

app.patch('/api/task/:boardId/:taskGroupId/:taskId', isLoggedIn, async (req, res) => {
    const {boardId, taskGroupId, taskId} = req.params
    const board = (await Boards.findOne({ _id: boardId })
        .populate({path: 'taskGroups', model: 'TaskGroup', populate: {path: 'tasks', model: 'Task'}})).toJSON()
    if (!board.members.includes(req.user.username)) return res.status(401).send('no perms')
    const task = board.taskGroups
        .find(x => x._id.toString() === taskGroupId).tasks
        .find(x => x._id.toString() === taskId)._id
    const {property, value} = req.body
    if (!property || typeof value !== "number") return res.send('bad request')
    Tasks.findByIdAndUpdate(task, {$set: {[`options.${property}`]: parseInt(value)}},
        {new: true, upsert: true, useFindAndModify: false}, (err, doc) => {
            res.send(doc)
        })
})

app.get('/api/board/:boardId', isLoggedIn, async (req, res) => {
    const {boardId} = req.params
    const board = await Boards.findOne({_id: boardId}).populate({
        path: 'taskGroups',
        model: 'TaskGroup',
        populate: {
            path: 'tasks',
            model: 'Task',
        }
    })
    if (!board.toJSON().members.includes(req.user.username)) return res.send('no perms')
    res.json(board)
})

app.listen(3001, () => {
    console.log('Listening on port 3001')
})

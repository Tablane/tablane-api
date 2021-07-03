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
const workspaces = require('./routes/workspaces')
const spaces = require('./routes/spaces')
const boards = require('./routes/boards')
const taskgroups = require('./routes/taskgroups')
const tasks = require('./routes/tasks')
const Workspaces = require('./models/workspace')
const Spaces = require('./models/space')
const Boards = require('./models/board')
const TaskGroups = require('./models/taskGroup')
const Tasks = require('./models/task')
const {wrapAsync, isLoggedIn} = require("./middleware");
const MongoDBStore = require('connect-mongodb-session')(session);

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
        store: new MongoDBStore({
            uri: process.env.DB_CONNECT,
            collection: 'session'
        })
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
// app.use('/api/workspace', workspaces)
// app.use('/api/space', spaces)
// app.use('/api/board', boards)
app.use('/api/taskgroup', taskgroups)
app.use('/api/task', tasks)

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
        path: 'spaces.boards',
        model: 'Board',
        select: 'name'
    })
    res.json(workspace)
}))

app.get('/api/board/:boardId', isLoggedIn, async (req, res) => {
    const {boardId} = req.params
    const board = await Boards.findById(boardId)
    if (!board.toJSON().members.includes(req.user.username)) return res.send('no perms')
    res.json(board)
})

app.get('/api/seeds', async (req, res) => {
    await Workspaces.deleteMany({})
    await Boards.deleteMany({})

    const task = new Tasks({
        name: 'fix game not ending after timer ends',
        options: [{name: 'status', value: 0}, {name:'deployed', value:0}]
    })
    const taskGroup = new TaskGroups({
        name: 'Ingame state',
        tasks: [task]
    })
    const board = new Boards({
        name: 'TTT',
        members: ['game'],
        attributes: [
            {
                name: 'status',
                labels: [{name: 'stuck', color:'#E2445C'}, {name: 'assigned', color: '#F9D900'}, {name: 'open', color: '#667684'}]
            },
            {
                name: 'deployed',
                labels: [{name: 'testing', color:'#E2445C'}, {name: 'yes', color: '#2ECD6F'}]
            }
        ],
        taskGroups: [taskGroup]
    })
    const space = new Spaces({
        name: 'Server Project',
        boards: [board]
    })
    const workspace = new Workspaces({
        id: 9719,
        owner: 'game',
        spaces: [space]
    })

    await workspace.save()
    await board.save()

    res.send('test')
})

app.listen(3001, () => {
    console.log('Listening on port 3001')
})

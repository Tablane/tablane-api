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

app.get('/api/workspace/:workspace', async (req, res) => {
    const t = await Workspaces.findOne().populate({
        path: 'spaces',
        model: 'Space',
        populate: {
            path: 'boards',
            model: 'Board',
            populate: {
                path: 'taskGroups',
                model: 'TaskGroup',
                populate: {
                    path: 'tasks',
                    model: 'Task',
                }
            }
        }
    })
    if (!req.user || t.owner !== req.user.username) return res.send('no perms')
    res.json(t)
})

app.get('/api/task/:task', async (req, res) => {
    const task = await Tasks.find({_id: req.params.task})
    res.send(task)
})

app.patch('/api/task/:task', async (req, res) => {
    const {id, property, value} = req.body
    Tasks.findByIdAndUpdate(id, {$set: {[`options.${property}`]: value}},
        {new: true, upsert: true, useFindAndModify: false}, (err, doc) => {
            res.send(doc)
        })
})

app.listen(3001, () => {
    console.log('Listening on port 3001')
})
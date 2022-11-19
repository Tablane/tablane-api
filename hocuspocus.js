const { Server: hocuspocus } = require('@hocuspocus/server')
const mongoose = require('mongoose')
const AppError = require('./HttpError')
const { verify } = require('jsonwebtoken')
const User = require('./models/user')
const role = require('./models/role')
const Workspace = require('./models/workspace')
const Task = require('./models/task')
const { Database } = require('@hocuspocus/extension-database')
const dotenv = require('dotenv')

dotenv.config()
mongoose.connect(process.env.DB_CONNECT, {}, () =>
    console.log('connected to database')
)

const instance = hocuspocus.configure({
    port: process.env.PORT || 3002,
    async onListen(data) {
        console.log(`Hocuspocus listening on port ${process.env.PORT || 3002}`)
    },
    async onAuthenticate({ token, documentName }) {
        if (!token) throw new AppError('Invalid access token', 403)

        try {
            const payload = verify(token, process.env.ACCESS_TOKEN_SECRET)
            const user = await User.findById(payload.user._id)

            const task = await Task.findById(documentName).populate({
                path: 'workspace',
                populate: ['roles', 'members.role']
            })

            const member = task.workspace.members.find(
                x => x.user.toString() === user._id.toString()
            )

            if (!member) throw new AppError('Invalid access token', 403)

            return {
                user: {
                    username: user.username,
                    _id: user._id
                }
            }
        } catch (err) {
            console.log(err)
            throw new AppError('Invalid access token', 403)
        }
    },
    extensions: [
        new Database({
            fetch: async ({ documentName }) => {
                try {
                    const task = await Task.findById(documentName)
                    if (task.description.length === 0) return undefined
                    return new Uint8Array(task.description)
                } catch (err) {
                    console.log(err)
                }
            },
            store: async ({ documentName, state }) => {
                try {
                    if (!documentName || !state) return
                    const task = await Task.findById(documentName)
                    if (!task) return
                    task.description = state
                    task.save()
                } catch (err) {
                    console.log(err)
                }
            }
        })
    ]
})
instance.listen()

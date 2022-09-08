const mongoose = require('mongoose')
const User = require('../models/user')
const Board = require('../models/board')
const Schema = mongoose.Schema

const workspaceSchema = new mongoose.Schema({
    name: String,
    id: {
        type: Number,
        unique: true,
        required: true
    },
    members: [
        {
            _id: false,
            user: Schema.Types.ObjectId,
            role: {
                type: String,
                enum: ['owner', 'admin', 'member', 'guest']
            },
            labels: Array
        }
    ],
    spaces: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Space'
        }
    ]
})

workspaceSchema.post('findOneAndDelete', async function (doc) {
    if (!doc) return
    doc.members.map(async x => {
        const user = await User.findById(x.user)
        user.workspaces = user.workspaces.filter(
            x => x.toString() !== doc._id.toString()
        )
        user.save()
    })
    doc.spaces.map(space => {
        space.boards.map(async x => {
            const board = await Board.findByIdAndDelete(x)
        })
    })
})

module.exports = mongoose.model('Workspace', workspaceSchema)

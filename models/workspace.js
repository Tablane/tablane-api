const mongoose = require('mongoose')
const User = require('../models/user')
const Space = require('../models/space')
const Role = require('../models/role')
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
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            role: {
                type: Schema.Types.ObjectId,
                ref: 'Role'
            },
            isOwner: Boolean,
            labels: Array
        }
    ],
    spaces: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Space'
        }
    ],
    roles: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Role'
        }
    ]
})

workspaceSchema.post('findOneAndDelete', async function (workspace) {
    if (!workspace) return

    workspace.members.map(async member => {
        const user = await User.findById(member.user)
        user.workspaces = user.workspaces.filter(
            x => x.toString() !== workspace._id.toString()
        )
        await user.save()
    })
    workspace.spaces.map(async space => {
        await Space.findByIdAndDelete(space)
    })
    workspace.roles.map(async role => {
        await Role.findByIdAndDelete(role)
    })
})

module.exports = mongoose.model('Workspace', workspaceSchema)

const mongoose = require('mongoose')
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
            name: String,
            boards: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'Board'
                }
            ]
        }
    ]
})

module.exports = mongoose.model('Workspace', workspaceSchema)

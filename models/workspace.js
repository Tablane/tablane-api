const mongoose = require('mongoose')
const Schema = mongoose.Schema

const workspaceSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    owner: {
        type: String,
        required: true,
    },
    spaces: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Space'
        }
    ]
})

module.exports = mongoose.model('Workspace', workspaceSchema)

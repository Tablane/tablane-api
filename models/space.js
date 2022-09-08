const mongoose = require('mongoose')
const Schema = mongoose.Schema

const spaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    boards: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Board'
        }
    ],
    workspace: {
        type: Schema.Types.ObjectId,
        ref: 'Workspace'
    }
})

module.exports = mongoose.model('Space', spaceSchema)

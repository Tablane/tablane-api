const mongoose = require('mongoose')
const Board = require('./board')
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

spaceSchema.post('findOneAndDelete', async function (space) {
    if (!space) return

    space.boards.map(async board => {
        await Board.findByIdAndDelete(board)
    })
})

module.exports = mongoose.model('Space', spaceSchema)

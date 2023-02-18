const mongoose = require('mongoose')
const Schema = mongoose.Schema

const viewSchema = new Schema({
    name: String,
    board: {
        type: Schema.Types.ObjectId,
        ref: 'Board'
    },
    id: String,
    filters: Schema.Types.Mixed,
    groupBy: String,
    sharing: Boolean
})

// viewSchema.post('findOneAndDelete', async function (board) {
//     if (!board) return
//
//     board.tasks.map(async task => await Task.findByIdAndDelete(task))
// })

module.exports = mongoose.model('View', viewSchema)

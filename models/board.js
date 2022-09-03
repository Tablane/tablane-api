const mongoose = require('mongoose')
const Schema = mongoose.Schema

const boardSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    workspace: {
        type: Schema.Types.ObjectId,
        ref: 'Workspace'
    },
    sharing: {
        type: Boolean
    },
    tasks: [
        {
            _id: mongoose.Types.ObjectId,
            name: String,
            description: String,
            history: [],
            options: [
                {
                    column: mongoose.Types.ObjectId,
                    value: String
                }
            ]
        }
    ],
    groupBy: String,
    attributes: [
        {
            type: { type: String },
            _id: mongoose.Types.ObjectId,
            name: String,
            labels: [
                {
                    _id: mongoose.Types.ObjectId,
                    name: String,
                    color: String
                }
            ]
        }
    ]
})

module.exports = mongoose.model('Board', boardSchema)

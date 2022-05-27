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
    taskGroups: [
        {
            name: String,
            tasks: [
                {
                    name: String,
                    description: String,
                    options: [
                        {
                            column: mongoose.Types.ObjectId,
                            value: String,
                        }
                    ]
                }
            ]
        }
    ],
    attributes: [
        {
            type: { type: String },
            _id: mongoose.Types.ObjectId,
            name: String,
            labels: [
                {
                    _id: mongoose.Types.ObjectId,
                    name: String,
                    color: String,
                }
            ]
        }
    ]
})

module.exports = mongoose.model('Board', boardSchema)

const mongoose = require('mongoose')
const User = require('../models/user')
const Board = require('../models/board')
const Schema = mongoose.Schema

const roleSchema = new mongoose.Schema({
    name: String,
    permissions: [String],
    workspace: {
        type: Schema.Types.ObjectId,
        ref: 'Workspace'
    }
})

module.exports = mongoose.model('Role', roleSchema)

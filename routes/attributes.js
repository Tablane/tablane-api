const router = require('express').Router()
const Board = require('../models/board')
const Workspace = require('../models/workspace')
const {wrapAsync, isLoggedIn} = require("../middleware");
const mongoose = require('mongoose')

router.post('/:boardId', async (req, res) => {
    const {boardId} = req.params
    const board = await Board.findById(boardId)

    const attribute = {
        name: req.body.name,
        labels: [],
        _id: new mongoose.Types.ObjectId()
    }
    board.attributes.push(attribute)

    await board.save()
    res.send('OK')
})

router.put('/:boardId', async (req, res) => {
    const {boardId} = req.params
    const board = await Board.findById(boardId)

    board.attributes.find(x => x.name === req.body.name).labels = req.body.labels
    board.attributes.find(x => x.name === req.body.name).labels.map(x => {
        if (!x._id) return x._id = new mongoose.Types.ObjectId()
    })
    board.markModified(`attributes`)

    await board.save()
    res.send('OK')
})

router.delete('/:boardId/:attributeId', async (req, res) => {
    const {boardId, attributeId} = req.params
    const board = await Board.findById(boardId)

    const attributeIndex = board.attributes.indexOf(board.attributes.find(x => x._id.toString() === attributeId))
    if (attributeIndex > -1) board.attributes.splice(attributeIndex, 1)

    await board.save()
    res.send('OK')
})

module.exports = router
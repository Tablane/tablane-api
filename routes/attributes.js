const router = require('express').Router()
const Board = require('../models/board')
const Workspace = require('../models/workspace')
const {wrapAsync, isLoggedIn} = require("../middleware");

router.post('/:boardId', async (req, res) => {
    const {boardId} = req.params
    const board = await Board.findById(boardId)
    const attribute = {
        name: req.body.name,
        labels: []
    }
    board.attributes.push(attribute)
    await board.save()
    res.send('OK')
})

router.put('/:boardId', async (req, res) => {
    const {boardId} = req.params
    const board = await Board.findById(boardId)

    board.attributes.find(x => x.name === req.body.name).labels = req.body.labels
    board.markModified(`attributes`)

    await board.save()
    res.send('OK')
})

module.exports = router
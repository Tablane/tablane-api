const router = require('express').Router()
const {wrapAsync, isLoggedIn} = require("../middleware");
const TaskGroup = require('../models/taskGroup')
const Board = require('../models/board')

router.post('/:boardId', async (req, res) => {
    const { boardId } = req.params
    const taskGroup = new TaskGroup({name: req.body.name, tasks: []})
    const board = await Board.findById(boardId)

    board.taskGroups.push(taskGroup)
    await board.save()
    res.send('OK')
})

router.delete('/:boardId/:taskGroupId', async (req, res) => {
    const { boardId, taskGroupId } = req.params
    const board = await Board.findById(boardId)
    const taskGroup = board.taskGroups.find(x => x._id.toString() === taskGroupId)

    board.taskGroups.splice(board.taskGroups.indexOf(taskGroup), 1)
    await board.save()
    res.send('OK')
})

module.exports = router
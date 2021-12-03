const router = require('express').Router()
const {wrapAsync, isLoggedIn, hasWritePerms} = require("../middleware");
const TaskGroup = require('../models/taskGroup')
const Board = require('../models/board')

router.post('/:boardId', isLoggedIn, hasWritePerms, async (req, res) => {
    const { boardId } = req.params
    const taskGroup = new TaskGroup({name: req.body.name, tasks: []})
    const board = await Board.findById(boardId)

    board.taskGroups.push(taskGroup)
    await board.save()
    res.send('OK')
})

router.patch('/:boardId/:taskGroupId', isLoggedIn, hasWritePerms, async (req, res) => {
    const { boardId, taskGroupId } = req.params
    const { name } = req.body
    const board = await Board.findById(boardId)

    board.taskGroups.find(x => x._id.toString() === taskGroupId).name = name

    await board.save()
    res.send('OK')
})

router.patch('/:boardId', isLoggedIn, hasWritePerms, async (req, res) => {
    const { boardId } = req.params
    const { result } = req.body
    const board = await Board.findById(boardId)

    const [taskgroup] = board.taskGroups.splice(result.source.index, 1)
    board.taskGroups.splice(result.destination.index, 0, taskgroup)

    await board.save()
    res.send('OK')
})

router.delete('/:boardId/:taskGroupId', isLoggedIn, hasWritePerms, async (req, res) => {
    const { boardId, taskGroupId } = req.params
    const board = await Board.findById(boardId)
    const taskGroup = board.taskGroups.find(x => x._id.toString() === taskGroupId)

    board.taskGroups.splice(board.taskGroups.indexOf(taskGroup), 1)
    await board.save()
    res.send('OK')
})

module.exports = router
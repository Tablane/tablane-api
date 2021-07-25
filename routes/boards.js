const router = require('express').Router()
const Board = require('../models/board')
const Workspace = require('../models/workspace')
const {wrapAsync, isLoggedIn} = require("../middleware");

router.get('/:boardId', isLoggedIn, async (req, res) => {
    const {boardId} = req.params
    const board = await Board.findById(boardId)
    if (!board.toJSON().members.includes(req.user.username)) return res.send('no perms')
    res.json(board)
})

router.patch('/:workspaceId', async (req, res) => {
    const {workspaceId} = req.params
    const {result} = req.body

    const workspace = await Workspace.findById(workspaceId)
    const source = workspace.spaces.find(x => x._id.toString() === result.source.droppableId)
    const destination = workspace.spaces.find(x => x._id.toString() === result.destination.droppableId)

    const [board] = source.boards.splice(result.source.index, 1)
    destination.boards.splice(result.destination.index, 0, board)

    workspace.save()
    res.send('OK')
})

router.post('/:workspaceId/:spaceId', async (req,res) => {
    const {workspaceId, spaceId} = req.params
    const workspace = await Workspace.findById(workspaceId)
    const board = new Board({
        name: req.body.name,
        members: ['game'],
        attributes: [],
        taskGroups: []
    })
    workspace.spaces.find(x => x._id.toString() === spaceId).boards.push(board)
    await workspace.save()
    await board.save()
    res.send('OK')
})

router.delete('/:workspaceId/:spaceId/:boardId', async (req, res) => {
    const {workspaceId, spaceId, boardId} = req.params
    const workspace = await Workspace.findById(workspaceId)
    const board = await Board.findByIdAndDelete(boardId)

    workspace.spaces.find(x => x._id.toString() === spaceId).boards.remove(boardId)

    await workspace.save()
    res.send('OK')
})

module.exports = router
const router = require('express').Router()
const Board = require('../models/board')
const Workspace = require('../models/workspace')
const {wrapAsync, isLoggedIn, hasBoardPerms, hasWorkspacePerms} = require("../middleware");

// get board info
router.get('/:boardId', isLoggedIn, hasBoardPerms, async (req, res) => {
    const {boardId} = req.params
    const board = await Board.findById(boardId)

    res.json(board)
})

// get shared board info
router.get('/share/:boardId', async (req, res) => {
    const {boardId} = req.params
    let board = await Board.findById(boardId)

    if (!board.sharing) return res.status(403).send('Forbidden')
    res.json({
        name: board.name,
        attributes: board.attributes,
        taskGroups: board.taskGroups
    })
})

// change share state
router.patch('/share/:boardId', isLoggedIn, hasBoardPerms, async (req, res) => {
    const {boardId} = req.params
    const {share} = req.body

    const board = await Board.findById(boardId)
    board.sharing = share

    board.save()
    res.json({
        status: 'OK',
        boardId
    })
})

// drag and drop sorting
router.patch('/:workspaceId', isLoggedIn, hasWorkspacePerms, async (req, res) => {
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

// create new board
router.post('/:workspaceId/:spaceId', isLoggedIn, hasWorkspacePerms, async (req,res) => {
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

// delete board
router.delete('/:workspaceId/:spaceId/:boardId', isLoggedIn, hasBoardPerms, async (req, res) => {
    const {workspaceId, spaceId, boardId} = req.params
    const workspace = await Workspace.findById(workspaceId)
    await Board.findByIdAndDelete(boardId)

    workspace.spaces.find(x => x._id.toString() === spaceId).boards.remove(boardId)

    await workspace.save()
    res.send('OK')
})

module.exports = router
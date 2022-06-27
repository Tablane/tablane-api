const router = require('express').Router()
const Board = require('../models/board')
const Workspace = require('../models/workspace')
const {wrapAsync, isLoggedIn, hasReadPerms, hasWritePerms} = require("../middleware");

// get board info
router.get('/:boardId', isLoggedIn, hasReadPerms, wrapAsync(async (req, res) => {
    const {boardId} = req.params
    const board = await Board.findById(boardId)

    res.json(board)
}))

// get shared board info
router.get('/share/:boardId', wrapAsync(async (req, res) => {
    const {boardId} = req.params
    let board = await Board.findById(boardId)

    if (!board.sharing) return res.status(403).send('Forbidden')
    res.json({
        name: board.name,
        attributes: board.attributes,
        taskGroups: board.taskGroups
    })
}))

// change share state
router.patch('/share/:boardId', isLoggedIn, hasWritePerms, wrapAsync(async (req, res) => {
    const {boardId} = req.params
    const {share} = req.body

    const board = await Board.findById(boardId)
    board.sharing = share

    board.save()
    res.json({
        status: 'OK',
        boardId
    })
}))

// drag and drop sorting
router.patch('/drag/:workspaceId', isLoggedIn, hasWritePerms, wrapAsync(async (req, res) => {
    const {workspaceId} = req.params
    const {result} = req.body

    const workspace = await Workspace.findById(workspaceId)
    const source = workspace.spaces.find(x => x._id.toString() === result.source.droppableId)
    const destination = workspace.spaces.find(x => x._id.toString() === result.destination.droppableId)

    const [board] = source.boards.splice(result.source.index, 1)
    destination.boards.splice(result.destination.index, 0, board)

    workspace.save()
    res.send('OK')
}))

// create new board
router.post('/:workspaceId/:spaceId', isLoggedIn, hasWritePerms, wrapAsync(async (req,res) => {
    const {workspaceId, spaceId} = req.params
    const {_id, name} = req.body
    const workspace = await Workspace.findById(workspaceId)
    const board = new Board({
        _id,
        name,
        workspace: workspace,
        attributes: [],
        taskGroups: [],
        sharing: false
    })
    workspace.spaces.find(x => x._id.toString() === spaceId).boards.push(board)
    await workspace.save()
    await board.save()
    res.send('OK')
}))

// edit board name
router.patch('/:boardId', isLoggedIn, hasWritePerms, wrapAsync(async (req,res) => {
    const {boardId} = req.params
    const {name, _id} = req.body
    const board = await Board.findById(boardId)

    if (name) board.name = name
    if (_id) board.groupBy = _id

    board.save()
    res.send('OK')
}))

// delete board
router.delete('/:workspaceId/:spaceId/:boardId', isLoggedIn, hasWritePerms, wrapAsync(async (req, res) => {
    const {workspaceId, spaceId, boardId} = req.params
    const workspace = await Workspace.findById(workspaceId)
    await Board.findByIdAndDelete(boardId)

    workspace.spaces.find(x => x._id.toString() === spaceId).boards.remove(boardId)

    await workspace.save()
    res.send('OK')
}))

module.exports = router
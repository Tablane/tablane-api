const Board = require("./models/board");
const Workspace = require("./models/workspace");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.user) {
        return res.status(403).send('Forbidden - logged in')
    } else next()
}

module.exports.hasBoardPerms = async (req, res, next) => {
    const {boardId} = req.params
    const board = await Board.findById(boardId).populate({
        path: 'workspace',
        model: 'Workspace',
        select: 'members'
    })

    const user = board.workspace.members.find(x => x.user.toString() === req.user._id.toString())
    if (user && (user.role === 'owner' || user.role === 'admin' || user.role === 'member')) {
        next()
    } else {
        res.status(403).send('Forbidden - no write perms b')
    }
}

module.exports.hasWorkspacePerms = async (req, res, next) => {
    const {workspaceId} = req.params
    let workspace
    if (workspaceId.length > 4) {
        workspace = await Workspace.findById(workspaceId)
    } else {
        workspace = await Workspace.findOne({id: workspaceId})
    }

    const user = workspace.members.find(x => x.user.toString() === req.user._id.toString())
    if (user && (user.role === 'owner' || user.role === 'admin' || user.role === 'member')) {
        next()
    } else {
        res.status(403).send('Forbidden - no write perms w')
    }
}

module.exports.wrapAsync = func => {
    return (req, res, next) => {
        func(req, res, next).catch(e => next(e))
    }
}
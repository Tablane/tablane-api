const Board = require('./models/board')
const Workspace = require('./models/workspace')

const wrapAsync = func => {
    return async (req, res, next) => {
        try {
            await func(req, res, next)
        } catch (e) {
            next(e)
        }
    }
}

const checkPerms = async req => {
    const { boardId, workspaceId } = req.params
    if (boardId) {
        const board = await Board.findById(boardId).populate({
            path: 'workspace',
            model: 'Workspace',
            select: 'members'
        })

        const user = board.workspace.members.find(
            x => x.user.toString() === req.user._id.toString()
        )
        return user.role
    } else if (workspaceId) {
        let workspace
        if (workspaceId.length > 4) {
            workspace = await Workspace.findById(workspaceId)
        } else {
            workspace = await Workspace.findOne({ id: workspaceId })
        }

        const user = workspace.members.find(
            x => x.user.toString() === req.user._id.toString()
        )
        return user.role
    }
}

module.exports.isLoggedIn = wrapAsync((req, res, next) => {
    if (!req.user) {
        return res.status(403).send('Forbidden - not logged in')
    } else next()
})

module.exports.hasAdminPerms = wrapAsync(async (req, res, next) => {
    const role = await checkPerms(req)
    if (role === 'owner' || role === 'admin') next()
    else res.status(403).send('Forbidden - no admin perms')
})

module.exports.hasWritePerms = wrapAsync(async (req, res, next) => {
    const role = await checkPerms(req)
    if (role === 'owner' || role === 'admin' || role === 'member') next()
    else res.status(403).send('Forbidden - no write perms')
})

module.exports.hasReadPerms = wrapAsync(async (req, res, next) => {
    const role = await checkPerms(req)
    if (
        role === 'owner' ||
        role === 'admin' ||
        role === 'member' ||
        role === 'guest'
    )
        next()
    else res.status(403).send('Forbidden - no read perms')
})

module.exports.wrapAsync = wrapAsync

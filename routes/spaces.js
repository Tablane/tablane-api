const router = require('express').Router()
const Workspace = require('../models/workspace')
const Space = require('../models/space')
const Board = require('../models/board')
const {
    wrapAsync,
    isLoggedIn,
    hasReadPerms,
    hasWritePerms
} = require('../middleware')

// create new space
router.post(
    '/:workspaceId',
    isLoggedIn,
    hasWritePerms,
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        const workspace = await Workspace.findById(workspaceId)
        const { name, _id } = req.body

        const space = new Space({ name, _id })
        workspace.spaces.push(space)

        const io = req.app.get('socketio')
        io.to(workspace.id.toString())
            .except(req.user._id.toString())
            .emit(workspace.id.toString(), {
                event: 'addSpace',
                id: workspace.id.toString(),
                body: { name, _id }
            })

        await space.save()
        await workspace.save()
        res.json({ success: true, message: 'OK' })
    })
)

// drag and drop space
router.patch(
    '/drag/:workspaceId',
    isLoggedIn,
    hasWritePerms,
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        const { result } = req.body

        const workspace = await Workspace.findById(workspaceId)

        const [space] = workspace.spaces.splice(result.source.index, 1)
        workspace.spaces.splice(result.destination.index, 0, space)

        const io = req.app.get('socketio')
        io.to(workspace.id.toString())
            .except(req.user._id.toString())
            .emit(workspace.id.toString(), {
                event: 'sortSpace',
                id: workspace.id.toString(),
                body: { result }
            })

        await workspace.save()
        res.json({ success: true, message: 'OK' })
    })
)

// edit space name
router.patch(
    '/:workspaceId/:spaceId',
    isLoggedIn,
    hasWritePerms,
    wrapAsync(async (req, res) => {
        const { workspaceId, spaceId } = req.params
        const { name } = req.body

        const workspace = await Workspace.findById(workspaceId).populate({
            path: 'spaces',
            select: 'name'
        })
        const space = workspace.spaces.find(x => x._id.toString() === spaceId)

        space.name = name

        const io = req.app.get('socketio')
        io.to(workspace.id.toString())
            .except(req.user._id.toString())
            .emit(workspace.id.toString(), {
                event: 'editSpaceName',
                id: workspace.id.toString(),
                body: { spaceId, name }
            })

        await space.save()
        res.json({ success: true, message: 'OK' })
    })
)

// delete a space
router.delete(
    '/:workspaceId/:spaceId',
    isLoggedIn,
    hasWritePerms,
    wrapAsync(async (req, res) => {
        const { workspaceId, spaceId } = req.params
        const workspace = await Workspace.findById(workspaceId)

        const spaceIndex = workspace.spaces.indexOf(
            workspace.spaces.find(x => x._id.toString() === spaceId)
        )
        await Board.deleteMany({
            _id: { $in: workspace.spaces[spaceIndex].boards }
        })
        workspace.spaces.splice(spaceIndex, 1)

        const io = req.app.get('socketio')
        io.to(workspace.id.toString())
            .except(req.user._id.toString())
            .emit(workspace.id.toString(), {
                event: 'deleteSpace',
                id: workspace.id.toString(),
                body: { spaceId }
            })

        await workspace.save()
        res.json({ success: true, message: 'OK' })
    })
)

module.exports = router

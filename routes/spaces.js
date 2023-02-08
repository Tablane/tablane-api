const router = require('express').Router()
const Workspace = require('../models/workspace')
const Space = require('../models/space')
const Board = require('../models/board')
const { wrapAsync, isLoggedIn, hasPermission } = require('../middleware')
const { pusherTrigger } = require('../utils/pusherTrigger')

// create new space
router.post(
    '/:workspaceId',
    isLoggedIn,
    hasPermission('MANAGE:SPACE'),
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        const workspace = await Workspace.findById(workspaceId)
        const { name, _id } = req.body

        const space = new Space({ name, _id })
        workspace.spaces.push(space)

        pusherTrigger({
            req,
            workspaceId: workspace.id,
            event: 'addSpace',
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
    hasPermission('MANAGE:SPACE'),
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        const { result } = req.body

        const workspace = await Workspace.findById(workspaceId)

        const [space] = workspace.spaces.splice(result.source.index, 1)
        workspace.spaces.splice(result.destination.index, 0, space)

        pusherTrigger({
            req,
            workspaceId: workspace.id,
            event: 'sortSpace',
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
    hasPermission('MANAGE:SPACE'),
    wrapAsync(async (req, res) => {
        const { workspaceId, spaceId } = req.params
        const { name } = req.body

        const workspace = await Workspace.findById(workspaceId).populate({
            path: 'spaces',
            select: 'name'
        })
        const space = workspace.spaces.find(x => x._id.toString() === spaceId)

        space.name = name

        pusherTrigger({
            req,
            workspaceId: workspace.id,
            event: 'editSpaceName',
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
    hasPermission('MANAGE:SPACE'),
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

        pusherTrigger({
            req,
            workspaceId: workspace.id,
            event: 'deleteSpace',
            body: { spaceId }
        })

        await workspace.save()
        res.json({ success: true, message: 'OK' })
    })
)

module.exports = router

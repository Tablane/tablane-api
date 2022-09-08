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

        await space.save()
        await workspace.save()
        res.send('OK')
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

        workspace.save()
        res.send('OK')
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

        const workspace = await Workspace.findById(workspaceId)
        const space = workspace.spaces.find(x => x._id.toString() === spaceId)

        space.name = name

        workspace.save()
        res.send('OK')
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

        await workspace.save()
        res.send('OK')
    })
)

module.exports = router

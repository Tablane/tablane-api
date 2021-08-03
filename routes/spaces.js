const router = require('express').Router()
const Workspace = require('../models/workspace')
const Space = require('../models/space')
const {wrapAsync, isLoggedIn, hasWorkspacePerms} = require("../middleware");

router.post('/:workspaceId', isLoggedIn, hasWorkspacePerms, async (req, res) => {
    const { workspaceId } = req.params
    const workspace = await Workspace.findById(workspaceId)
    const space = new Space({ name: req.body.name })

    workspace.spaces.push(space)

    await workspace.save()
    res.send('OK')
})

router.patch('/:workspaceId', isLoggedIn, hasWorkspacePerms, async (req, res) => {
    const {workspaceId} = req.params
    const {result} = req.body

    const workspace = await Workspace.findById(workspaceId)

    const [space] = workspace.spaces.splice(result.source.index, 1)
    workspace.spaces.splice(result.destination.index, 0, space)

    workspace.save()
    res.send('OK')
})

router.delete('/:workspaceId/:spaceId', isLoggedIn, hasWorkspacePerms, async (req, res) => {
    const { workspaceId, spaceId } = req.params
    const workspace = await Workspace.findById(workspaceId)

    const spaceIndex = workspace.spaces.indexOf(workspace.spaces.find(x => x._id.toString() === spaceId))
    workspace.spaces.splice(spaceIndex, 1)

    await workspace.save()
    res.send('OK')
})

module.exports = router
const router = require('express').Router()
const Workspace = require('../models/workspace')
const {wrapAsync, isLoggedIn, hasWorkspacePerms} = require("../middleware");

// router.get('/new', (req, res) => {
//     let id = ''
//     while (id.length < 4) {
//         id += Math.floor(Math.random() * 10)
//     }
//     res.send(id)
// })

router.get('/:workspaceId', isLoggedIn, hasWorkspacePerms, wrapAsync(async (req, res) => {
    const { workspaceId } = req.params
    const workspace = await Workspace.findOne({ id: workspaceId }).populate({
        path: 'spaces.boards',
        model: 'Board',
        select: 'name'
    })
    res.json(workspace)
}))

module.exports = router
const router = require('express').Router()
const Workspace = require('../models/workspace')
const {wrapAsync, isLoggedIn} = require("../middleware");

// router.get('/new', (req, res) => {
//     let id = ''
//     for (let i = 0; i < 4; i++) {
//         id += Math.floor(Math.random() * 10)
//     }
//     res.send(id)
// })

router.get('/:workspaceId', isLoggedIn, wrapAsync(async (req, res) => {
    const { workspaceId } = req.params
    const workspace = await Workspace.findOne({ id: workspaceId }).populate({
        path: 'spaces.boards',
        model: 'Board',
        select: 'name'
    })
    res.json(workspace)
}))

module.exports = router
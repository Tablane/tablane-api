const router = require('express').Router()
const Workspace = require('../models/workspace')
const Space = require('../models/space')
const Board = require('../models/board')
const Role = require('../models/role')
const { wrapAsync, isLoggedIn, hasPermission } = require('../middleware')

// create new role
router.post(
    '/:workspaceId',
    isLoggedIn,
    hasPermission('MANAGE:USER'),
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        const { name, _id } = req.body
        const workspace = await Workspace.findById(workspaceId)

        const role = new Role({
            _id,
            name,
            permissions: []
        })
        workspace.roles.push(role)

        // const io = req.app.get('socketio')
        // io.to(workspace.id.toString())
        //     .except(req.user._id.toString())
        //     .emit(workspace.id.toString(), {
        //         event: 'addRole',
        //         id: workspace.id.toString(),
        //         body: { name, _id }
        //     })

        await role.save()
        await workspace.save()
        res.json({ success: true, message: 'OK' })
    })
)

// drag and drop role
router.patch(
    '/drag/:workspaceId',
    isLoggedIn,
    hasPermission('MANAGE:USER'),
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        const { result } = req.body

        const workspace = await Workspace.findById(workspaceId)

        const [role] = workspace.roles.splice(result.source.index, 1)
        workspace.roles.splice(result.destination.index, 0, role)

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

// edit role name
router.patch(
    '/:workspaceId/:roleId',
    isLoggedIn,
    hasPermission('MANAGE:USER'),
    wrapAsync(async (req, res) => {
        const { workspaceId, roleId } = req.params
        const { name } = req.body

        const workspace = await Workspace.findById(workspaceId).populate({
            path: 'roles',
            select: 'name'
        })
        const role = workspace.roles.find(x => x._id.toString() === roleId)

        role.name = name

        // const io = req.app.get('socketio')
        // io.to(workspace.id.toString())
        //     .except(req.user._id.toString())
        //     .emit(workspace.id.toString(), {
        //         event: 'editSpaceName',
        //         id: workspace.id.toString(),
        //         body: { spaceId, name }
        //     })

        await role.save()
        res.json({ success: true, message: 'OK' })
    })
)

// delete a role
router.delete(
    '/:workspaceId/:roleId',
    isLoggedIn,
    hasPermission('MANAGE:USER'),
    wrapAsync(async (req, res) => {
        const { workspaceId, roleId } = req.params
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

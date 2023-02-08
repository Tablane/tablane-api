const router = require('express').Router()
const Workspace = require('../models/workspace')
const Board = require('../models/board')
const Role = require('../models/role')
const { wrapAsync, isLoggedIn, hasPermission } = require('../middleware')
const AppError = require('../HttpError')
const { pusherTrigger } = require('../utils/pusherTrigger')

// create new role
router.post(
    '/:workspaceId',
    isLoggedIn,
    hasPermission('MANAGE:USER'),
    wrapAsync(async (req, res) => {
        throw new AppError('This route is not available in production', 400)
        const { workspaceId } = req.params
        const { name, _id } = req.body
        const workspace = await Workspace.findById(workspaceId)

        const role = new Role({
            _id,
            name,
            permissions: []
        })
        workspace.roles.push(role)

        pusherTrigger({
            req,
            workspaceId: workspace.id,
            event: 'addRole',
            body: { name, _id }
        })

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

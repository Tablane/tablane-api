const router = require('express').Router()
const Workspace = require('../models/workspace')
const User = require('../models/user')
const {
    wrapAsync,
    isLoggedIn,
    hasPermission,
    hasPerms
} = require('../middleware')
const PermissionError = require('../PermissionError')
const AppError = require('../HttpError')
const Role = require('../models/role')

// create a new workspace
router.post(
    '/',
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const user = await User.findById(req.user._id)
        const { name } = req.body

        let id = ''
        while (true) {
            while (id.length < 4) id += Math.floor(Math.random() * 10)

            // check for duplicate
            const workspace = await Workspace.findOne({ id: id })

            if (workspace) id = ''
            else break
        }

        const adminRole = new Role({
            name: 'Admin',
            permissions: [
                'READ:PUBLIC',
                'CREATE:TASK',
                'DELETE:TASK',
                'MANAGE:COLUMN_VALUE',
                'MANAGE:BOARD',
                'MANAGE:SPACE',
                'MANAGE:COLUMN',
                'MANAGE:MEMBER',
                'MANAGE:WORKSPACE',
                'MANAGE:TASK',
                'CREATE:COMMENT',
                'MANAGE:SHARING',
                'MANAGE:VIEW'
            ]
        })

        const memberRole = new Role({
            name: 'Member',
            permissions: [
                'READ:PUBLIC',
                'CREATE:TASK',
                'CREATE:COMMENT',
                'MANAGE:TASK'
            ]
        })

        const guestRole = new Role({
            name: 'Guest',
            permissions: ['READ:PUBLIC']
        })

        const workspace = new Workspace({
            id: id,
            spaces: [],
            name: name,
            roles: [adminRole, memberRole, guestRole],
            members: [
                {
                    labels: [],
                    user: req.user._id,
                    isOwner: true
                }
            ]
        })

        user.workspaces.push(workspace)

        await user.save()
        await workspace.save()
        await adminRole.save()
        await memberRole.save()
        await guestRole.save()
        res.json({ success: true, id })
    })
)

// get workspace data
router.get(
    '/:workspaceId',
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        const workspace = await Workspace.findOne({ id: workspaceId })
            .populate({
                path: 'spaces',
                model: 'Space',
                select: ['name', 'boards'],
                populate: {
                    path: 'boards',
                    model: 'Board',
                    select: 'name',
                    populate: {
                        path: 'views',
                        select: 'id'
                    }
                }
            })
            .populate({
                path: 'members.user',
                model: 'User',
                select: ['_id', 'username', 'email']
            })
            .populate({ path: 'roles' })
            .populate({ path: 'members.role', select: 'name' })

        // check perms
        const localWorkspace = await Workspace.findOne({
            id: workspaceId
        }).populate(['roles', 'members.role'])
        if (!hasPerms(localWorkspace, req.user, 'READ:PUBLIC'))
            throw new PermissionError('READ:PUBLIC')

        res.json(workspace)
    })
)

// change workspace name
router.patch(
    '/:workspaceId',
    isLoggedIn,
    hasPermission('MANAGE:WORKSPACE'),
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        const { name } = req.body
        const workspace = await Workspace.findById(workspaceId)

        workspace.name = name
        workspace.save()

        res.json({ success: true, message: 'OK' })
    })
)

// delete workspace
router.delete(
    '/:workspaceId',
    isLoggedIn,
    hasPermission('MANAGE:IS_WORKSPACE_OWNER'),
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params

        await Workspace.findByIdAndDelete(workspaceId)

        res.json({ success: true, message: 'OK' })
    })
)

// invite user to workspace
router.post(
    '/user/:workspaceId',
    isLoggedIn,
    hasPermission('MANAGE:USER'),
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        const { email, roleId } = req.body
        const workspace = await Workspace.findById(workspaceId)
        const user = await User.findOne({ email })

        if (!user)
            throw new AppError('User does not exist', 400, {
                friendlyError: true
            })
        if (user.workspaces.includes(workspaceId))
            throw new AppError('User already invited', 400, {
                friendlyError: true
            })

        workspace.members.push({
            user: user,
            role: roleId,
            labels: []
        })
        user.workspaces.push(workspace)

        await user.save()
        await workspace.save()
        res.json({ success: true, message: 'OK' })
    })
)

// remove a user from a workspace
router.delete(
    '/user/:workspaceId/:userId',
    isLoggedIn,
    hasPermission('MANAGE:USER'),
    wrapAsync(async (req, res) => {
        const { workspaceId, userId } = req.params
        const workspace = await Workspace.findById(workspaceId)
        const user = await User.findById(userId)

        if (!user)
            throw new AppError('User does not exist', 422, {
                friendlyError: true
            })

        const memberIndex = workspace.members.findIndex(
            x => x.user._id.toString() === userId
        )
        const workspaceIndex = user.workspaces.findIndex(
            x => x._id.toString() === workspaceId
        )

        if (workspace.members[memberIndex].role === 'owner')
            throw new AppError('Forbidden', 403)

        if (memberIndex > -1) {
            workspace.members.splice(memberIndex, 1)
        }
        if (workspaceIndex > -1) {
            user.workspaces.splice(workspaceIndex, 1)
        }

        user.save()
        workspace.save()
        res.json({ success: true, message: 'OK' })
    })
)

// change role of user
router.patch(
    '/user/:workspaceId/:userId',
    isLoggedIn,
    hasPermission('MANAGE:USER'),
    wrapAsync(async (req, res) => {
        const { workspaceId, userId } = req.params
        const { role } = req.body
        const workspace = await Workspace.findById(workspaceId)

        const user = workspace.members.find(x => x.user.toString() === userId)
        if (role === 'owner' || user.role === 'owner')
            throw new AppError('Forbidden', 403)
        workspace.members.find(x => x.user.toString() === userId).role =
            role.toLowerCase()

        await workspace.save()
        res.json({ success: true, message: 'OK' })
    })
)

// change permission for roles
router.patch(
    '/permission/:workspaceId/:roleId',
    isLoggedIn,
    hasPermission('MANAGE:USER'),
    wrapAsync(async (req, res) => {
        const { workspaceId, roleId } = req.params
        const { key } = req.body
        const workspace = await Workspace.findById(workspaceId).populate(
            'roles'
        )

        const role = workspace.roles.find(x => x._id.toString() === roleId)
        if (role.permissions.includes(key)) {
            role.permissions = role.permissions.filter(x => x !== key)
        } else role.permissions.push(key)

        await role.save()
        res.json({ success: true, message: 'OK' })
    })
)

module.exports = router

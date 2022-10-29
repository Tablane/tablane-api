const router = require('express').Router()
const Workspace = require('../models/workspace')
const User = require('../models/user')
const {
    wrapAsync,
    isLoggedIn,
    hasAdminPerms,
    hasPermission
} = require('../middleware')

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

        const workspace = new Workspace({
            id: id,
            spaces: [],
            name: name,
            members: [
                {
                    labels: [],
                    user: req.user._id,
                    role: 'owner'
                }
            ]
        })

        user.workspaces.push(workspace)

        await user.save()
        await workspace.save()
        res.json({ success: true, id })
    })
)

// get workspace data
router.get(
    '/:workspaceId',
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        let workspace = await Workspace.findOne({ id: workspaceId })
            .populate({
                path: 'spaces',
                model: 'Space',
                select: ['name', 'boards'],
                populate: {
                    path: 'boards',
                    model: 'Board',
                    select: 'name'
                }
            })
            .populate({
                path: 'members.user',
                model: 'User',
                select: ['_id', 'username', 'email']
            })
            .populate({ path: 'roles' })
            .populate({ path: 'members.role', select: 'name' })

        res.json(workspace)
    })
)

// change workspace name
router.patch(
    '/:workspaceId',
    isLoggedIn,
    hasAdminPerms,
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
    hasPermission('MANAGE:USER'),
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
        const { email, role } = req.body
        const workspace = await Workspace.findById(workspaceId)
        const user = await User.findOne({ email })

        if (!user)
            return res.status(400).json({
                success: false,
                message: 'User does not exist'
            })
        if (user.workspaces.includes(workspaceId))
            return res.status(400).json({
                success: false,
                message: 'User already invited'
            })

        workspace.members.push({
            user: user,
            role: role.toLowerCase(),
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
            return res.status(422).json({
                success: false,
                message: 'User does not exist'
            })

        const memberIndex = workspace.members.findIndex(
            x => x.user._id.toString() === userId
        )
        const workspaceIndex = user.workspaces.findIndex(
            x => x._id.toString() === workspaceId
        )

        if (workspace.members[memberIndex].role === 'owner')
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            })

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
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            })
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

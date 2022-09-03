const router = require('express').Router()
const Workspace = require('../models/workspace')
const User = require('../models/user')
const {
    wrapAsync,
    isLoggedIn,
    hasWorkspacePerms,
    hasReadPerms,
    hasAdminPerms
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
    hasReadPerms,
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        let workspace = await Workspace.findOne({ id: workspaceId })
            .populate({
                path: 'spaces.boards',
                model: 'Board',
                select: 'name'
            })
            .populate({
                path: 'members.user',
                model: 'User',
                select: ['_id', 'username', 'email']
            })

        // only send workspace members to admins
        const role = workspace.members.find(
            x => x.user._id.toString() === req.user._id.toString()
        ).role
        if (role !== 'owner' && role !== 'admin') workspace.members = undefined

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

        res.send('OK')
    })
)

// delete workspace
router.delete(
    '/:workspaceId',
    isLoggedIn,
    hasAdminPerms,
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params

        await Workspace.findByIdAndDelete(workspaceId)

        res.send('OK')
    })
)

// invite user to workspace
router.post(
    '/user/:workspaceId',
    isLoggedIn,
    hasAdminPerms,
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        const { email, role } = req.body
        const workspace = await Workspace.findById(workspaceId)
        const user = await User.findOne({ email })

        if (!user) return res.status(422).json({ error: 'User does not exist' })
        if (user.workspaces.includes(workspaceId))
            return res.status(409).json({ error: 'User already invited' })

        workspace.members.push({
            user: user,
            role: role.toLowerCase(),
            labels: []
        })
        user.workspaces.push(workspace)

        user.save()
        workspace.save()
        res.send('OK')
    })
)

// remove a user from a workspace
router.delete(
    '/user/:workspaceId/:userId',
    isLoggedIn,
    hasAdminPerms,
    wrapAsync(async (req, res) => {
        const { workspaceId, userId } = req.params
        const workspace = await Workspace.findById(workspaceId)
        const user = await User.findById(userId)

        if (!user) return res.status(422).json({ error: 'User does not exist' })

        const memberIndex = workspace.members.findIndex(
            x => x.user._id.toString() === userId
        )
        const workspaceIndex = user.workspaces.findIndex(
            x => x._id.toString() === workspaceId
        )

        if (workspace.members[memberIndex].role === 'owner')
            return res.status(403).send('Forbidden')

        if (memberIndex > -1) {
            workspace.members.splice(memberIndex, 1)
        }
        if (workspaceIndex > -1) {
            user.workspaces.splice(workspaceIndex, 1)
        }

        user.save()
        workspace.save()
        res.send('OK')
    })
)

// change role of user
router.patch(
    '/user/:workspaceId/:userId',
    isLoggedIn,
    hasAdminPerms,
    wrapAsync(async (req, res) => {
        const { workspaceId, userId } = req.params
        const { role } = req.body
        const workspace = await Workspace.findById(workspaceId)

        const user = workspace.members.find(x => x.user.toString() === userId)
        if (role === 'owner' || user.role === 'owner')
            return res.status(403).send('Forbidden')
        workspace.members.find(x => x.user.toString() === userId).role =
            role.toLowerCase()

        workspace.save()
        res.send('OK')
    })
)

module.exports = router

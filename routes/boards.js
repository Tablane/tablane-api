const router = require('express').Router()
const Board = require('../models/board')
const Workspace = require('../models/workspace')
const Space = require('../models/space')
const {
    wrapAsync,
    isLoggedIn,
    hasPermission,
    hasPerms
} = require('../middleware')
const PermissionError = require('../PermissionError')

// get board info
router.get(
    '/:boardId',
    isLoggedIn,
    hasPermission('READ:PUBLIC'),
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const board = await Board.findById(boardId).populate({
            path: 'tasks',
            populate: [
                {
                    path: 'watcher',
                    select: 'username'
                },
                {
                    path: 'history'
                },
                {
                    path: 'comments',
                    populate: 'replies'
                },
                {
                    path: 'subtasks',
                    populate: [
                        {
                            path: 'subtasks',
                            populate: [
                                {
                                    path: 'subtasks',
                                    populate: [
                                        {
                                            path: 'subtasks',
                                            populate: [
                                                {
                                                    path: 'subtasks',
                                                    populate: [
                                                        {
                                                            path: 'subtasks',
                                                            populate: [
                                                                {
                                                                    path: 'subtasks',
                                                                    populate: [
                                                                        {
                                                                            path: 'subtasks',
                                                                            populate:
                                                                                [
                                                                                    {
                                                                                        path: 'watcher',
                                                                                        select: 'username'
                                                                                    },
                                                                                    {
                                                                                        path: 'history'
                                                                                    },
                                                                                    {
                                                                                        path: 'comments',
                                                                                        populate:
                                                                                            'replies'
                                                                                    }
                                                                                ]
                                                                        },
                                                                        {
                                                                            path: 'watcher',
                                                                            select: 'username'
                                                                        },
                                                                        {
                                                                            path: 'history'
                                                                        },
                                                                        {
                                                                            path: 'comments',
                                                                            populate:
                                                                                'replies'
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    path: 'watcher',
                                                                    select: 'username'
                                                                },
                                                                {
                                                                    path: 'history'
                                                                },
                                                                {
                                                                    path: 'comments',
                                                                    populate:
                                                                        'replies'
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            path: 'watcher',
                                                            select: 'username'
                                                        },
                                                        {
                                                            path: 'history'
                                                        },
                                                        {
                                                            path: 'comments',
                                                            populate: 'replies'
                                                        }
                                                    ]
                                                },
                                                {
                                                    path: 'watcher',
                                                    select: 'username'
                                                },
                                                {
                                                    path: 'history'
                                                },
                                                {
                                                    path: 'comments',
                                                    populate: 'replies'
                                                }
                                            ]
                                        },
                                        {
                                            path: 'watcher',
                                            select: 'username'
                                        },
                                        {
                                            path: 'history'
                                        },
                                        {
                                            path: 'comments',
                                            populate: 'replies'
                                        }
                                    ]
                                },
                                {
                                    path: 'watcher',
                                    select: 'username'
                                },
                                {
                                    path: 'history'
                                },
                                {
                                    path: 'comments',
                                    populate: 'replies'
                                }
                            ]
                        },
                        {
                            path: 'watcher',
                            select: 'username'
                        },
                        {
                            path: 'history'
                        },
                        {
                            path: 'comments',
                            populate: 'replies'
                        }
                    ]
                }
            ]
        })

        res.json(board)
    })
)

// get shared board info
router.get(
    '/share/:boardId',
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const board = await Board.findById(boardId).populate({
            path: 'tasks',
            populate: [
                {
                    path: 'watcher',
                    select: 'username'
                },
                {
                    path: 'history'
                },
                {
                    path: 'comments',
                    populate: 'replies'
                },
                {
                    path: 'subtasks',
                    populate: [
                        {
                            path: 'subtasks',
                            populate: [
                                {
                                    path: 'subtasks',
                                    populate: [
                                        {
                                            path: 'subtasks',
                                            populate: [
                                                {
                                                    path: 'subtasks',
                                                    populate: [
                                                        {
                                                            path: 'subtasks',
                                                            populate: [
                                                                {
                                                                    path: 'subtasks',
                                                                    populate: [
                                                                        {
                                                                            path: 'subtasks',
                                                                            populate:
                                                                                [
                                                                                    {
                                                                                        path: 'watcher',
                                                                                        select: 'username'
                                                                                    },
                                                                                    {
                                                                                        path: 'history'
                                                                                    },
                                                                                    {
                                                                                        path: 'comments',
                                                                                        populate:
                                                                                            'replies'
                                                                                    }
                                                                                ]
                                                                        },
                                                                        {
                                                                            path: 'watcher',
                                                                            select: 'username'
                                                                        },
                                                                        {
                                                                            path: 'history'
                                                                        },
                                                                        {
                                                                            path: 'comments',
                                                                            populate:
                                                                                'replies'
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    path: 'watcher',
                                                                    select: 'username'
                                                                },
                                                                {
                                                                    path: 'history'
                                                                },
                                                                {
                                                                    path: 'comments',
                                                                    populate:
                                                                        'replies'
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            path: 'watcher',
                                                            select: 'username'
                                                        },
                                                        {
                                                            path: 'history'
                                                        },
                                                        {
                                                            path: 'comments',
                                                            populate: 'replies'
                                                        }
                                                    ]
                                                },
                                                {
                                                    path: 'watcher',
                                                    select: 'username'
                                                },
                                                {
                                                    path: 'history'
                                                },
                                                {
                                                    path: 'comments',
                                                    populate: 'replies'
                                                }
                                            ]
                                        },
                                        {
                                            path: 'watcher',
                                            select: 'username'
                                        },
                                        {
                                            path: 'history'
                                        },
                                        {
                                            path: 'comments',
                                            populate: 'replies'
                                        }
                                    ]
                                },
                                {
                                    path: 'watcher',
                                    select: 'username'
                                },
                                {
                                    path: 'history'
                                },
                                {
                                    path: 'comments',
                                    populate: 'replies'
                                }
                            ]
                        },
                        {
                            path: 'watcher',
                            select: 'username'
                        },
                        {
                            path: 'history'
                        },
                        {
                            path: 'comments',
                            populate: 'replies'
                        }
                    ]
                }
            ]
        })

        if (!board.sharing) return res.status(403).send('Forbidden')
        res.json(board)
    })
)

// change share state
router.patch(
    '/share/:boardId',
    isLoggedIn,
    hasPermission('MANAGE:SHARING'),
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const { share } = req.body

        const board = await Board.findById(boardId)
        board.sharing = share

        const io = req.app.get('socketio')
        io.to(boardId).except(req.user._id.toString()).emit(boardId, {
            event: 'setSharing',
            id: boardId,
            body: {
                share
            }
        })

        await board.save()
        res.json({ success: true, message: boardId })
    })
)

// drag and drop sorting
router.patch(
    '/drag/:workspaceId',
    isLoggedIn,
    hasPermission('MANAGE:BOARD'),
    wrapAsync(async (req, res) => {
        const { workspaceId } = req.params
        const { result } = req.body
        const workspace = await Workspace.findById(workspaceId).populate(
            'spaces'
        )

        const source = workspace.spaces.find(
            x => x._id.toString() === result.source.droppableId
        )
        const destination = workspace.spaces.find(
            x => x._id.toString() === result.destination.droppableId
        )

        const [board] = source.boards.splice(result.source.index, 1)
        if (board) destination.boards.splice(result.destination.index, 0, board)

        const io = req.app.get('socketio')
        io.to(workspace.id.toString())
            .except(req.user._id.toString())
            .emit(workspace.id.toString(), {
                event: 'sortBoard',
                id: workspace.id,
                body: { result }
            })

        await source.save()
        await destination.save()
        res.json({ success: true, message: 'OK' })
    })
)

// create new board
router.post(
    '/:workspaceId/:spaceId',
    isLoggedIn,
    hasPermission('MANAGE:BOARD'),
    wrapAsync(async (req, res) => {
        const { workspaceId, spaceId } = req.params
        const { _id, name } = req.body
        const workspace = await Workspace.findById(workspaceId).populate(
            'spaces'
        )
        const space = workspace.spaces.find(x => x._id.toString() === spaceId)

        const board = new Board({
            _id,
            name,
            workspace,
            space: spaceId,
            attributes: [],
            taskGroups: [],
            sharing: false
        })
        space.boards.push(board)

        const io = req.app.get('socketio')
        io.to(workspace.id.toString())
            .except(req.user._id.toString())
            .emit(workspace.id.toString(), {
                event: 'addBoard',
                id: workspace.id,
                body: { spaceId, name, _id }
            })

        await space.save()
        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

// change board properties
router.patch(
    '/:boardId',
    isLoggedIn,
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const { name, groupBy } = req.body
        const board = await Board.findById(boardId).populate({
            path: 'workspace',
            populate: ['roles', 'members.role']
        })

        if (name) {
            if (!hasPerms(board.workspace, req.user, 'MANAGE:SHARING'))
                throw new PermissionError('MANAGE:SHARING')
            board.name = name

            const io = req.app.get('socketio')
            io.to(board.workspace.id.toString())
                .except(req.user._id.toString())
                .emit(board.workspace.id.toString(), {
                    event: 'editBoardName',
                    id: board.workspace.id.toString(),
                    body: { spaceId: board.space, boardId, name }
                })
        }
        if (groupBy) {
            if (!hasPerms(board.workspace, req.user, 'MANAGE:VIEW'))
                throw new PermissionError('MANAGE:VIEW')
            board.groupBy = groupBy

            const io = req.app.get('socketio')
            io.to(boardId).except(req.user._id.toString()).emit(boardId, {
                event: 'setGroupBy',
                id: boardId,
                body: { groupBy }
            })
        }

        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

// delete board
router.delete(
    '/:workspaceId/:spaceId/:boardId',
    isLoggedIn,
    hasPermission('MANAGE:BOARD'),
    wrapAsync(async (req, res) => {
        const { spaceId, boardId } = req.params
        const space = await Space.findById(spaceId)
        const board = await Board.findByIdAndDelete(boardId).populate({
            path: 'workspace',
            select: 'id'
        })

        space.boards.remove(boardId)

        const io = req.app.get('socketio')
        io.to(board.workspace.id.toString())
            .except(req.user._id.toString())
            .emit(board.workspace.id.toString(), {
                event: 'deleteBoard',
                id: board.workspace.id.toString(),
                body: { spaceId, boardId }
            })

        await space.save()
        res.json({ success: true, message: 'OK' })
    })
)

module.exports = router

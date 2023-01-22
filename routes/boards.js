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

const removeEmptyArrays = obj => {
    for (const key in obj) {
        if (Array.isArray(obj[key]) && obj[key].length === 0) {
            delete obj[key]
        } else if (typeof obj[key] === 'object') {
            obj[key] = removeEmptyArrays(obj[key])
        }
    }
    return obj
}

const transformFilters = filters => {
    let transformedFilters = { $or: [] }
    let currentGroup = { $and: [] }
    if (
        !filters ||
        !filters.every(({ column, operation, value }) => {
            return (
                column &&
                operation &&
                (value || ['Is set', 'Is not set'].includes(operation))
            )
        })
    ) {
        return {}
    }

    filters.map(({ column, filterAnd, operation, value }, index) => {
        let condition
        if (operation === 'Is not set') {
            condition = {
                'options.column': {
                    $ne: column._id
                }
            }
        } else if (operation === 'Is set') {
            condition = { [column._id]: { $exists: true } }
            condition = {
                $and: [
                    {
                        'options.column': column._id
                    }
                ]
            }
        } else if (operation === 'Is') {
            condition = {
                $and: [
                    {
                        'options.column': column._id
                    },
                    {
                        'options.value': value._id
                    }
                ]
            }
        } else if (operation === 'Is not') {
            condition = {
                $or: [
                    {
                        $and: [
                            {
                                'options.column': column._id
                            },
                            {
                                'options.value': {
                                    $ne: value?._id
                                }
                            }
                        ]
                    },
                    {
                        'options.column': {
                            $ne: column._id
                        }
                    }
                ]
            }
        }

        if (!filterAnd && index !== 0) {
            transformedFilters.$or.push(currentGroup)
            currentGroup = { $and: [] }
        }
        currentGroup.$and.push(condition)
    })

    transformedFilters.$or.push(currentGroup)
    return removeEmptyArrays(transformedFilters)
}

// get board info
router.get(
    '/:boardId',
    isLoggedIn,
    hasPermission('READ:PUBLIC'),
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const filters = (await Board.findById(boardId)).filters
        const board = await Board.findById(boardId).populate({
            path: 'tasks',
            match: transformFilters(filters),
            populate: [
                {
                    path: 'watcher',
                    select: 'username'
                },
                {
                    path: 'history',
                    populate: {
                        path: 'author',
                        select: 'username'
                    }
                },
                {
                    path: 'comments',
                    populate: [
                        {
                            path: 'author',
                            select: 'username'
                        },
                        {
                            path: 'replies',
                            populate: {
                                path: 'author',
                                select: 'username'
                            }
                        }
                    ]
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
                                                                                        path: 'history',
                                                                                        populate:
                                                                                            {
                                                                                                path: 'author',
                                                                                                select: 'username'
                                                                                            }
                                                                                    },
                                                                                    {
                                                                                        path: 'comments',
                                                                                        populate:
                                                                                            [
                                                                                                {
                                                                                                    path: 'author',
                                                                                                    select: 'username'
                                                                                                },
                                                                                                {
                                                                                                    path: 'replies',
                                                                                                    populate:
                                                                                                        {
                                                                                                            path: 'author',
                                                                                                            select: 'username'
                                                                                                        }
                                                                                                }
                                                                                            ]
                                                                                    }
                                                                                ]
                                                                        },
                                                                        {
                                                                            path: 'watcher',
                                                                            select: 'username'
                                                                        },
                                                                        {
                                                                            path: 'history',
                                                                            populate:
                                                                                {
                                                                                    path: 'author',
                                                                                    select: 'username'
                                                                                }
                                                                        },
                                                                        {
                                                                            path: 'comments',
                                                                            populate:
                                                                                [
                                                                                    {
                                                                                        path: 'author',
                                                                                        select: 'username'
                                                                                    },
                                                                                    {
                                                                                        path: 'replies',
                                                                                        populate:
                                                                                            {
                                                                                                path: 'author',
                                                                                                select: 'username'
                                                                                            }
                                                                                    }
                                                                                ]
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    path: 'watcher',
                                                                    select: 'username'
                                                                },
                                                                {
                                                                    path: 'history',
                                                                    populate: {
                                                                        path: 'author',
                                                                        select: 'username'
                                                                    }
                                                                },
                                                                {
                                                                    path: 'comments',
                                                                    populate: [
                                                                        {
                                                                            path: 'author',
                                                                            select: 'username'
                                                                        },
                                                                        {
                                                                            path: 'replies',
                                                                            populate:
                                                                                {
                                                                                    path: 'author',
                                                                                    select: 'username'
                                                                                }
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            path: 'watcher',
                                                            select: 'username'
                                                        },
                                                        {
                                                            path: 'history',
                                                            populate: {
                                                                path: 'author',
                                                                select: 'username'
                                                            }
                                                        },
                                                        {
                                                            path: 'comments',
                                                            populate: [
                                                                {
                                                                    path: 'author',
                                                                    select: 'username'
                                                                },
                                                                {
                                                                    path: 'replies',
                                                                    populate: {
                                                                        path: 'author',
                                                                        select: 'username'
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    path: 'watcher',
                                                    select: 'username'
                                                },
                                                {
                                                    path: 'history',
                                                    populate: {
                                                        path: 'author',
                                                        select: 'username'
                                                    }
                                                },
                                                {
                                                    path: 'comments',
                                                    populate: [
                                                        {
                                                            path: 'author',
                                                            select: 'username'
                                                        },
                                                        {
                                                            path: 'replies',
                                                            populate: {
                                                                path: 'author',
                                                                select: 'username'
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            path: 'watcher',
                                            select: 'username'
                                        },
                                        {
                                            path: 'history',
                                            populate: {
                                                path: 'author',
                                                select: 'username'
                                            }
                                        },
                                        {
                                            path: 'comments',
                                            populate: [
                                                {
                                                    path: 'author',
                                                    select: 'username'
                                                },
                                                {
                                                    path: 'replies',
                                                    populate: {
                                                        path: 'author',
                                                        select: 'username'
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    path: 'watcher',
                                    select: 'username'
                                },
                                {
                                    path: 'history',
                                    populate: {
                                        path: 'author',
                                        select: 'username'
                                    }
                                },
                                {
                                    path: 'comments',
                                    populate: [
                                        {
                                            path: 'author',
                                            select: 'username'
                                        },
                                        {
                                            path: 'replies',
                                            populate: {
                                                path: 'author',
                                                select: 'username'
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            path: 'watcher',
                            select: 'username'
                        },
                        {
                            path: 'history',
                            populate: {
                                path: 'author',
                                select: 'username'
                            }
                        },
                        {
                            path: 'comments',
                            populate: [
                                {
                                    path: 'author',
                                    select: 'username'
                                },
                                {
                                    path: 'replies',
                                    populate: {
                                        path: 'author',
                                        select: 'username'
                                    }
                                }
                            ]
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
        const board = await Board.findById(boardId).populate([
            {
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
                                                                        populate:
                                                                            [
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
                    }
                ]
            },
            {
                path: 'workspace',
                select: 'members.user',
                populate: {
                    path: 'members.user',
                    select: 'username'
                }
            }
        ])

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

// set board filters
router.put(
    '/:boardId',
    isLoggedIn,
    hasPermission('MANAGE:VIEW'),
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const { filters } = req.body
        const board = await Board.findById(boardId)

        board.filters = filters

        // const io = req.app.get('socketio')
        // io.to(board.workspace.id.toString())
        //     .except(req.user._id.toString())
        //     .emit(board.workspace.id.toString(), {
        //         event: 'deleteBoard',
        //         id: board.workspace.id.toString(),
        //         body: { spaceId, boardId }
        //     })

        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

module.exports = router

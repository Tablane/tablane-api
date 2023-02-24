const router = require('express').Router()
const Board = require('../models/board')
const Workspace = require('../models/workspace')
const Space = require('../models/space')
const View = require('../models/view')
const {
    wrapAsync,
    isLoggedIn,
    hasPermission,
    hasPerms
} = require('../middleware')
const PermissionError = require('../PermissionError')
const { pusherTrigger } = require('../utils/pusherTrigger')

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

    filters.map(({ column, filterAnd, operation, value, type }, index) => {
        let condition
        if (operation === 'Is not set') {
            condition = {
                $or: [
                    {
                        options: {
                            $not: {
                                $elemMatch: {
                                    column
                                }
                            }
                        }
                    },
                    {
                        options: {
                            $not: {
                                $elemMatch: {
                                    column,
                                    ...(type === 'people'
                                        ? { value: { $not: { $size: 0 } } }
                                        : {})
                                }
                            }
                        }
                    }
                ]
            }
        } else if (operation === 'Is set') {
            condition = {
                options: {
                    $elemMatch: {
                        column,
                        ...(type === 'people'
                            ? { value: { $not: { $size: 0 } } }
                            : {})
                    }
                }
            }
        } else if (operation === 'Is') {
            condition = {
                options: {
                    $elemMatch: {
                        column,
                        value
                    }
                }
            }
        } else if (operation === 'Is not') {
            condition = {
                options: {
                    $not: {
                        $elemMatch: {
                            column,
                            value
                        }
                    }
                }
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
    '/:boardId/:viewId?',
    isLoggedIn,
    hasPermission('READ:PUBLIC'),
    wrapAsync(async (req, res) => {
        const { boardId, viewId } = req.params
        const filters = async () => {
            const board = await Board.findById(boardId).populate('views')
            if (!viewId) return []
            return board.views.find(x => x.id === viewId).filters
        }
        const board = await Board.findById(boardId)
            .populate('views')
            .populate({
                path: 'tasks',
                match: transformFilters(await filters()),
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
        const filters = (await Board.findById(boardId)).filters
        const board = await Board.findById(boardId).populate([
            {
                path: 'tasks',
                match: transformFilters(filters),
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

        pusherTrigger({
            req,
            boardId: boardId,
            event: 'setSharing',
            body: { share }
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

        pusherTrigger({
            req,
            workspaceId: workspace.id,
            event: 'sortBoard',
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

        const getShortId = () => {
            const chars =
                'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            const firstChar = chars[Math.floor(Math.random() * chars.length)]
            const secondChar = chars[Math.floor(Math.random() * chars.length)]
            return `${firstChar}${secondChar}`
        }

        const view = new View({
            name: 'List',
            id: getShortId(),
            filters: [],
            groupBy: 'none',
            sharing: false,
            type: 'List'
        })

        const board = new Board({
            _id,
            name,
            workspace,
            space: spaceId,
            attributes: [],
            taskGroups: [],
            views: [view]
        })

        view.board = board
        space.boards.push(board)

        pusherTrigger({
            req,
            workspaceId: workspace.id,
            event: 'addBoard',
            body: { spaceId, name, _id }
        })

        await view.save()
        await space.save()
        await board.save()

        res.json({
            success: true,
            message: {
                viewId: view._id,
                viewShortId: view.id
            }
        })
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

            pusherTrigger({
                req,
                workspaceId: board.workspace.id,
                event: 'editBoardName',
                body: { spaceId: board.space, boardId, name }
            })
        }
        if (groupBy) {
            if (!hasPerms(board.workspace, req.user, 'MANAGE:VIEW'))
                throw new PermissionError('MANAGE:VIEW')
            board.groupBy = groupBy

            pusherTrigger({
                req,
                boardId,
                event: 'setGroupBy',
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

        pusherTrigger({
            req,
            workspaceId: board.workspace.id,
            event: 'deleteBoard',
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

        pusherTrigger({
            req,
            boardId,
            event: 'setBoardFilters',
            body: { filters }
        })

        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

module.exports = router

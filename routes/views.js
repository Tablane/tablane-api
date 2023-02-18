const router = require('express').Router()
const View = require('../models/view')
const Board = require('../models/board')
const { wrapAsync, isLoggedIn, hasPermission } = require('../middleware')
const { pusherTrigger } = require('../utils/pusherTrigger')

// add new view
router.post(
    '/:boardId/addView',
    isLoggedIn,
    hasPermission('MANAGE:VIEW'),
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const { type } = req.body

        const board = await Board.findById(boardId).populate('views')

        const getName = (index = 0) => {
            let name =
                index === 0
                    ? type.charAt(0).toUpperCase() + type.slice(1)
                    : `${type.charAt(0).toUpperCase() + type.slice(1)} ${index}`
            const existingNames = board.views.map(x => x.name)

            if (existingNames.includes(name)) {
                return getName(index + 1)
            }

            return name
        }

        const getShortId = () => {
            const chars =
                'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            const firstChar = chars[Math.floor(Math.random() * chars.length)]
            const secondChar = chars[Math.floor(Math.random() * chars.length)]
            return `${firstChar}${secondChar}`
        }

        const getId = () => {
            let id = getShortId()
            const existingIds = board.views.map(x => x.id)

            if (existingIds.includes(id)) {
                return getId()
            }

            return id
        }

        const view = new View({
            name: getName(),
            id: getId(),
            filters: [],
            groupBy: 'none',
            sharing: false,
            type,
            board
        })
        board.views.push(view)

        // pusherTrigger({
        //     req,
        //     boardId: boardId,
        //     event: 'setSharing',
        //     body: { share }
        // })

        await view.save()
        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

// delete view
router.delete(
    '/:boardId/deleteView',
    isLoggedIn,
    hasPermission('MANAGE:VIEW'),
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const { viewId } = req.body

        const board = await Board.findById(boardId)
        board.views = board.views.filter(x => x.toString() !== viewId)

        // pusherTrigger({
        //     req,
        //     boardId: boardId,
        //     event: 'setSharing',
        //     body: { share }
        // })

        await View.findByIdAndDelete(viewId)
        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

// rename view
router.put(
    '/:viewId/renameView',
    isLoggedIn,
    hasPermission('MANAGE:VIEW'),
    wrapAsync(async (req, res) => {
        const { viewId } = req.params
        const { name } = req.body

        const view = await View.findById(viewId)
        view.name = name

        // pusherTrigger({
        //     req,
        //     boardId: boardId,
        //     event: 'setSharing',
        //     body: { share }
        // })

        await view.save()
        res.json({ success: true, message: 'OK' })
    })
)

// change share state
router.put(
    '/:viewId/setSharing',
    isLoggedIn,
    hasPermission('MANAGE:SHARING'),
    wrapAsync(async (req, res) => {
        const { viewId } = req.params
        const { share } = req.body

        const view = await View.findById(viewId)
        view.sharing = share

        // pusherTrigger({
        //     req,
        //     boardId: boardId,
        //     event: 'setSharing',
        //     body: { share }
        // })

        await view.save()
        res.json({ success: true, message: 'OK' })
    })
)

// change filters
router.put(
    '/:viewId/setFilters',
    isLoggedIn,
    hasPermission('MANAGE:VIEW'),
    wrapAsync(async (req, res) => {
        const { viewId } = req.params
        const { filters } = req.body
        const view = await View.findById(viewId)

        view.filters = filters

        // pusherTrigger({
        //     req,
        //     boardId,
        //     event: 'setBoardFilters',
        //     body: { filters }
        // })

        await view.save()
        res.json({ success: true, message: 'OK' })
    })
)

// set groupBy
router.put(
    '/:viewId/groupBy',
    isLoggedIn,
    hasPermission('MANAGE:VIEW'),
    wrapAsync(async (req, res) => {
        const { viewId } = req.params
        const { groupBy } = req.body
        const view = await View.findById(viewId)

        view.groupBy = groupBy

        // pusherTrigger({
        //     req,
        //     boardId,
        //     event: 'setGroupBy',
        //     body: { groupBy }
        // })

        await view.save()
        res.json({ success: true, message: 'OK' })
    })
)

module.exports = router

const router = require('express').Router()
const View = require('../models/view')
const { wrapAsync, isLoggedIn, hasPermission } = require('../middleware')
const { pusherTrigger } = require('../utils/pusherTrigger')

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

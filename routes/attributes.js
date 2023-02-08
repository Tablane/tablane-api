const router = require('express').Router()
const Board = require('../models/board')
const { isLoggedIn, wrapAsync, hasPermission } = require('../middleware')
const mongoose = require('mongoose')
const { pusherTrigger } = require('../utils/pusherTrigger')

// create new attribute
router.post(
    '/:boardId',
    isLoggedIn,
    hasPermission('MANAGE:COLUMN'),
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const { type, _id } = req.body
        const board = await Board.findById(boardId).populate('tasks')

        let name = type.charAt(0).toUpperCase() + type.slice(1)
        while (board.attributes.filter(x => x.name === name).length >= 1) {
            if (/ \d$/gm.test(name)) {
                name =
                    name.substring(0, name.length - 1) +
                    ` ${parseInt(name.slice(-1)) + 1}`
            } else name = name + ' 1'
        }

        let attribute = {
            name,
            type,
            _id
        }
        if (type === 'status') attribute.labels = []
        board.attributes.push(attribute)

        pusherTrigger({
            req,
            boardId: boardId,
            event: 'addAttribute',
            body: { type, _id }
        })

        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

// rename attribute
router.patch(
    '/:boardId/:attributeId',
    isLoggedIn,
    hasPermission('MANAGE:COLUMN'),
    wrapAsync(async (req, res) => {
        const { boardId, attributeId } = req.params
        const { name } = req.body
        const board = await Board.findById(boardId)

        board.attributes.find(x => x._id.toString() === attributeId).name = name

        pusherTrigger({
            req,
            boardId: boardId,
            event: 'editAttributeName',
            body: { name, attributeId }
        })

        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

// drag and drop sorting
router.patch(
    '/:boardId',
    isLoggedIn,
    hasPermission('MANAGE:COLUMN'),
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const { result } = req.body

        const board = await Board.findById(boardId)

        const [attribute] = board.attributes.splice(result.source.index, 1)
        board.attributes.splice(result.destination.index, 0, attribute)

        pusherTrigger({
            req,
            boardId: boardId,
            event: 'sortAttribute',
            body: { result }
        })

        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

// changing status labels
router.put(
    '/:boardId',
    isLoggedIn,
    hasPermission('MANAGE:COLUMN'),
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const { name, labels } = req.body
        const board = await Board.findById(boardId)

        board.attributes.find(x => x.name === name).labels = labels
        board.attributes
            .find(x => x.name === name)
            .labels.map(x => {
                if (!x._id) return (x._id = new mongoose.Types.ObjectId())
            })

        pusherTrigger({
            req,
            boardId: boardId,
            event: 'editAttributeLabels',
            body: { name, labels }
        })

        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

// delete attribute
router.delete(
    '/:boardId/:attributeId',
    isLoggedIn,
    hasPermission('MANAGE:COLUMN'),
    wrapAsync(async (req, res) => {
        const { boardId, attributeId } = req.params
        const board = await Board.findById(boardId).populate('tasks')

        const attributeIndex = board.attributes.indexOf(
            board.attributes.find(x => x._id.toString() === attributeId)
        )
        if (attributeIndex > -1) board.attributes.splice(attributeIndex, 1)

        board.tasks.map(task => {
            task.options = task.options.filter(
                option => option.column.toString() !== attributeId
            )
            task.save()
        })

        pusherTrigger({
            req,
            boardId: boardId,
            event: 'deleteAttribute',
            body: { attributeId }
        })

        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

module.exports = router

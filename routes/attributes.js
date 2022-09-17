const router = require('express').Router()
const Board = require('../models/board')
const { isLoggedIn, hasWritePerms, wrapAsync } = require('../middleware')
const mongoose = require('mongoose')

// create new attribute
router.post(
    '/:boardId',
    isLoggedIn,
    hasWritePerms,
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

        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

// rename attribute
router.patch(
    '/:boardId/:attributeId',
    isLoggedIn,
    hasWritePerms,
    wrapAsync(async (req, res) => {
        const { boardId, attributeId } = req.params
        const { name } = req.body
        const board = await Board.findById(boardId)

        board.attributes.find(x => x._id.toString() === attributeId).name = name

        board.save()
        res.json({ success: true, message: 'OK' })
    })
)

// drag and drop sorting
router.patch(
    '/:boardId',
    isLoggedIn,
    hasWritePerms,
    wrapAsync(async (req, res) => {
        const { boardId } = req.params
        const { result } = req.body

        const board = await Board.findById(boardId)

        const [attribute] = board.attributes.splice(result.source.index, 1)
        board.attributes.splice(result.destination.index, 0, attribute)

        board.save()
        res.json({ success: true, message: 'OK' })
    })
)

// changing status labels
router.put(
    '/:boardId',
    isLoggedIn,
    hasWritePerms,
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

        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

// delete attribute
router.delete(
    '/:boardId/:attributeId',
    isLoggedIn,
    hasWritePerms,
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

        await board.save()
        res.json({ success: true, message: 'OK' })
    })
)

module.exports = router

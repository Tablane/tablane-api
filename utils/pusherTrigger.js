const pusher = require('../pusher')

exports.pusherTrigger = async ({ req, boardId, workspaceId, event, body }) => {
    if (boardId) {
        pusher.trigger('private-board-' + boardId, 'updates', {
            event,
            id: boardId,
            sessionId: req.headers['pusher-session'],
            body
        })
    } else if (workspaceId) {
        pusher.trigger('private-workspace-' + workspaceId, 'updates', {
            event,
            id: workspaceId,
            sessionId: req.headers['pusher-session'],
            body
        })
    }
}

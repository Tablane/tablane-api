class PermissionError extends Error {
    constructor(permission) {
        super()
        this.message = `You do not have permissions to perform this action: ${permission}`
        this.status = 403
    }
}

module.exports = PermissionError

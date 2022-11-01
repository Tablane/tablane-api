class AppError extends Error {
    constructor(message, status, options) {
        super()
        this.message = message
        this.status = status
        this.options = options
    }
}

module.exports = AppError

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

module.exports = { transformFilters, removeEmptyArrays }

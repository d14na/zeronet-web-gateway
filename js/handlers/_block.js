/**
 * Handle BLOCK
 */
const _handleBlock = function (_data) {
    console.log('BLOCK DATA', _data)

    /* Set data id. */
    const dataId = _data.dataId

    /* Validate data. */
    if (!dataId) {
        return console.error('ERROR retrieving data id from block data:', _data)
    }

    /* Retrieve block buffer. */
    const block = Buffer.from(_data.blockBuffer)

    /* Validate data. */
    if (!block) {
        return console.error('ERROR retrieving data block:', _data)
    }

    /* Calculate verification hash. */
    const verificationHash = _calcInfoHash(block)
    console.info('Block Verification Hash', verificationHash)

    // TODO Perform verification against metadata pieces
    //      Or is it good enough to use the provided hash??

    if (verificationHash === _data.hash) {
        /* Initailize database values. */
        const dbName = 'blocks'
        const data = block

        /* Write to database. */
        _dbWrite(dbName, dataId, data)

        /* Clear modals. */
        _clearModals()
    } else {
        _alert('Verification Failed', 'Block data verification FAILED!.')
    }
}

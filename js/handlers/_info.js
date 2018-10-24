/**
 * Handle Torrent Info
 *
 * NOTE This is the same as .TORRENT file.
 */
const _handleInfo = async function (_data) {
    /* Set info hash. */
    const infoHash = _data.infoHash

    /* Set metadata. */
    const metadata = Buffer.from(_data.metadata)

    /* Validate metadata. */
    if (!metadata) {
        return _errorHandler(
            `Oops! No torrent info found in [ ${JSON.stringify(_data.info)} ]`, false)
    }

    /* Retrieve torrent info. */
    const torrentInfo = _verifyMetadata(infoHash, metadata)
    console.log('TORRENT INFO', torrentInfo)

    /* Verify torrent info. */
    if (torrentInfo) {
        _addLog(`[ ${infoHash} ] METADATA was verified successfully!`)
    } else {
        return _errorHandler(
            `Oops! Torrent metadata FAILED verification [ ${JSON.stringify(_data.info)} ]`, false)
    }

    /* Initailize database values. */
    const dbName = 'main'
    const dataId = _data.dataId
    const data = metadata

    /* Write to database. */
    _dbWrite(dbName, dataId, data)

    /* Initialize body (display). */
    body = '<pre><code>'

    /* Body header. */
    body += `<h3>${dataId}</h3><hr />`

    /* Convert name to (readable) string. */
    const torrentName = Buffer.from(torrentInfo['name']).toString()
    body += `<h3>${torrentName}</h3>`

    /* Retrieve the torrent's files. */
    const files = torrentInfo['files']

    /* Initialize file counter. */
    let fileCounter = 0

    /* Process the individual files. */
    for (let file of files) {
        /* Convert file path to (readable) string. */
        const filepath = Buffer.from(file.path[0], 'hex').toString()

        body += `<br />    #${++fileCounter}: ${filepath} { size: ${file.length} bytes }`
    }

    /* Retrieve torrent blocks. */
    const blocks = Buffer.from(torrentInfo['pieces'])
    body += '<br /><hr />'
    body += `<br />    ALL Hash Blocks [ length: ${blocks.length} ]`
    body += `<br /><textarea cols=60 rows=6>${blocks.toString('hex')}</textarea>`

    /* Calculate the number of hashes/blocks. */
    const numBlocks = blocks.length / App.BLOCK_HASH_LENGTH
    body += '<br /><hr />'
    body += `<br />    # Total Blocks : ${numBlocks}`

    /* Retrieve the block length. */
    const blockLength = parseInt(torrentInfo['piece length'])
    body += `<br />    Block Length   : ${blockLength} bytes`

    const numBlockChunks = parseInt(blockLength / App.CHUNK_LENGTH)
    body += `<br />    (${numBlockChunks} chunks per block)`

    body += '<br /><hr />'

    /* Process the hash list. */
    for (let i = 0; i < numBlocks; i++) {
        /* Calculate the hash start. */
        const start = (i * App.BLOCK_HASH_LENGTH)

        /* Calculate the hash end. */
        const end = (i * App.BLOCK_HASH_LENGTH) + App.BLOCK_HASH_LENGTH

        /* Retrieve the block's hash. */
        const buf = blocks.slice(start, end)

        /* Convert buffer to hex. */
        const hash = Buffer.from(buf).toString('hex')
        body += `<br />        Hash Block #${i}: ${hash}`
    }

    /* Finalize body (display). */
    body += '</code></pre>'

    /* Validate body. */
    if (body) {
        /* Build gatekeeper package. */
        pkg = { body }

        /* Send package to gatekeeper. */
        _gatekeeperMsg(pkg)

        // TEMP Hard-coded request for block #7 (THE ENDGAME)
        // const action = 'GET'
        // let dataId = '01c227c8c9aac311f9365b163ea94708c27a7db4:0'
        // pkg = { action, dataId }
        // if(_send0penMessage(pkg)) {
        //     console.log(`Send request for [ ${dataId} ]`)
        // }
        // dataId = '01c227c8c9aac311f9365b163ea94708c27a7db4:1'
        // pkg = { action, dataId }
        // if(_send0penMessage(pkg)) {
        //     console.log(`Send request for [ ${dataId} ]`)
        // }
        // dataId = '01c227c8c9aac311f9365b163ea94708c27a7db4:2'
        // pkg = { action, dataId }
        // if(_send0penMessage(pkg)) {
        //     console.log(`Send request for [ ${dataId} ]`)
        // }
    }

    /* Clear modals. */
    _clearModals()
}

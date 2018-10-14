/**
 * Hanlde Zeronet File
 */
const _handleZeroFile = async function (_data) {

    config = await _dbRead('main', `${dest}:content.json`)
    console.log('FOUND CONFIG', config)

    /* Validate config. */
    if (!config || !config.data || !config.data.files) {
        return _addLog('Problem retrieving config (content.json) from database.')
    }

    /* Retrieve inner path. */
    innerPath = data.innerPath

    /* Parse file extension. */
    fileExt = innerPath.split('.').pop()

    /* Validate inner path. */
    if (!innerPath) {
        return _addLog(`Problem retrieving inner path [ ${innerPath} ]`)
    }

    /* Retrieve files list. */
    files = config.data.files

    /* Retrieve config size. */
    const configSize = files[innerPath].size

    /* Retrieve config hash. */
    const configHash = files[innerPath].sha512
    console.log(`${innerPath} size/hash`, configSize, configHash)

    /* Parse body. */
    if (data.body && data.body.type && data.body.type === 'Buffer') {
        body = Uint8Array.from(data.body.data)
    } else {
        body = data.body
    }

    /* Calculate file size. */
    const fileSize = parseInt(body.length)
    console.log(`File length [ ${fileSize} ]`)

    /* Calculate file verifcation hash. */
    const fileHash = _calcFileHash(body)
    console.log(`File verification hash [ ${fileHash} ]`)

    /* Verify the signature of the file. */
    if (configSize === fileSize && configHash === fileHash) {
        isValid = true
    } else {
        isValid = false
    }

    _addLog(`${innerPath} validation hash is ${isValid}'`)

    if (isValid) {
        /* Initailize database values. */
        dbName = 'files'
        dataId = `${dest}:${innerPath}`
        data = body

        /* Write to database. */
        _dbWrite(dbName, dataId, data)

        /* Decode body. */
        switch (fileExt.toUpperCase()) {
        case 'HTM':
        case 'HTML':
            body = body.toString()
            break
        case 'PNG':
            body = `<img class="img-fluid" src="data:image/png;base64,${_imgConverter(body)}" width="300">`
            break
        default:
            // NOTE Leave as buffer (for binary files).
        }

        /* Build gatekeeper package. */
        pkg = { body }
    } else {
        /* Generate error body. */
        body = `${innerPath} file verification FAILED!`

        /* Build gatekeeper package. */
        pkg = { body }
    }

    /* Send package to gatekeeper. */
    _gatekeeperMsg(pkg)

    /* Clear modals. */
    _clearModals()
}

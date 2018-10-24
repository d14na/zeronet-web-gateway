/**
 * Hanlde Zeronet File
 */
const _handleZeroFile = async function (_data) {
    /* Retrieve configuration. */
    const config = await _dbRead('main', `${_data.dest}:content.json`)
    console.log('FOUND CONFIG', config)

    /* Validate config. */
    if (!config || !config.data || !config.data.files) {
        return _addLog('Problem retrieving config (content.json) from database.')
    }

    /* Set inner path. */
    const innerPath = _data.innerPath

    /* Validate inner path. */
    if (!innerPath) {
        return _addLog(`Problem retrieving inner path [ ${innerPath} ]`)
    }

    /* Set files list. */
    const files = config.data.files

    /* Set (configuraton) file size. */
    const configSize = files[innerPath].size

    /* Set (configuration) hash. */
    const configHash = files[innerPath].sha512

    console.log(`${innerPath} size/hash`, configSize, configHash)

    /* Initialize body. */
    let body = null

    /* Parse body (into buffer). */
    if (_data.body) {
        body = Buffer.from(_data.body)
    }

    /* Calculate file size. */
    const fileSize = parseInt(body.length)
    console.log(`File size/length [ ${fileSize} ]`)

    /* Calculate file verifcation hash. */
    const fileHash = _calcFileHash(body)
    console.log(`File verification hash [ ${fileHash} ]`)

    /* Initialize valid flag. */
    let isValid = null

    /* Verify the signature of the file. */
    if (configSize === fileSize && configHash === fileHash) {
        isValid = true
    } else {
        isValid = false
    }

    _addLog(`${innerPath} validation is [ ${isValid} ]`)

    if (isValid) {
        /* Initailize database values. */
        const dbName = 'files'
        const dataId = `${_data.dest}:${_data.innerPath}`

        /* Write to database. */
        _dbWrite(dbName, dataId, body)

        /* Initialize file extension. */
        // NOTE Some files (eg. LICENSE, do not have extensions).
        let fileExt = ''

        if (innerPath.indexOf('.') !== -1) {
            /* Retrieve the file extention. */
            fileExt = innerPath.split('.').pop()
        }

        /* Decode body (for UI display). */
        switch (fileExt.toUpperCase()) {
        case '': // NOTE Support for extension-less files (eg LICENSE).
        //               Are there ANY binary files in this category??
        // TODO Add support for ALL TXT files (require string decoding).
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

    console.log('SENDING GATEKEEPER PKG', pkg)

    /* Send package to gatekeeper. */
    _gatekeeperMsg(pkg)

    /* Clear modals. */
    _clearModals()
}

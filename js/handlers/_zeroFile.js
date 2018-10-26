/**
 * Hanlde Zeronet File
 */
const _handleZeroFile = async function (_data) {
    /* Validate configuration (content.json). */
    if (!App.ziteMgr[_data.dest]) {
        /* Create a new manager for zite. */
        App.ziteMgr[_data.dest] = {}
    }

    console.log('HANDLE ZERO FILE [ziteMgr]', App.ziteMgr[_data.dest]);

    /* Retrieve configuration. */
    // const config = await _dbRead('main', `${_data.dest}:content.json`)
    const config = App.ziteMgr[_data.dest]['config']
    // console.log('FOUND CONFIG', config)

    /* Validate config. */
    if (!config || !config.files) {
        return _addLog('No config found in Zite Manager.')
    }

    /* Set inner path. */
    const innerPath = _data.innerPath

    /* Validate inner path. */
    if (!innerPath) {
        return _addLog(`Problem retrieving inner path [ ${innerPath} ]`)
    }

    /* Set files list. */
    const files = config.files

    /* Set (configuraton) file size. */
    const configSize = files[innerPath].size

    /* Set (configuration) hash. */
    const configHash = files[innerPath].sha512

    // console.log(`${innerPath} size/hash`, configSize, configHash)

    /* Initialize file data. */
    let fileData = null

    /* Parse file data (into buffer). */
    if (_data.body) {
        fileData = Buffer.from(_data.body)
    }

    /* Calculate file size. */
    const fileSize = parseInt(fileData.length)
    // console.log(`File size/length [ ${fileSize} ]`)

    /* Calculate file verifcation hash. */
    const fileHash = _calcFileHash(fileData)
    // console.log(`File verification hash [ ${fileHash} ]`)

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
        _dbWrite(dbName, dataId, fileData)

        /* Initialize file extension. */
        // NOTE Some files (eg. LICENSE, do not have extensions).
        let fileExt = ''

        if (innerPath.indexOf('.') !== -1) {
            /* Retrieve the file extention. */
            fileExt = innerPath.split('.').pop()
        }

        /* Add file data to body builder. */
        App.ziteMgr[_data.dest]['data'][innerPath] = fileData

        /* Run body builder. */
        _bodyBuilder(_data.dest, config)

        /* Parse file data. */
        // body = _formatFileData(body, fileExt)

        /* Build gatekeeper package. */
        // pkg = { body }
    } else {
        /* Generate error body. */
        console.error(`[ ${innerPath} ] file verification FAILED!`)

        /* Build gatekeeper package. */
        // pkg = { body }
    }

    /* Send package to gatekeeper. */
    // _gatekeeperMsg(pkg)

    /* Clear modals. */
    // _clearModals()
}

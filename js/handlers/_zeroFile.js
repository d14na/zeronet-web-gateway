/**
 * Hanlde Zeronet File
 */
const _handleZeroFile = async function (_data) {
    /* Validate configuration (content.json). */
    if (!App.ziteMgr[_data.dest]) {
        /* Create a new manager for zite. */
        App.ziteMgr[_data.dest] = {}
    }

    console.log('HANDLING ZERO FILE [ziteMgr]', App.ziteMgr[_data.dest]);

    /* Initialize config. */
    let config = null

    /* Retrieve configuration. */
    config = App.ziteMgr[_data.dest]['config']
    // console.log('FOUND CONFIG', config)

    /* Validate config. */
    if (!config || !config.files) {
        /* Try to retrieve from db. */
        config = await _dbRead('main', `${_data.dest}:content.json`)

        // console.log('WHAT DID WE FIND IN THE DB for:', `${_data.dest}:content.json`, config)

        /* Re-validate config. */
        if (!config || !config.data) {
            return _addLog('No config found in Zite Manager.')
        } else {
            config = config.data

            /* Initialize zite file data. */
            App.ziteMgr[_data.dest]['data'] = {}

            /* Set zite config (content.json). */
            App.ziteMgr[_data.dest]['config'] = config

            /* Initialize zite (display) body. */
            App.ziteMgr[_data.dest]['body'] = ''
        }
    }

    /* Set inner path. */
    const innerPath = _data.innerPath

    /* Validate inner path. */
    if (!innerPath) {
        return _addLog(`Problem retrieving inner path [ ${innerPath} ]`)
    }

    /* Initialize file data. */
    let fileData = null

    /* Parse file data (into buffer). */
    if (_data.body) {
        fileData = Buffer.from(_data.body)
    }

    /* Validate file data. */
    const isValid = _validateFileData(config, fileData, innerPath)

    /* Validate file data. */
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
    } else {
        /* Generate error body. */
        console.error(`[ ${innerPath} ] file verification FAILED!`)
        console.error({ configSize, fileSize, configHash, fileHash })
        console.error(Buffer.from(_data['body']).toString())
    }
}

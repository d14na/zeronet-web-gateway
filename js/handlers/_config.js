/**
 * Handle Zeronet Configuration
 */
const _handleConfig = async function (_data) {
    console.log('CONFIG DATA', _data)

    if (!_data.body) {
        return console.error('ERROR retrieving config body', _data)
    }

    /* Initialize config. */
    let config = null

    try {
        /* Parse config data. */
        config = JSON.parse(Buffer.from(_data.body))

        console.log('CONFIG BODY', config)
    } catch (_err) {
        console.error('ERROR parsing config data', _err)
    }

    /* Validate config. */
    if (!config) {
        /* Show alert. */
        return _alert(
            'Oops! Download Error!',
            'Failed to download zite configuration.',
            'Please try your request again...',
            false
        )
    }

    /* Verify the signature of the configuraton (content.json). */
    const isSignatureValid = await _verifyConfig(config)
        .catch((_err) => console.error(
            'Could NOT verify Zeronet config', _err, _data))

    /* Validate signature. */
    if (!isSignatureValid) {
        /* Show alert. */
        return _alert(
            'Oops! Validation Error!',
            'Failed to validate zite configuration file.',
            'Please try your request again...',
            false
        )
    }

    /* Initailize database values. */
    let dbName = 'main'
    // NOTE data id DOES NOT exist for SEARCH requests (eg zitetags).
    let dataId = _data.dataId || `${_data.dest}:${_data.innerPath}`

    /* Write to database. */
    _dbWrite(dbName, dataId, config)

    /* Initialize zite manager. */
    App.ziteMgr[_data.dest] = {}

    /* Initialize zite file data. */
    App.ziteMgr[_data.dest]['data'] = {}

    /* Set zite config (content.json). */
    App.ziteMgr[_data.dest]['config'] = config

    /* Initialize zite (display) body. */
    App.ziteMgr[_data.dest]['body'] = ''

    /* Initialize action. */
    let action = null

    /* Initialize package. */
    let pkg = null

    /* Initialize file data. */
    let fileData = null

    /* Start file verification. */
    for (let file in config.files) {
        /* Set db name. */
        dbName = 'files'

        /* Set data id. */
        dataId = `${_data.dest}:${file}`

        _addLog(`Requesting [ ${dataId} ] from [ ${dbName} ]`)

        /* Request file data. */
        fileData = await _dbRead(dbName, dataId)

        /* Validate file data. */
        if (fileData) {
            _addLog(`Received [ ${dataId} ] [ ${numeral(fileData['data'].length).format('0,0') || 0} bytes ]`)

            /* Add file data to body builder. */
            App.ziteMgr[_data.dest]['data'][file] = fileData['data']
        } else {
            _addLog(`Requesting [ ${dataId} ] from 0PEN.`)

            /* Set action. */
            action = 'GET'

            /* Build package. */
            pkg = { action, dataId }

            /* Send message request. */
            _send0penMessage(pkg)
        }
    }

    /* Run body builder. */
    _bodyBuilder(_data.dest, config)
}

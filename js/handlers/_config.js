/**
 * Handle Zeronet Configuration
 */
const _handleConfig = async function (_data) {
    console.log('CONFIG DATA', _data)

    /* Set body. */
    const body = _data.body

    /* Validate body. */
    if (!body) {
        return console.error('ERROR retrieving config body', _data)
    }

    /* Set destination. */
    App.destination = _data.dest

    /* Validate destination. */
    if (!App.destination) {
        return console.error('ERROR retrieving config destination', _data)
    }

    /* Initialize config. */
    let config = null

    try {
        /* Parse config data. */
        config = JSON.parse(Buffer.from(body))

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
    let dataId = _data.dataId || `${App.destination}:${_data.innerPath}`

    /* Set modified. */
    let modified = config.modified

    /* Retreive saved config. */
    let savedConfig = await _dbRead('main', dataId)

    /* Validate saved config. */
    if (savedConfig) {
        /* Set saved config data. */
        savedConfig = savedConfig['data']

        console.log('SAVED CONFIG', savedConfig)

        console.log('NEW MODIFIED', modified, 'SAVED MODIFIED', savedConfig.modified)
    }

    if (savedConfig && modified > savedConfig.modified) {
        _addLog('Zite update is available.')

        let calcDiff = moment.unix(modified).diff(
            moment.unix(savedConfig.modified), 'hours', true)

        _alert(
            'Zite Update Available',
            'Would you like to download the latest zite now?',
            `Last updated: ${calcDiff} hours ago.`,
            false
        )

        /* Write to database. */
        _dbWrite(dbName, dataId, config)

        return console.error('MADE THE UPDATE, THEN STOPPED EXECUTION -- PLEASE REFRESH')
    } else if (savedConfig && modified < savedConfig.modified) {
        _addLog('OLD CONFIG FILE -- IGNORED.')

        /* Run HTML body builder. */
        _bodyBuilder(App.destination, config)

        // return
    } else if (savedConfig && modified === savedConfig.modified) {
        _addLog('Zite configuration file is current.')

        /* Run HTML body builder. */
        _bodyBuilder(App.destination, config)

        // return
    } else {
        _addLog('New zite added!')

        _alert(
            'Add New Zite',
            'Would you like to add this zite to your gallery?',
            `[ ${App.destination} ]`,
            false
        )

        // return

        /* Write to database. */
        _dbWrite(dbName, dataId, config)
    }

    /* Initialize zite manager. */
    App.ziteMgr[App.destination] = {}

    /* Initialize zite file data. */
    App.ziteMgr[App.destination]['data'] = {}

    /* Set zite config (content.json). */
    App.ziteMgr[App.destination]['config'] = config

    /* Initialize zite (display) body. */
    App.ziteMgr[App.destination]['body'] = ''

    /* Initialize action. */
    let action = null

    /* Initialize package. */
    let pkg = null

    /* Initialize file data. */
    let fileData = null

    /* Start file verification. */
    for (let file in config.files) {
        /* Set db name. */
        const dbName = 'files'

        /* Set data id. */
        const dataId = `${App.destination}:${file}`

        _addLog(`Requesting [ ${dataId} ] from [ ${dbName} ]`)

        /* Request file data. */
        const fileData = await _dbRead(dbName, dataId)

        /* Validate file data. */
        if (fileData) {
            /* Validate file data. */
            const isValid = _validateFileData(config, fileData['data'], file)

            if (isValid) {
                _addLog(`Validated [ ${dataId} ] [ ${numeral(fileData['data'].length).format('0,0') || 0} bytes ] from [ ${dbName} ].`)

                /* Add file data to body builder. */
                App.ziteMgr[App.destination]['data'][file] = fileData['data']
            } else {
                _addLog(`[ ${dataId} ] FAILED VALIDATION, now requesting from [ 0PEN ]`)

                /* Set action. */
                action = 'GET'

                /* Build package. */
                pkg = { action, dataId }

                /* Send message request. */
                _send0penMessage(pkg)

                // console.error(`[ ${dataId} ] [ ${numeral(fileData['data'].length).format('0,0') || 0} bytes ] FAILED VALIDATION from [ ${dbName} ]`)

                // break
            }
        } else {
            _addLog(`[ ${dataId} ] NOT IN DB, now requesting from [ 0PEN ]`)

            /* Set action. */
            action = 'GET'

            /* Build package. */
            pkg = { action, dataId }

            /* Send message request. */
            _send0penMessage(pkg)
        }
    }

    /* Run HTML body builder. */
    _bodyBuilder(App.destination, config)
}

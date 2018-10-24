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
    let data = config

    /* Write to database. */
    _dbWrite(dbName, dataId, data)

    /* Format (display) body. */
    let body = `
<h1>${isSignatureValid ? 'File Signature is VALID' : 'File Signature is INVALID'}</h1>
<pre><code>${JSON.stringify(config, null, 4)}</code></pre>
    `

    /* Start file verification. */
    for (let file in config.files) {
        /* Set db name. */
        dbName = 'files'

        /* Set data id. */
        dataId = `${_data.dest}:${file}`
        console.log(`Verifying [ ${dataId} ] in [ ${dbName} ]`)

        let fileData = await _dbRead(dbName, file)
        console.log(`[ ${dataId} ]`, fileData)

        break

        if (!fileData) {
            console.log(`Requesting [ ${file} ] data.`)
            break
        }
    }

    /* Validate body. */
    if (body) {
        /* Build gatekeeper package. */
        pkg = { body }

        /* Send package to gatekeeper. */
        _gatekeeperMsg(pkg)
    }

    /* Clear modals. */
    _clearModals()
}

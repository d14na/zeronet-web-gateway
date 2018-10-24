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

        console.log('CONFIG', config)
    } catch (_err) {
        console.error('ERROR parsing config data', _err)
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
            'Failed to validate signature!',
            'Please try your request again...',
            false
        )
    }

    /* Initailize database values. */
    const dbName = 'main'
    // NOTE data id DOES NOT exist for SEARCH requests (eg zitetags).
    const dataId = config.dataId || `${config.dest}:${config.innerPath}`
    const data = config

    /* Write to database. */
    _dbWrite(dbName, dataId, data)

    /* Format (display) body. */
    body = `
<br /><hr /><br />
<h1>${isSignatureValid ? 'File Signature is VALID' : 'File Signature is INVALID'}</h1>
<pre><code>${JSON.stringify(config, null, 4)}</code></pre>
    `

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

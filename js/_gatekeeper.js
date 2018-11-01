/**
 * Event Listener: MESSAGE
 *
 * Receives and handles ALL incoming messages from our embedded iframe.
 *
 * WARNING Sandboxed iframes which lack the 'allow-same-origin'
 * header have "null" rather than a valid origin. This means we still
 * have to be careful about accepting data via the messaging API we've
 * created. We verify the source, and validate ALL inputs.
 */
window.addEventListener('message', function (_event) {
    console.log('INCOMING MESSAGE EVENT', _event)

    /* Retrieve origin. */
    const origin = _event.origin

    /* Retrieve source. */
    const source = _event.source

    /* Validate the message contents. */
    if (origin === 'null' && source === contentWindow) {
        /* Retrieve data. */
        const data = _event.data

        console.log('EVENT DATA', data)

        /* Validate data. */
        if (data) {
            /* Handle any errors. */
            if (data.error) {
                return _addLog(`Oops! We have a problem.<br /><br />${data.msg}`)
            }

            /* Handle any Api commands. */
            if (data.cmd && data.params) {
                /* Log all successful messages to console. */
                _addLog(`${data.cmd} : ${data.params}`)

                switch(data.cmd.toUpperCase()) {
                case 'FILEGET':
                    /* Initialize file data holder. */
                    let fileData = null

                    /* Retrieve file data from zite manager. */
                    fileData = App.ziteMgr[App.destination]['data'][data.params]

                    /* Format for display. */
                    // FIXME Support ALL file types.
                    fileData = _formatFileData(fileData, 'html')

                    // console.log('FILE DATA', fileData)

                    return _gatekeeperMsg({
                        cmd: 'response',
                        to: data.id,
                        result: fileData
                    })

                default:
                    return console.error('UNHANDLED API EVENT', data.cmd)
                }
            }

            /* Verify we have a successful message. */
            if (data.success) {
                /* Log all successful messages to console. */
                _addLog(data.msg)

                /* Validate Iframe authorization. */
                if (data.msg === 'GATEKEEPER_IS_READY') {
                    /* Set Gatekeeper ready flag. */
                    gateReady = true

                    /* Connect to 0PEN. */
                    _connect()
                }
            }
        } else {
            /* Report any communications error. */
            _addLog('Oops! Something went wrong.' +
                  'We DID NOT receive the data we were looking for. ' +
                  'What we did receive was:<br /><br />' +
                  JSON.stringify(data))
        }
    }
})

/**
 * Send Gateway Message
 *
 * WARNING We're sending the message to "*", rather than some specific
 * origin. Sandboxed iframes which lack the 'allow-same-origin' header
 * don't have an origin which we can target.
 * (this might allow some "zero-day-style" esoteric attacks)
 */
const _gatekeeperMsg = function (_message = {}) {
    contentWindow.postMessage(_message, '*')
}

/**
 * Authorize Gatekeeper
 */
const _authGatekeeper = async function () {
    /* Show "connecting..." notification. */
    await _wait('Starting New Session', 'This will only take a moment.', 'Please wait...')

    /* Validate application initialization. */
    if (!gateReady) {
        setTimeout(function () {
            /* Send empty message to the gatekeeper for initialization. */
            _gatekeeperMsg()
        }, 1000)
    }
}

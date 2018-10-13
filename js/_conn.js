/*******************************************************************************

  SockJS
  https://github.com/sockjs/sockjs-client

  We are using SockJS to manage all socket communications.

*******************************************************************************/


/**
 * Websocket Connect
 *
 * Open a new connection to the Zero Private Enterprise Network (0PEN).
 * via a websocket (or applicable fallback) connection.
 *
 * NOTE The closest (available) server can be reached by querying the DNS list:
 *      https://0pen.0net.io
 */
const _connect = async function () {
    /* Verify that we are NOT already connected. */
    if (!conn || conn.readyState !== 1) {
        /* Show "connecting..." notification. */
        await _wait('Connecting to 0PEN', 'This will only take a moment.', 'Please wait...')

        /* Create a new Socket JS connection . */
        conn = new SockJS(WS_ENDPOINT)

        /* Initialize event handlers. */
        conn.onopen = _connOpen
        conn.onmessage = _connMessage
        conn.onclose = _connClose
    }
}

/**
 * 0PEN Message Handler
 */
const _send0penMessage = function (_msg) {
    if (conn && conn.readyState === 1) {
        /* Increment request id. */
        // NOTE An Id of (0) will return FALSE on validation
        requestId++

        /* Add new request id to message. */
        const msg = {
            requestId,
            ..._msg
        }

        /* Add new request to requests manager. */
        requestMgr[requestId] = msg

        /* Send serialized message. */
        conn.send(JSON.stringify(msg))

        return true
    } else {
        /* Attempt to re-connect. */
        _connect()

        /* Wait a few secs, then attempt to re-connect. */
        setTimeout(() => {
            /* Attempt to re-connect. */
            _connect()
        }, 3000)
    }
}

/**
 * Websocket - Connection Opened
 */
const _connOpen = async function () {
    _addLog('0PEN connected successfully.')

    /* Update connection status (display). */
    app._setConnStatus('0PEN is Connected', 'text-success')

    /* Build package. */
    const pkg = {
        action: 'WHOAMI'
    }

    /* Send package. */
    _send0penMessage(pkg)
}

/**
 * Websocket - Message Received
 */
const _connMessage = function (_event) {
    // console.info('Incoming 0PEN message', _event.data)

    /* Handle incoming 0PEN message. */
    _handle0penMessage(_event.data)
}

/**
 * Websocket - Connection Closed
 */
const _connClose = function () {
    console.info('0PEN connection closed.')

    /* Update connection status (display). */
    app._setConnStatus('0PEN is Disconnected', 'text-danger')
}

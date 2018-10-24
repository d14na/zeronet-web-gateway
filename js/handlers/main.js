/**
 * Handle Unknown Requests
 *
 * NOTE Currently this is un-implemented.
 */
const _handleUnknown = function (_data) {
    console.error('UNKNOWN REQUEST HANDLER', _data)
    return // FIXME We may not implement this report

    /* Format body. */
    const body = `<pre><code>
<h3>${dataId}</h3>
<hr />
${JSON.stringify(data, null, 4)}
    </code></pre>`

    /* Clear modals. */
    _clearModals()
}

/**
 * Handle 0PEN Message
 */
const _handle0penMessage = async function (_data) {
    try {
        /* Parse incoming message. */
        let data = JSON.parse(_data)

        console.log('Received 0PEN data:', data)

        /* Validate message. */
        if (!data) {
            return _addLog(`Error processing [ ${JSON.stringify(data)} ]`)
        }

        /* Validate response. */
        if (data.error) {
            /* Show alert. */
            return _alert(
                '0PEN Network Error',
                data.error,
                'Please try your request again...',
                false
            )
        }

        /* Initialize action. */
        let action = null

        /* Retrieve the action from requests manager. */
        if (data.search) {
            action = 'SEARCH'
        } else if (data.action) {
            /* Set action. */
            action = data.action
        } else {
            /* Retrieve action from saved request. */
            action = _getAction(data)
        }

        console.log(`Retrieved ACTION [ ${action} ] from message.`)

        /* Validate action. */
        if (!action) {
            return _errorHandler(`No ACTION was found for [ ${JSON.stringify(data)} ]`, false)
        }

        /* Initialize (data) managers. */
        let body = null
        let dest = null
        let pkg = null

        switch (action.toUpperCase()) {
        case 'AUTH':
            /* Handle response. */
            return _handleAuth(data)
        case 'GET':
            if (data.dest && data.innerPath) { // Zeronet
                /* Retrieve destination. */
                dest = data.dest

                /* Validate dest. */
                if (!dest || dest.slice(0, 1) !== '1' || (dest.length !== 33 && dest.length !== 34)) {
                    return _addLog(`${dest} is an invalid public key.`)
                }

                /* Verify config file. */
                if (data.innerPath === 'content.json') {
                    return _handleConfig(data)
                }
            } else if (data.infoHash && data.metadata) { // Torrent
                /* Verify info file. */
                if (data.dataId.split(':')[1] === 'torrent') {
                    return _handleInfo(data)
                }
            } else if (data.dataId && data.requestMgr) { // Torrent
                // TODO Handle an "immediate" response to our request.
                //      Already in 0NET cache and no need to wait for seeders.
                console.log('BLOCK REQUEST MANAGER', data.requestMgr)
            } else if (data.dataId && data.blockBuffer) { // Torrent
                /* Handle response. */
                return _handleBlock(data)
            } else {
                return _addLog(`ERROR processing GET request for [ ${JSON.stringify(data)} ]`)
            }

            break
        case 'NOTIF':
            /* Handle response. */
            return App.msgList.push(data)
        case 'SEARCH':
            /* Handle response. */
            return _handleSearch(data)
        case 'WHOAMI':
            /* Hanlde response. */
            return _handleWhoAmI(data)
        default:
            // nothing to do here
        }
    } catch (_err) {
        _errorHandler(_err, false)
    }
}

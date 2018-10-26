/**
 * Search
 *
 * Handles ALL submissions from the Zite | Search input.
 *
 * Currently Supported Request Types:
 *     1. Zeronet (zitetags, publickeys, bigfiles, etc).
 *     2. Torrent (info hash)
 */
const _search = async function (_query) {
    /* Set query. */
    const query = _query

    _addLog(`Searching for [ ${query} ]`)

    /* Show "connecting..." notification. */
    await _wait('Peer-to-Peer Search', `Processing request for<br />[ <strong class="text-primary">${query}</strong> ]`, 'Please wait...')

    /* Initialize (data) managers. */
    let action = null
    let body = null
    let dataId = null
    let dest = null
    let docs = null
    let infoHash = null
    let innerPath = null
    let options = null
    let params = null
    let pkg = null

    /* Basic validation. */
    if (!query || query === '' || !query.length) {
        return
    }

    /* Validate search query. */
    if (query.slice(0, 10).toUpperCase() === 'DEBUG.MENU') {
        /* Clear open modals. */
        _clearModals()

        /* Show ADMIN permission modal. */
        $('#modalDebug').modal({
            backdrop: 'static',
            keyboard: false
        })

        /* Reset search. */
        App._resetSearch()
    } else if (query.slice(0, 7).toUpperCase() === 'GETFILE' && query.length > 10) {
        /* Set action. */
        action = 'GET'

        /* Retrieve request parameters. */
        params = query.slice(8)

        /* Retrieve destination. */
        dest = params.split(':')[0]

        /* Retrieve inner path. */
        innerPath = params.split(':')[1]

        /* Set data id. */
        dataId = params

        /* Build package. */
        pkg = { action, dataId }
    } else if (query.slice(0, 1) === '1' && (query.length === 33 || query.length === 34)) {
        /* Set action. */
        action = 'GET'

        /* Set destination. */
        dest = query

        /* Set inner path. */
        innerPath = 'content.json'

        /* Set data id. */
        dataId = `${dest}:${innerPath}`

        /* Build package. */
        pkg = { action, dataId }
    } else if (query.length === 40) {
        /* Set action. */
        action = 'GET'

        /* Set info hash. */
        infoHash = query

        /* Set inner path. */
        innerPath = 'torrent'

        /* Set data id. */
        dataId = `${infoHash}:${innerPath}`

        /* Build package. */
        pkg = { action, dataId }
    } else if (query.slice(0, 20) === 'magnet:?xt=urn:btih:') {
        /* Set action. */
        action = 'GET'

        /* Retrieve info hash. */
        infoHash = query.slice(20, 60)

        /* Set inner path. */
        innerPath = 'torrent'

        /* Set data id. */
        dataId = `${infoHash}:${innerPath}`

        /* Build package. */
        pkg = { action, dataId }
    } else {
        /* Set action. */
        action = 'SEARCH'

        /* Build package. */
        pkg = { action, query }
    }

    /* Send package. */
    if (_send0penMessage(pkg)) {
        /* Reset search. */
        App._resetSearch()
    }
}

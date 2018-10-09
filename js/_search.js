/**
 * Search
 *
 * Handles ALL submissions from the Zite | Search input.
 */
const _search = async function () {
    /* Retrieve search query. */
    const query = inpZiteSearch.val()

    _addLog(`User submitted a query for [ ${query} ]`)

    /* Show "connecting..." notification. */
    await _wait('Zitetag | Search', `Processing request for<br />[ <strong class="text-primary">${query}</strong> ]`, 'Please wait...')

    /**
     * Reset Search
     */
    const _resetSearch = () => {
        /* Clear search input. */
        inpZiteSearch.val('')

        /* Remove focus from search elements. */
        inpZiteSearch.blur()
        btnZiteSearch.blur()
    }

    /* Initialize holders. */
    let action = null
    let dest = null
    let infoHash = null
    let innerPath = null
    let pkg = null

    /* Basic validation. */
    if (!query || query === '' || !query.length) {
        return
    }

    if (query.slice(0, 10).toUpperCase() === 'DEBUG.MENU') {
        /* Clear open modals. */
        _clearModals()

        /* Show ADMIN permission modal. */
        $('#modalDebug').modal({
            backdrop: 'static',
            keyboard: false
        })

        /* Enable test buttons. */
        $('.btnModalDebugTest2').click(() => {
            inpZiteSearch.val('getfile:1ExPLorERDSCnrYHM3Q1m6rQbTq7uCprqF:index.html')
            _search()
        })
        $('.btnModalDebugTest3').click(() => {
            inpZiteSearch.val('getfile:1ExPLorERDSCnrYHM3Q1m6rQbTq7uCprqF:images/screen-01.png')
            _search()
        })
        $('.btnModalDebugTest4').click(() => {
            inpZiteSearch.val('2f67b0e5933e5b37af877ed19686368b4937b404')
            _search()
        })
        $('.btnModalDebugDbDumps').click(async () => {
            /* Initialize options. */
            const options = {
                // include_docs: true
            }

            /* Initialize holders. */
            let docs = null
            let body = null

            /* Process MAIN database. */
            docs = await _dbManager['main'].allDocs(options)
                .catch(_errorHandler)
            body = `<h1>Main</h1><pre><code>${JSON.stringify(docs, null, 4)}</code></pre>`

            /* Process FILES database. */
            docs = await _dbManager['files'].allDocs(options)
                .catch(_errorHandler)
            body += `<hr /><h1>Files</h1><pre><code>${JSON.stringify(docs, null, 4)}</code></pre>`

            /* Process OPTIONAL database. */
            docs = await _dbManager['optional'].allDocs(options)
                .catch(_errorHandler)
            body += `<hr /><h1>Optional Files</h1><pre><code>${JSON.stringify(docs, null, 4)}</code></pre>`

            /* Process BLOCKS database. */
            docs = await _dbManager['blocks'].allDocs(options)
                .catch(_errorHandler)
            body += `<hr /><h1>Blocks</h1><pre><code>${JSON.stringify(docs, null, 4)}</code></pre>`

            /* Build gatekeeper package. */
            const pkg = { body }

            /* Send package to gatekeeper. */
            _gatekeeperMsg(pkg)
        })

        /* Reset search. */
        _resetSearch()
    } else if (query.slice(0, 7).toUpperCase() === 'GETFILE' && query.length > 10) {
        /* Retrieve target. */
        const target = query.slice(8)

        /* Retrieve destination. */
        dest = target.split(':')[0]

        /* Retrieve inner path. */
        innerPath = target.split(':')[1]

        /* Set action. */
        action = 'GETFILE'

        /* Build package. */
        pkg = { action, dest, innerPath }
    } else if (query.slice(0, 1) === '1' && (query.length === 33 || query.length === 33)) {
        /* Set action. */
        action = 'GETFILE'

        /* Set destination. */
        dest = query

        /* Build package. */
        pkg = { action, dest, innerPath: 'index.html' }
    } else {
        // TEMP Test for public key
        if (query.slice(0, 1) === '1' && (query.length === 33 || query.length === 34)) {
            /* Retrieve destination. */
            dest = query

            /* Set action. */
            action = 'GETINFO'

            /* Build package. */
            pkg = { action, query }
        // TEMP Test for info hash
        } else if (query.length === 40) {
            /* Retrieve info hash. */
            infoHash = query

            /* Set action. */
            action = 'GETINFO'

            /* Build package. */
            pkg = { action, query }
        // TEMP Test for magnet link
        } else if (query.slice(0, 20) === 'magnet:?xt=urn:btih:') {
            /* Retrieve info hash. */
            infoHash = query.slice(20, 60)

            /* Set action. */
            action = 'GETINFO'

            /* Build package. */
            pkg = { action, query }
        } else {
            /* Set action. */
            action = 'GETINFO'

            /* Build package. */
            pkg = { action, query }
        }
    }

    /* Send package. */
    if (_send0penMessage(pkg)) {
        /* Reset search. */
        _resetSearch()
    }
}

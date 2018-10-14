/**
 * Handle SEARCH
 */
const _handleSearch = function (_data) {
    /* Validate data. */
    if (_data && _data.dest && _data.innerPath) {
        return _handleConfig(_data)
    }

    /* Retrieve search result. */
    const body = _data.result

    /* Build gatekeeper package. */
    const pkg = { body }

    /* Send package to gatekeeper. */
    _gatekeeperMsg(pkg)

    /* Clear modals. */
    _clearModals()
}

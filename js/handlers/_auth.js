/**
 * Handle 0NET Authorization
 */
const _handleAuth = function (_data) {
    /* Validate data. */
    if (!_data || !_data.account) {
        return null
    }

    /* Retrieve the account. */
    const account = _data.account

    /* Format body. */
    const body = `
<h3>My Account<br />${account}</h3>
<br /><hr /><br />
    `

    /* Validate body. */
    if (body) {
        /* Build zerovue package. */
        pkg = { body, prepend: true }

        /* Send package to zerovue. */
        _zerovueMsg(pkg)
    }

    /* Clear modals. */
    _clearModals()
}

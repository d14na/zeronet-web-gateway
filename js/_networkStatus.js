/* Initialize search fields. */
const networkStatusLogs = $('.networkStatusLogs')
const networkStatusSettings = $('.networkStatusSettings')
const networkStatusShowAll = $('.networkStatusShowAll')

networkStatusLogs.click(() => {
    /* Initialize body. */
    let body = ''

    body += '<pre>'

    for (let entry of logMgr.reverse()) {
        body += `${entry}\n`
    }

    body += '</pre>'

    /* Build gatekeeper package. */
    pkg = { body }

    /* Send package to gatekeeper. */
    _gatekeeperMsg(pkg)
})

networkStatusSettings.click(() => {
    alert('show settings')
})

networkStatusShowAll.click(() => {
    alert('show ALL activities')
})

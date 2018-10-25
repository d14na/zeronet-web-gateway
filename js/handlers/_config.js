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

    /* Write to database. */
    _dbWrite(dbName, dataId, config)

    /* Format (display) body. */
    let body = `
<h1>${isSignatureValid ? 'File Signature is VALID' : 'File Signature is INVALID'}</h1>
<pre><code>${JSON.stringify(config, null, 4)}</code></pre>
    `

    /* Initialize action. */
    let action = null

    /* Initialize package. */
    let pkg = null

    /* Initialize body builder. */
    let bodyBuilder = {}

    /* Start file verification. */
    for (let file in config.files) {
        /* Set db name. */
        dbName = 'files'

        /* Set data id. */
        dataId = `${_data.dest}:${file}`
        console.log(`Verifying [ ${dataId} ] in [ ${dbName} ]`)

        let fileData = await _dbRead(dbName, dataId)
        console.log(`[ ${dataId} ]`)
        // console.log(`[ ${dataId} ]`, fileData)

        /* Add file data to body builder. */
        bodyBuilder[file] = fileData

        if (!fileData) {
            console.log(`Requesting [ ${dataId} ] data.`)

            /* Set action. */
            action = 'GET'

            /* Build package. */
            pkg = { action, dataId }

            /* Send message request. */
            _send0penMessage(pkg)
        }
    }

    /* Validate required files. */
    if (Object.keys(config.files).length === Object.keys(bodyBuilder).length) {
        body = bodyBuilder['index.html']['data']

        /* Parse file data. */
        body = _formatFileData(body, 'html')

        /* Initilize start pos. */
        let startPos = 0

        /* Initilize end pos. */
        let endPos = 0

        /* Initialize elem. */
        let elem = ''

        /* Initialize number of found elements. */
        let numElem = 0

        /* Set max elements. */
        const MAX = 100

        while (body.indexOf('<link', startPos) !== -1 && numElem < MAX) {
            /* Set starting position. */
            startPos = body.indexOf('<link', startPos)

            /* Set ending position. */
            endPos = body.indexOf('>', startPos + 1)

            /* Validate element end position. */
            if (endPos < startPos) {
                console.error('Continuing past BAD ELEMENT @', startPos)
                continue
            }

            /* Retrieve element. */
            elem = body.slice(startPos, endPos + 1)

            if (
                elem.includes('href="https://') ||
                elem.includes('href="http://') ||
                elem.includes('href="//')
            ) {
                console.log('FOUND (CLEAN) ELEMENT', elem)
            } else {
                console.log('FOUND (BAD) ELEMENT', elem)

                /* Retrieve the resource relationship. */
                let rel = $(elem).attr('rel')
                console.log('JQUERY FOUND [rel]', rel)

                /* Retrieve the resource type. */
                let type = $(elem).attr('type')
                console.log('JQUERY FOUND [type]', type)

                /* Retrieve the resource location. */
                let href = $(elem).attr('href')
                console.log('JQUERY FOUND [href]', href)

                if (rel === 'stylesheet') {
                    let preBody = body.slice(0, startPos)
                    let postBody = body.slice(endPos + 1)

                    let inline = bodyBuilder[href]['data']

                    /* Parse file data. */
                    inline = _formatFileData(inline, 'css')

                    console.log('Updating body', preBody.length, inline.length, postBody.length)

                    /* Update body. */
                    body = `${preBody}${inline}${postBody}`
                }
            }

            /* Set next position. */
            startPos = endPos + 1

            /* Increment number of found elements. */
            numElem++
        }

        /* Reset start position. */
        startPos = 0

        while (body.indexOf('<img', startPos) !== -1 && numElem < MAX) {
            /* Set starting position. */
            startPos = body.indexOf('<img', startPos)

            /* Set ending position. */
            endPos = body.indexOf('>', startPos + 1)

            /* Validate element end position. */
            if (endPos < startPos) {
                console.error('Continuing past BAD ELEMENT @', startPos)
                continue
            }

            /* Retrieve element. */
            elem = body.slice(startPos, endPos + 1)

            if (
                elem.includes('href="https://') ||
                elem.includes('href="http://') ||
                elem.includes('href="//')
            ) {
                console.log('FOUND (CLEAN) ELEMENT', elem)
            } else {
                console.log('FOUND (BAD) ELEMENT', elem)

                /* Retrieve the image source. */
                // FIXME Why is jQuery trying to `parseHTML` on img source??
                // let src = $(elem).attr('src')
                // console.log('JQUERY FOUND [src]', src)
                // <img class="img col-4 mb-3" src="images/icon.png" alt="D14na">
                let srcStart = elem.indexOf('src="')
                let srcEnd = elem.indexOf('"', srcStart + 5)
                let src = elem.slice(srcStart + 5, srcEnd)
                console.log('FOUND [src]', src)

                let preBody = body.slice(0, startPos)
                let postBody = body.slice(endPos + 1)

                let inline = bodyBuilder[src]['data']

                /* Parse file data. */
                inline = elem.replace(src, _formatFileData(inline, 'png'))

                console.log('Updating body', preBody.length, inline.length, postBody.length)

                /* Update body. */
                body = `${preBody}${inline}${postBody}`
            }

            /* Set next position. */
            startPos = endPos + 1

            /* Increment number of found elements. */
            numElem++
        }

        /* Reset start position. */
        startPos = 0

        while (body.indexOf('<div style="background-image', startPos) !== -1 && numElem < MAX) {
            /* Set starting position. */
            startPos = body.indexOf('<div style="background-image', startPos)

            /* Set ending position. */
            endPos = body.indexOf('>', startPos + 1)

            /* Validate element end position. */
            if (endPos < startPos) {
                console.error('Continuing past BAD ELEMENT @', startPos)
                continue
            }

            /* Retrieve element. */
            elem = body.slice(startPos, endPos + 1)

            if (
                elem.includes('href="https://') ||
                elem.includes('href="http://') ||
                elem.includes('href="//')
            ) {
                console.log('FOUND (CLEAN) ELEMENT', elem)
            } else {
                console.log('FOUND (BAD) ELEMENT', elem)

                /* Retrieve the image source. */
                let url = $(elem).css('background-image')
                // let url = $(elem).attr('url')
                let src = url.slice(5, -2)
                console.log('JQUERY FOUND [url / src]', url, src)

                let preBody = body.slice(0, startPos)
                let postBody = body.slice(endPos + 1)

                let inline = bodyBuilder[src]['data']

                /* Parse file data. */
                inline = elem.replace(src, _formatFileData(inline, 'jpg'))

                console.log('Updating body', preBody.length, inline.length, postBody.length)

                /* Update body. */
                body = `${preBody}${inline}${postBody}`
            }

            /* Set next position. */
            startPos = endPos + 1

            /* Increment number of found elements. */
            numElem++
        }

        console.log('BODY BUILDER', body)
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

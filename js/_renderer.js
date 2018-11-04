/* Set constants. */
const RETRY_BUILD_DELAY = 1000

/* Set max elements. */
// TEMP FOR DEVELOPMENT PURPOSES ONLY
const SAFETY_MAX = 1000

/* Initialize number of handled elements. */
let _numHandled = 0

/**
 * HTML Page Renderer
 */
const _renderer = function (_dest, _config) {
    console.log('HTML BODY RENDERER CALLED', new Date())

    /* Validate destination. */
    if (!App.ziteMgr[_dest] || !App.ziteMgr[_dest]['data']) {
        return console.error(`No DATA found for [ ${_dest} ]`)
    }

    /* Validate start page (index.html). */
    // FIXME Add support for other zite pages.
    if (!App.ziteMgr[_dest]['data']['index.html']) {
        console.error(`No START PAGE found for [ ${_dest} ]`)

        /* Retry body builder (after delay). */
        return setTimeout(() => {
            console.log('FAILED INDEX.HTML CHECK')
            _renderer(_dest, _config)
        }, RETRY_BUILD_DELAY)
    } else {
        /* Set start page (index.html). */
        let startPage = App.ziteMgr[_dest]['data']['index.html']

        /* Format start page. */
        startPage = _formatFileData(startPage, 'html')

        /* Set start page. */
        App.ziteMgr[_dest]['body'] = startPage
    }

    /* Initilize start pos. */
    let startPos = 0

    /* Initilize end pos. */
    let endPos = 0

    /* Set path starting index. */
    let pathStart = 0

    /* Set path ending index. */
    let pathEnd = 0

    /* Set starting match. */
    let startMatch = `<link`

    /* Set ending match. */
    let endMatch = `>`

    /* LINK */
    while (App.ziteMgr[_dest]['body'].indexOf(startMatch, startPos) !== -1 && _numHandled < SAFETY_MAX) {
        /* Handle element, then update start position. */
        startPos = _handleElem(_dest, startPos, startMatch, endMatch)
    }

    /* Reset start position. */
    startPos = 0

    /* Reset starting match. */
    startMatch = `<img`

    /* Reset ending match. */
    endMatch = `>`

    /* LINK */
    while (App.ziteMgr[_dest]['body'].indexOf(startMatch, startPos) !== -1 && _numHandled < SAFETY_MAX) {
        /* Handle element, then update start position. */
        startPos = _handleElem(_dest, startPos, startMatch, endMatch)
    }

    while (App.ziteMgr[_dest]['body'].indexOf('<script', startPos) !== -1 && _numHandled < SAFETY_MAX) {
        break
        /* Set starting position. */
        startPos = App.ziteMgr[_dest]['body'].indexOf('<script', startPos)

        /* Set ending position. */
        endPos = App.ziteMgr[_dest]['body'].indexOf('script>', startPos + 7) + 7

        /* Validate element end position. */
        if (endPos < startPos) {
            console.error('Continuing past BAD ELEMENT @', startPos)
            continue
        }

        /* Retrieve element. */
        elem = App.ziteMgr[_dest]['body'].slice(startPos, endPos)

        if (
            elem.includes('href="https://') ||
            elem.includes('href="http://') ||
            elem.includes('href="//')
        ) {
            // console.log('Found (Remote) Element', elem)
        } else {
            console.log('Found (Local) Element', startPos, elem)

            /* Retrieve the resource relationship. */
            // let rel = $(elem).attr('rel')
            // console.log('Parsed [rel]', rel)

            /* Retrieve the resource type. */
            let type = $(elem).attr('type')
            console.log('Parsed [type]', type)

            /* Retrieve the resource location. */
            let src = $(elem).attr('src')
            console.log('Parsed [src]', src)

            /* Validate JavaScript. */
            if (src || type === 'text/javascript') {
                let preBody = App.ziteMgr[_dest]['body'].slice(0, startPos)
                let postBody = App.ziteMgr[_dest]['body'].slice(endPos)

                let inline = App.ziteMgr[_dest]['data'][src]

                /* Parse file data. */
                inline = _formatFileData(inline, 'js')

                /* Update body. */
                App.ziteMgr[_dest]['body'] = `${preBody}${inline}${postBody}`
            }
        }

        /* Set next position. */
        startPos = endPos + 1

        /* Increment number of handled elements. */
        _numHandled++
    }

    /* Reset start position. */
    startPos = 0

    // NOTE THIS IS THE FIRST EXEMPTION NEEDED TO SUPPORT PNG IMAGES
    //      EMBEDDED IN EXTERNAL SCRIPT FILES.

    while (App.ziteMgr[_dest]['body'].indexOf('src: "', startPos) !== -1 && _numHandled < SAFETY_MAX) {
        break
        /* Set starting position. */
        startPos = App.ziteMgr[_dest]['body'].indexOf('src: "', startPos)

        /* Set ending position. */
        endPos = App.ziteMgr[_dest]['body'].indexOf('"', startPos + 6)

        /* Validate element end position. */
        if (endPos < startPos) {
            console.error('Continuing past BAD ELEMENT @', startPos)
            continue
        }

        /* Retrieve element. */
        elem = App.ziteMgr[_dest]['body'].slice(startPos + 6, endPos)

        if (
            elem.includes('https://') ||
            elem.includes('http://') ||
            elem.includes('//')
        ) {
            // console.log('Found (Remote) Element', elem)
        } else {
            console.log('Found (Local) Element', elem)

            /* Retrieve the resource relationship. */
            // let rel = $(elem).attr('rel')
            // console.log('Parsed [rel]', rel)

            /* Retrieve the resource type. */
            // let type = $(elem).attr('type')
            // console.log('Parsed [type]', type)

            /* Retrieve the resource location. */
            // let src = $(elem).attr('src')
            // console.log('Parsed [src]', src)

            // if (type === 'text/javascript') {
            let preBody = App.ziteMgr[_dest]['body'].slice(0, startPos + 6)
            let postBody = App.ziteMgr[_dest]['body'].slice(endPos)

            let inline = App.ziteMgr[_dest]['data'][elem]

            /* Parse file data. */
            inline = _formatFileData(inline, 'png')

            /* Update body. */
            App.ziteMgr[_dest]['body'] = `${preBody}${inline}${postBody}`
            // }
        }

        /* Set next position. */
        startPos = endPos + 1

        /* Increment number of handled elements. */
        _numHandled++
    }

    /* Reset start position. */
    startPos = 0

    while (App.ziteMgr[_dest]['body'].indexOf('<img', startPos) !== -1 && _numHandled < SAFETY_MAX) {
        break
        /* Set starting position. */
        startPos = App.ziteMgr[_dest]['body'].indexOf('<img', startPos)

        /* Set ending position. */
        endPos = App.ziteMgr[_dest]['body'].indexOf('>', startPos + 1)

        /* Validate element end position. */
        if (endPos < startPos) {
            console.error('Continuing past BAD ELEMENT @', startPos)
            continue
        }

        /* Retrieve element. */
        elem = App.ziteMgr[_dest]['body'].slice(startPos, endPos + 1)

        if (
            elem.includes('href="https://') ||
            elem.includes('href="http://') ||
            elem.includes('href="//')
        ) {
            // console.log('Found (Remote) Element', elem)
        } else {
            console.log('Found (Local) Element', elem)

            /* Retrieve the image source. */
            // FIXME Why is jQuery trying to `parseHTML` on img source (url)??
            //       Of course it doesn't find it, then it throws an error??
            let srcStart = elem.indexOf('src="')
            let srcEnd = elem.indexOf('"', srcStart + 5)
            let src = elem.slice(srcStart + 5, srcEnd)
            console.log('Parsed [src]', src)

            let preBody = App.ziteMgr[_dest]['body'].slice(0, startPos)
            let postBody = App.ziteMgr[_dest]['body'].slice(endPos + 1)

            let inline = App.ziteMgr[_dest]['data'][src]

            /* Parse file data. */
            inline = elem.replace(src, _formatFileData(inline, 'png'))

            /* Update body. */
            App.ziteMgr[_dest]['body'] = `${preBody}${inline}${postBody}`
        }

        /* Set next position. */
        startPos = endPos + 1

        /* Increment number of handled elements. */
        _numHandled++
    }

    /* Reset start position. */
    startPos = 0

    while (App.ziteMgr[_dest]['body'].indexOf('<div style="background-image', startPos) !== -1 && _numHandled < SAFETY_MAX) {
        break
        /* Set starting position. */
        startPos = App.ziteMgr[_dest]['body'].indexOf('<div style="background-image', startPos)

        /* Set ending position. */
        endPos = App.ziteMgr[_dest]['body'].indexOf('>', startPos + 1)

        /* Validate element end position. */
        if (endPos < startPos) {
            console.error('Continuing past BAD ELEMENT @', startPos)
            continue
        }

        /* Retrieve element. */
        elem = App.ziteMgr[_dest]['body'].slice(startPos, endPos + 1)

        if (
            elem.includes('href="https://') ||
            elem.includes('href="http://') ||
            elem.includes('href="//')
        ) {
            // console.log('Found (Remote) Element', elem)
        } else {
            console.log('Found (Local) Element', elem)

            /* Retrieve the image source. */
            let url = $(elem).css('background-image')

            // FIXME Safari & iOS are prepending (https://web.0net.io/)
            url = url.replace(/https:\/\/web.0net.io\//, '')

            let src = url.slice(5, -2)
            console.log('Parsed [url / src]', url, src)

            let preBody = App.ziteMgr[_dest]['body'].slice(0, startPos)
            let postBody = App.ziteMgr[_dest]['body'].slice(endPos + 1)

            let inline = App.ziteMgr[_dest]['data'][src]

            /* Parse file data. */
            inline = elem.replace(src, _formatFileData(inline, 'jpg'))

            /* Update body. */
            App.ziteMgr[_dest]['body'] = `${preBody}${inline}${postBody}`
        }

        /* Set next position. */
        startPos = endPos + 1

        /* Increment number of handled elements. */
        _numHandled++
    }

    /* Validate required files. */
    if (Object.keys(_config.files).length === Object.keys(App.ziteMgr[_dest]['data']).length) {
        // console.log('BODY BUILDER', App.ziteMgr[_dest]['body'])

        /* Validate body. */
        if (App.ziteMgr[_dest]['body']) {
            /* Set body. */
            const body = App.ziteMgr[_dest]['body']

            /* Build gatekeeper package. */
            const pkg = { body }

            /* Send package to gatekeeper. */
            _gatekeeperMsg(pkg)

            console.log('SEND WRAPPER READY MESSAGE')
            return _gatekeeperMsg({ cmd: 'wrapperReady' })
        }

        /* Clear modals. */
        _clearModals()
    } else {
        /* Set num files required. */
        const numRequired = Object.keys(_config.files).length

        /* Set num files available. */
        const numAvail = Object.keys(App.ziteMgr[_dest]['data']).length

        console.error(`[ ${_dest} ] missing [ ${numRequired - numAvail} ] pieces.`)

        /* Retry body builder (after delay). */
        setTimeout(() => {
            console.log('FAILED REQUIRED FILES CHECK')
            _renderer(_dest, _config)
        }, RETRY_BUILD_DELAY)
    }
}

/**
 * Handle Element
 */
const _handleElem = function (_dest, _startIndex, _startMatch, _endMatch) {
    /* Set body. */
    const body = App.ziteMgr[_dest]['body']

    /* Set starting position. */
    _startIndex = body.indexOf(_startMatch, _startIndex)

    /* Set ending position. */
    const endPos = body.indexOf(_endMatch, _startIndex + _startMatch.length) +
        _endMatch.length

    /* Validate element end position. */
    if (endPos < _startIndex) {
        console.error(
            `Continuing past a BAD element @ [ ${_startIndex} ] [ ${body.slice(_startIndex, _startIndex + 50)} ]`)

        /* Return next start position. */
        return (_startIndex + _startMatch.length)
    }

    /* Retrieve element. */
    let elem = body.slice(_startIndex, endPos)

    /* Validate (external) resources. */
    if (
        elem.includes(`href="https://`) ||
        elem.includes(`href="http://`) ||
        elem.includes(`href="//`)
    ) {
        // SKIP -- DO NOTHING FOR NOW

        // FIXME We would like to provide the user with the options to
        //       block ALL external resources, allowing ONLY those which
        //       are pre-approved (eg. ZeroCDN and ZeroPEN) and/or
        //       approval PER EACH ZITE expressly granted by the user.

        /* Return next start position. */
        return (_startIndex + _startMatch.length)
    }

    console.log('Found (Local) Element', elem)

    /* Initialize path starting index. */
    let pathStart = null

    /* Set path starting index. */
    if (elem.indexOf(`href="`) !== -1) {
        pathStart = elem.indexOf(`href="`) + 6
    } else if (elem.indexOf(`src="`) !== -1) {
        pathStart = elem.indexOf(`src="`) + 5
    }

    /* Validate path starting index. */
    if (!pathStart) {
        console.error(
            `Continuing past a BAD element [ ${elem} ]`)

        /* Return next start position. */
        return (_startIndex + _startMatch.length)
    }

    /* Set path ending index. */
    let pathEnd = elem.indexOf(`"`, pathStart)

    /* Set local path. */
    let localPath = elem.slice(pathStart, pathEnd)

    console.info(`Parsed a (Local) Element [ ${localPath} ]`)

    /* Set file extension. */
    let fileExt = localPath.slice(-4)

    /* Validate file extension. */
    // TODO Improve with regex
    if (fileExt.slice(0, 1) === '.') {
        /* Remove dot. */
        fileExt = fileExt.slice(1).toUpperCase()
    } else {
        console.error(
            `Continuing past a BAD path [ ${localPath} ] [ ${fileExt} ]`)

        /* Return next start position. */
        return (_startIndex + _startMatch.length)
    }

    /* Handle inlined file data. */
    if (fileExt === 'CSS') {
        /* Set prepended body. */
        let prepend = body.slice(0, _startIndex)

        /* Set appended body. */
        let append = body.slice(endPos)

        /* Set inlined (file data). */
        let inline = App.ziteMgr[_dest]['data'][localPath]

        /* Parse inlined (file data). */
        inline = _formatFileData(inline, fileExt)

        /* Update zite manager (body). */
        App.ziteMgr[_dest]['body'] = `${prepend}<style>${inline}</style>${append}`
    } else if (fileExt === 'PNG') {
        /* Set prepended body. */
        let prepend = body.slice(0, _startIndex + pathStart)

        /* Set appended body. */
        let append = body.slice(_startIndex + pathEnd)

        /* Set inlined (file data). */
        let inline = App.ziteMgr[_dest]['data'][localPath]

        /* Parse inlined (file data). */
        inline = _formatFileData(inline, fileExt)

        /* Update zite manager (body). */
        App.ziteMgr[_dest]['body'] = `${prepend}${inline}${append}`
    } else {
        console.error(`Unhandled extension found [ ${fileExt} ] for [ ${localPath} ]`)
    }

    /* Increment number of handled elements. */
    _numHandled++

    /* Return next (start) position. */
    return endPos
}

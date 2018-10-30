/* Set constants. */
const RETRY_BUILD_DELAY = 1000

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

    /* Initialize elem. */
    let elem = ''

    /* Initialize number of found elements. */
    let numElem = 0

    /* Set max elements. */
    // TEMP FOR DEVELOPMENT PURPOSES ONLY
    const MAX = 100

    while (App.ziteMgr[_dest]['body'].indexOf('<link', startPos) !== -1 && numElem < MAX) {
        /* Set starting position. */
        startPos = App.ziteMgr[_dest]['body'].indexOf('<link', startPos)

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

            /* Retrieve the resource relationship. */
            let rel = $(elem).attr('rel')
            console.log('Parsed [rel]', rel)

            /* Retrieve the resource type. */
            let type = $(elem).attr('type')
            console.log('Parsed [type]', type)

            /* Retrieve the resource location. */
            let href = $(elem).attr('href')
            console.log('Parsed [href]', href)

            if (rel === 'stylesheet') {
                let preBody = App.ziteMgr[_dest]['body'].slice(0, startPos)
                let postBody = App.ziteMgr[_dest]['body'].slice(endPos + 1)

                let inline = App.ziteMgr[_dest]['data'][href]

                /* Parse file data. */
                inline = _formatFileData(inline, 'css')

                /* Update body. */
                App.ziteMgr[_dest]['body'] = `${preBody}${inline}${postBody}`
            }
        }

        /* Set next position. */
        startPos = endPos + 1

        /* Increment number of found elements. */
        numElem++
    }

    /* Reset start position. */
    startPos = 0

    while (App.ziteMgr[_dest]['body'].indexOf('<script', startPos) !== -1 && numElem < MAX) {
        /* Set starting position. */
        startPos = App.ziteMgr[_dest]['body'].indexOf('<script', startPos)

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

            /* Retrieve the resource relationship. */
            // let rel = $(elem).attr('rel')
            // console.log('Parsed [rel]', rel)

            /* Retrieve the resource type. */
            let type = $(elem).attr('type')
            console.log('Parsed [type]', type)

            /* Retrieve the resource location. */
            let src = $(elem).attr('src')
            console.log('Parsed [src]', src)

            if (type === 'text/javascript') {
                let preBody = App.ziteMgr[_dest]['body'].slice(0, startPos)
                let postBody = App.ziteMgr[_dest]['body'].slice(endPos + 1)

                let inline = App.ziteMgr[_dest]['data'][src]

                /* Parse file data. */
                inline = _formatFileData(inline, 'js')

                /* Update body. */
                App.ziteMgr[_dest]['body'] = `${preBody}${inline}${postBody}`
            }
        }

        /* Set next position. */
        startPos = endPos + 1

        /* Increment number of found elements. */
        numElem++
    }

    /* Reset start position. */
    startPos = 0

    // NOTE THIS IS THE FIRST EXEMPTION NEEDED TO SUPPORT PNG IMAGES
    //      EMBEDDED IN EXTERNAL SCRIPT FILES.

    while (App.ziteMgr[_dest]['body'].indexOf('src: "', startPos) !== -1 && numElem < MAX) {
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

        /* Increment number of found elements. */
        numElem++
    }

    /* Reset start position. */
    startPos = 0

    while (App.ziteMgr[_dest]['body'].indexOf('<img', startPos) !== -1 && numElem < MAX) {
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

        /* Increment number of found elements. */
        numElem++
    }

    /* Reset start position. */
    startPos = 0

    while (App.ziteMgr[_dest]['body'].indexOf('<div style="background-image', startPos) !== -1 && numElem < MAX) {
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

        /* Increment number of found elements. */
        numElem++
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

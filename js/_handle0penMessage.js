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
    const body = `<hr /><h3>My Account<br />${account}</h3>`

    /* Return body. */
    return body
}

/**
 * Handle WHOAMI
 */
const _handleWhoAmI = function (_data) {
    /* Retrieve the identity. */
    const identity = _data.identity

    /* Retrieve the ip address. */
    const ip = _data.ip

    /* Retrieve the port number. */
    const port = _data.port

    /* Retrieve the city. */
    const city = _data.city

    /* Retrieve the country. */
    const country = _data.country

    /* Set address. */
    const address = `${ip}:${port}`

    /* Authorize connection. */
    _authRequest(address)

    /* Calculate peer id. */
    const peerId = CryptoJS.SHA1(address).toString()

    /* Initialize verification. */
    let verification = null

    // console.log('VERIFICATION', identity, peerId, identity === peerId)

    if (identity === peerId) {
        verification = 'VERIFIED'
    } else {
        verification = 'FAILED'
    }

    /* Format body. */
    body = `
<hr /><h3>0PEN Identity<br />${identity}</h3>
<hr /><h3>My Location<br />${ip}:${port} [ ${city}, ${country} ]</h3>
<hr /><h3>${verification} Peer Id [ SHA-1(ip:port) ]<br />${peerId}</h3>
    `

    /* Return body. */
    return body
}

/**
 * Handle Zeronet Configuration
 */
const _handleConfig = async function (_data) {
    /* Verify the signature of the configuraton (content.json). */
    const isSignatureValid = await verifyConfig(_data)
        .catch((err) => console.error('Could NOT verify Zeronet config', _data))

    /* Validate signature. */
    if (!isSignatureValid) {
        /* Show alert. */
        return _alert(
            'Oops! Validation Error!',
            'Failed to validate signature!',
            'Please try your request again...',
            false
        )
    }

    /* Initailize database values. */
    const dbName = 'main'
    const dataLabel = `${_data.config.address}:content.json`
    const data = _data.config

    /* Write to database. */
    _dbWrite(dbName, dataLabel, data)

    /* Format (display) body. */
    body = `
<h1>${isSignatureValid ? 'File Signature is VALID' : 'File Signature is INVALID'}</h1>
<pre><code>${JSON.stringify(_data.config, null, 4)}</code></pre>
    `

    return body
}

/**
 * Handle Torrent Info
 *
 * NOTE This is the same as .TORRENT file.
 */
const _handleInfo = async function (_data) {
    /* Retrieve torrent info. */
    const torrentInfo = data.torrentInfo
    console.log('TORRENT INFO', torrentInfo)

    /* Validate torrent info. */
    if (!torrentInfo) {
        return _errorHandler(`No torrent info found in [ ${JSON.stringify(_data.info)} ]`, false)
    }

    /* Initailize database values. */
    const dbName = 'main'
    const dataLabel = `${_data.info.infoHash}:torrent`
    const data = _data.info

    /* Write to database. */
    // _dbWrite(dbName, dataLabel, data)

    /* Initialize body (display). */
    body = '<pre><code>'

    /* Body header. */
    body += `<h3>${dataLabel}</h3><hr />`

    /* Convert name to (readable) string. */
    const torrentName = Buffer.from(torrentInfo['name']).toString()
    body += `<h3>${torrentName}</h3>`

    /* Retrieve the torrent's files. */
    const files = torrentInfo['files']

    /* Initialize file counter. */
    let fileCounter = 0

    /* Process the individual files. */
    for (let file of files) {
        /* Convert file path to (readable) string. */
        const filepath = Buffer.from(file.path[0], 'hex').toString()

        body += `<br />    #${++fileCounter}: ${filepath} { size: ${file.length} bytes }`
    }

    /* Retrieve torrent blocks. */
    const blocks = Buffer.from(torrentInfo['pieces'])
    body += '<br /><hr />'
    body += `<br />    ALL Hash Blocks [ length: ${blocks.length} ]`
    body += `<br /><textarea>${blocks.toString('hex')}</textarea>`

    /* Retrieve the block length. */
    const blockLength = parseInt(torrentInfo['piece length'])
    body += `<br />    Block Length   : ${blockLength} bytes`

    /* Calculate the number of hashes/blocks. */
    const numBlocks = blocks.length / BLOCK_HASH_LENGTH
    body += '<br /><hr />'
    body += `<br />    # Total Blocks : ${numBlocks}`

    const numBlockChunks = parseInt(blockLength / CHUNK_LENGTH)
    body += `<br />    # of Chunks per Block [ ${numBlockChunks} ]`

    body += '<br /><hr />'

    /* Process the hash list. */
    for (let i = 0; i < numBlocks; i++) {
        /* Calculate the hash start. */
        const start = (i * BLOCK_HASH_LENGTH)

        /* Calculate the hash end. */
        const end = (i * BLOCK_HASH_LENGTH) + BLOCK_HASH_LENGTH

        /* Retrieve the block's hash. */
        const buf = blocks.slice(start, end)

        /* Convert buffer to hex. */
        const hash = Buffer.from(buf).toString('hex')
        body += `<br />        Hash Block #${i}: ${hash}`
    }

    /* Finalize body (display). */
    body += '</code></pre>'

    return body
}

const _handleUnknown = function (_data) {
    return // FIXME We may not implement this report

    /* Format body. */
    const body = `<pre><code>
<h3>${dataLabel}</h3>
<hr />
${JSON.stringify(data, null, 4)}
    </code></pre>`

    return body
}

const _handle0penMessage = async function (_data) {
    /* Hide ALL modal windows. */
    // _clearModals()

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
                'Peer-to-Peer Search Error',
                data.error,
                'Please try your request again...',
                false
            )
        }

        /* Initialize action. */
        let action = null

        /* Retrieve the action from requests manager. */
        action = _getAction(data)

        console.log(`Retrieve ACTION [ ${action} ] from message.`)

        /* Handle search condition. */
        if (data.search) {
            action = 'SEARCH'
        }

        /* Validate action. */
        if (!action) {
            return _errorHandler(`No ACTION was found for [ ${JSON.stringify(data)} ]`, false)
        }

        /* Initialize body holders. */
        let body = null
        // let config = null
        // let dataLabel = null
        // let dbName = null
        // let dest = null
        // let files = null
        // let fileExt = null
        // let info = null
        // let innerPath = null
        // let isValid = null
        let pkg = null
        // let target = null

        switch (action.toUpperCase()) {
        case 'AUTH':
            /* Process authorization. */
            body = _handleAuth(data)

            /* Validate body. */
            if (body) {
                /* Build gatekeeper package. */
                pkg = { body, prepend: true }

                /* Send package to gatekeeper. */
                _gatekeeperMsg(pkg)
            }

            break
        case 'GET':
            /* Validate message destination. */
            if (data.dest) {
                /* Retrieve destination. */
                dest = data.dest
            } else {
                return _addLog(`Problem retrieving destination for [ ${JSON.stringify(data)} ]`)
            }

            /* Validate dest. */
            if (!dest || dest.slice(0, 1) !== '1' || (dest.length !== 33 && dest.length !== 34)) {
                return _addLog(`${dest} is an invalid public key.`)
            }

            config = await _dbRead('main', `${dest}:content.json`)
            console.log('FOUND CONFIG', config)

            /* Validate config. */
            if (!config || !config.data || !config.data.files) {
                return _addLog('Problem retrieving config (content.json) from database.')
            }

            /* Retrieve inner path. */
            innerPath = data.innerPath

            /* Parse file extension. */
            fileExt = innerPath.split('.').pop()

            /* Validate inner path. */
            if (!innerPath) {
                return _addLog(`Problem retrieving inner path [ ${innerPath} ]`)
            }

            /* Retrieve files list. */
            files = config.data.files

            /* Retrieve config size. */
            const configSize = files[innerPath].size

            /* Retrieve config hash. */
            const configHash = files[innerPath].sha512
            console.log(`${innerPath} size/hash`, configSize, configHash)

            /* Parse body. */
            if (data.body && data.body.type && data.body.type === 'Buffer') {
                body = Uint8Array.from(data.body.data)
            } else {
                body = data.body
            }

            /* Calculate file size. */
            const fileSize = parseInt(body.length)
            console.log(`File length [ ${fileSize} ]`)

            /* Calculate file verifcation hash. */
            const fileHash = calcHash(body)
            console.log(`File verification hash [ ${fileHash} ]`)

            /* Verify the signature of the file. */
            if (configSize === fileSize && configHash === fileHash) {
                isValid = true
            } else {
                isValid = false
            }

            _addLog(`${innerPath} validation hash is ${isValid}'`)

            if (isValid) {
                /* Initailize database values. */
                dbName = 'files'
                dataLabel = `${dest}:${innerPath}`
                data = body

                /* Write to database. */
                _dbWrite(dbName, dataLabel, data)

                /* Decode body. */
                switch (fileExt.toUpperCase()) {
                case 'HTM':
                case 'HTML':
                    body = body.toString()
                    break
                case 'PNG':
                    body = `<img class="img-fluid" src="data:image/png;base64,${_imgConverter(body)}" width="300">`
                    break
                default:
                    // NOTE Leave as buffer (for binary files).
                }

                /* Build gatekeeper package. */
                pkg = { body }
            } else {
                /* Generate error body. */
                body = `${innerPath} file verification FAILED!`

                /* Build gatekeeper package. */
                pkg = { body }
            }

            /* Send package to gatekeeper. */
            _gatekeeperMsg(pkg)

            break
        case 'SEARCH':
            /* Retrieve search result. */
            body = data.result

            /* Build gatekeeper package. */
            pkg = { body }

            /* Send package to gatekeeper. */
            _gatekeeperMsg(pkg)

            break
        case 'WHOAMI':
            /* Process authorization. */
            body = _handleWhoAmI(data)

            /* Validate body. */
            if (body) {
                /* Build gatekeeper package. */
                pkg = { body, prepend: true }

                /* Send package to gatekeeper. */
                _gatekeeperMsg(pkg)
            }

            break
        default:
            // nothing to do here
        }

        /* Clear modals. */
        _clearModals()
    } catch (_err) {
        _errorHandler(_err, false)
    }
}

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
        /* Build gatekeeper package. */
        pkg = { body, prepend: true }

        /* Send package to gatekeeper. */
        _gatekeeperMsg(pkg)
    }

    /* Clear modals. */
    _clearModals()
}

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

        /* Set network identity. */
        const networkIdentity = `${ip} &bullet; ${city}, ${country}`

        /* Set identity (display). */
        app._setIdentity(networkIdentity)
    } else {
        return _alert('Peer Id verificatino FAILED!')
    }

    /* Clear modals. */
    _clearModals()
}

/**
 * Handle Zeronet Configuration
 */
const _handleConfig = async function (_data) {
    console.log('CONFIG DATA', _data)

    if (!_data.body) {
        return console.log('ERROR retrieving config body', _data)
    }

    /* Initialize config. */
    let config = null

    try {
        /* Parse config data. */
        config = JSON.parse(Buffer.from(_data.body))

        console.log('CONFIG', config)
    } catch (_err) {
        console.log('ERROR parsing config data', _err)
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
            'Failed to validate signature!',
            'Please try your request again...',
            false
        )
    }

    /* Initailize database values. */
    const dbName = 'main'
    // NOTE data id DOES NOT exist for SEARCH requests (eg zitetags).
    const dataId = config.dataId || `${config.dest}:${config.innerPath}`
    const data = config

    /* Write to database. */
    _dbWrite(dbName, dataId, data)

    /* Format (display) body. */
    body = `
<br /><hr /><br />
<h1>${isSignatureValid ? 'File Signature is VALID' : 'File Signature is INVALID'}</h1>
<pre><code>${JSON.stringify(config, null, 4)}</code></pre>
    `

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

/**
 * Hanlde Zeronet File
 */
const _handleZeroFile = async function (_data) {

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
        dataId = `${dest}:${innerPath}`
        data = body

        /* Write to database. */
        _dbWrite(dbName, dataId, data)

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

    /* Clear modals. */
    _clearModals()
}

/**
 * Handle Torrent Info
 *
 * NOTE This is the same as .TORRENT file.
 */
const _handleInfo = async function (_data) {
    /* Set info hash. */
    const infoHash = _data.infoHash

    /* Set metadata. */
    const metadata = _data.metadata

    /* Validate metadata. */
    if (!metadata) {
        return _errorHandler(
            `Oops! No torrent info found in [ ${JSON.stringify(_data.info)} ]`, false)
    }

    /* Retrieve torrent info. */
    const torrentInfo = _verifyMetadata(infoHash, metadata)
    console.log('TORRENT INFO', torrentInfo)

    /* Verify torrent info. */
    if (torrentInfo) {
        _addLog(`[ ${infoHash} ] METADATA was verified successfully!`)
    } else {
        return _errorHandler(
            `Oops! Torrent metadata FAILED verification [ ${JSON.stringify(_data.info)} ]`, false)
    }

    /* Initailize database values. */
    const dbName = 'main'
    const dataId = _data.dataId
    const data = _data

    /* Write to database. */
    _dbWrite(dbName, dataId, data)

    /* Initialize body (display). */
    body = '<pre><code>'

    /* Body header. */
    body += `<h3>${dataId}</h3><hr />`

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
    body += `<br /><textarea cols=60 rows=6>${blocks.toString('hex')}</textarea>`

    /* Calculate the number of hashes/blocks. */
    const numBlocks = blocks.length / app.BLOCK_HASH_LENGTH
    body += '<br /><hr />'
    body += `<br />    # Total Blocks : ${numBlocks}`

    /* Retrieve the block length. */
    const blockLength = parseInt(torrentInfo['piece length'])
    body += `<br />    Block Length   : ${blockLength} bytes`

    const numBlockChunks = parseInt(blockLength / app.CHUNK_LENGTH)
    body += `<br />    (${numBlockChunks} chunks per block)`

    body += '<br /><hr />'

    /* Process the hash list. */
    for (let i = 0; i < numBlocks; i++) {
        /* Calculate the hash start. */
        const start = (i * app.BLOCK_HASH_LENGTH)

        /* Calculate the hash end. */
        const end = (i * app.BLOCK_HASH_LENGTH) + app.BLOCK_HASH_LENGTH

        /* Retrieve the block's hash. */
        const buf = blocks.slice(start, end)

        /* Convert buffer to hex. */
        const hash = Buffer.from(buf).toString('hex')
        body += `<br />        Hash Block #${i}: ${hash}`
    }

    /* Finalize body (display). */
    body += '</code></pre>'

    /* Validate body. */
    if (body) {
        /* Build gatekeeper package. */
        pkg = { body }

        /* Send package to gatekeeper. */
        _gatekeeperMsg(pkg)

        // TEMP Hard-coded request for block #7 (THE ENDGAME)
        const action = 'GET'
        const dataId = '01c227c8c9aac311f9365b163ea94708c27a7db4:7'
        pkg = { action, dataId }
        if(_send0penMessage(pkg)) {
            console.log('ENDGAME REQUEST SENT')
        }
    }

    /* Clear modals. */
    _clearModals()
}

const _handleUnknown = function (_data) {
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
                'Peer-to-Peer Search Error',
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
            if (data.dest && data.innerPath) {
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
            } else if (data.infoHash && data.metadata) {
                /* Verify info file. */
                if (data.dataId.split(':')[1] === 'torrent') {
                    return _handleInfo(data)
                }
            } else if (data.dataId && data.requestMgr) {
                console.log('BLOCK REQUEST MANAGER', data.requestMgr)
            } else if (data.dataId && data.blockBuffer) {
                console.log('BLOCK BUFFER', Buffer.from(data.blockBuffer))
                console.log('BLOCK BUFFER HASH', calcInfoHash(Buffer.from(data.blockBuffer)))
            } else {
                return _addLog(`ERROR processing GET request for [ ${JSON.stringify(data)} ]`)
            }

            break
        case 'NOTIF':
            /* Handle response. */
            return app.msgList.push(data)
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

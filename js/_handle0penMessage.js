const _handle0penMessage = async function (_msg) {
    /* Hide ALL modal windows. */
    _clearModals()

    try {
        /* Parse incoming message. */
        let msg = JSON.parse(_msg)
        console.log('Received', msg)

        /* Validate message. */
        if (!msg) {
            return _addLog(`Error processing [ ${JSON.stringify(msg)} ]`)
        }

        /* Validate response. */
        if (msg.error) {
            /* Show alert. */
            return _alert(
                'Zitetag | Search Error',
                msg.error,
                'Please try your request again...',
                false
            )
        }

        /* Initialize action. */
        let action = null

        /* Retrieve the action from requests manager. */
        action = _getAction(msg)

        /* Handle search condition. */
        if (msg.search) {
            action = 'SEARCH'
        }

        /* Validate action. */
        if (!action) {
            return _errorHandler(`No ACTION was found for [ ${JSON.stringify(msg)} ]`, false)
        }

        /* Initialize body holders. */
        let body = null
        let config = null
        let data = null
        let dataLabel = null
        let dbName = null
        let dest = null
        let files = null
        let fileExt = null
        let info = null
        let innerPath = null
        let isValid = null
        let pkg = null
        let target = null

        switch (action.toUpperCase()) {
        case 'AUTH':
            /* Retrieve the account. */
            account = msg.account

            /* Format body. */
            body = `
<h3 class="badge badge-info mt-1">My Peer Id: ${peerId}</h3>
<h3 class="badge badge-info">My Location: ${identity}</h3>
<h3 class="badge badge-info">My Account: ${account}</h3>
            `

            /* Build gatekeeper package. */
            pkg = { body }

            /* Send package to gatekeeper. */
            _gatekeeperMsg(pkg)

            /* Clear modals. */
            _clearModals()

            break
        case 'GETFILE':
            /* Validate message destination. */
            if (msg.dest) {
                /* Retrieve destination. */
                dest = msg.dest
            } else {
                return _addLog(`Problem retrieving destination for [ ${JSON.stringify(msg)} ]`)
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
            innerPath = msg.innerPath

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
            if (msg.body && msg.body.type && msg.body.type === 'Buffer') {
                body = Uint8Array.from(msg.body.data)
            } else {
                body = msg.body
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
        case 'GETINFO':
            if (msg.config) {
                /* Verify the signature of the configuraton (content.json). */
                const isSignatureValid = await _verifyConfig(msg.config)
                    .catch((err) => console.error('Could NOT verify config', msg))

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
                dbName = 'main'
                dataLabel = `${msg.config.address}:content.json`
                data = msg.config

                /* Write to database. */
                _dbWrite(dbName, dataLabel, data)

                /* Format body. */
                body = `
    <h1>${isSignatureValid ? 'File Signature is VALID' : 'File Signature is INVALID'}</h1>
    <pre><code>${JSON.stringify(msg.config, null, 4)}</code></pre>
                `
            } else if (msg.info) {
                /* Initailize database values. */
                dbName = 'main'
                dataLabel = `${msg.info.infoHash}:torrent`
                data = msg.info

                /* Validate data. */
                if (data && data.torrentInfo) {
                    /* Retrieve torrent info. */
                    const torrentInfo = data.torrentInfo
                    console.log('TORRENT INFO', torrentInfo)

                    /* Validate torrent info. */
                    if (!torrentInfo) {
                        return _errorHandler(`No torrent info found in [ ${JSON.stringify(msg.info)} ]`, false)
                    }

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

                    /* Write to database. */
                    // _dbWrite(dbName, dataLabel, data)
                } else if (data) {
                    return // FIXME We may not implement this report
                    /* Format body. */
                    body = `<pre><code>
<h3>${dataLabel}</h3>
<hr />
${JSON.stringify(data, null, 4)}
                    </code></pre>`
                }
            }

            /* Build gatekeeper package. */
            pkg = { body }

            /* Send package to gatekeeper. */
            _gatekeeperMsg(pkg)

            break
        case 'SEARCH':
            /* Retrieve search result. */
            body = msg.result

            /* Build gatekeeper package. */
            pkg = { body }

            /* Send package to gatekeeper. */
            _gatekeeperMsg(pkg)

            break
        case 'WHOAMI':
            /* Retrieve the identity. */
            identity = msg.identity

            /* Authorize connection. */
            _authRequest(identity)

            /* Calculate peer id. */
            peerId = CryptoJS.SHA1(identity)

            /* Update the location display. */
            // _updateLocDetails()

            /* Format body. */
            body = `
<h3 class="badge badge-info mt-1">My Peer Id: ${peerId}</h3>
<h3 class="badge badge-info">My Location: ${identity}</h3>
            `

            /* Build gatekeeper package. */
            pkg = { body }

            /* Send package to gatekeeper. */
            _gatekeeperMsg(pkg)

            /* Clear modals. */
            _clearModals()

            break
        default:
            // nothing to do here
        }
    } catch (_err) {
        _errorHandler(_err, false)
    }
}

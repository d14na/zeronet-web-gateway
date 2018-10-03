/* Initialize constants. */
const WS_ENDPOINT = 'https://0pen.0net.io' // Websocket endpoint
const INFURA_API_KEY = '61a2428e6a4e41a695d876dfac323f0f' // Infura API key

/* Initialize connection holder. */
let conn = null

/* Initialize Gatekeeper's Ready flag. */
let gateReady = false

/* Initialize peer id. */
let peerId = null

/* Initialize a no-op stub. */
function noop() {}

/* Initialize a holder to gatekeeper's (iframe). */
const gatekeeper = $('#gatekeeper')
// console.log('GATEKEEPER', gatekeeper)

/* Initialize the gatekeeper's content window. */
const contentWindow = gatekeeper[0].contentWindow

/**
 * Add Log Entry
 *
 * NOTE All significant activity (that is NOT directly alerted to the user)
 *      is recorded by this log window.
 */
const _addLog = function (_message) {
    /* Build new log entry. */
    const timestamp = `➤ 0PEN ${moment().format('YYYY.MM.DD @ HH:mm:ss')}`
    const entry = `[ ${_message} ]`

    /* Write to console. */
    console.info('%c' + timestamp + '%c ' + entry, 'color:red', 'color:black')
}

/**
 * Error Handler
 */
const _errorHandler = function (_err) {
    throw new Error(_err)
}

/**
 * Event Listener: MESSAGE
 *
 * Receives and handles ALL incoming messages from our embedded iframe.
 *
 * WARNING Sandboxed iframes which lack the 'allow-same-origin'
 * header have "null" rather than a valid origin. This means we still
 * have to be careful about accepting data via the messaging API we've
 * created. We verify the source, and validate ALL inputs.
 */
window.addEventListener('message', function (_event) {
    /* Retrieve origin. */
    const origin = _event.origin

    /* Retrieve source. */
    const source = _event.source

    /* Validate the message contents. */
    if (origin === 'null' && source === contentWindow) {
        /* Retrieve data. */
        const data = _event.data

        /* Validate data. */
        if (data) {
            /* Handle any errors. */
            if (data.error) {
                return _addLog(`Oops! We have a problem.<br /><br />${data.msg}`)
            }

            /* Verify we have a successful message. */
            if (data.success) {
                /* Log all successful messages to console. */
                _addLog(data.msg)

                /* Validate Iframe authorization. */
                if (data.msg === 'GATEKEEPER_IS_READY') {
                    /* Set Gatekeeper ready flag. */
                    gateReady = true

                    /* Connect to 0PEN. */
                    _connect()
                }
            }
        } else {
            /* Report any communications error. */
            _addLog('Oops! Something went wrong.' +
                  'We DID NOT receive the data we were looking for. ' +
                  'What we did receive was:<br /><br />' +
                  JSON.stringify(data))
        }
    }
})

/**
 * Send Gateway Message
 *
 * WARNING We're sending the message to "*", rather than some specific
 * origin. Sandboxed iframes which lack the 'allow-same-origin' header
 * don't have an origin which we can target.
 * (this might allow some "zero-day-style" esoteric attacks)
 */
const _gatekeeperMsg = function (_message={}) {
    contentWindow.postMessage(_message, '*')
}

/**
 * Authorize Gatekeeper
 */
const authGatekeeper = function () {
    /* Validate application initialization. */
    if (!gateReady) {
        setTimeout(function () {
            /* Send empty message to the gatekeeper for initialization. */
            _gatekeeperMsg()
        }, 1000)
    }
}

// if (Modernizr.websockets) {
//     _addLog('Your browser supports WebSockets.');
// } else {
//     _addLog('Your browser does NOT support WebSockets.');
// }

// if (Modernizr.filesystem) {
//     _addLog('Your browser supports Filesystem API.');
// } else {
//     _addLog('Your browser does NOT support Filesystem API.');
// }

// navigator.webkitPersistentStorage.requestQuota(1024*1024, function() {
//     window.webkitRequestFileSystem(window.PERSISTENT , 1024*1024, noop)
// })


/*******************************************************************************

  PouchDB
  https://pouchdb.com/

  We are using PouchDB to manage all "large" data sets stored by the browser.

*******************************************************************************/


/* Initailize database (object) manager. */
const _dbManager = {}

/* Initialize PouchDB for ALL required (configuration) data. */
_dbManager['main'] = new PouchDB('main')

/* Initialize PouchDB for (primary) zite files. */
// NOTE Separate db is used in the event of an LRU total database deletion.
//      see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria
_dbManager['files'] = new PouchDB('files')

/* Initialize PouchDB for (optional) zite files. */
// NOTE Separate db is used in the event of an LRU total database deletion.
//      see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria
_dbManager['optional'] = new PouchDB('optional')

/* Initialize PouchDB for non-zite media (eg. downloaded or torrent data). */
// NOTE Separate db is used in the event of an LRU total database deletion.
//      see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria
_dbManager['media'] = new PouchDB('media')

/**
 * Data Write
 *
 * Save data to one of the managed PouchDb databases.
 */
const _dbWrite = async function (_dbName, _dataLabel, _data) {
    _addLog(`Writing ${_dataLabel} to ${_dbName}`)

    /* Verify config in cache. */
    const exists = await _dbRead(_dbName, _dataLabel)

    /* Initialize result. */
    let result = null

    /* Initialize package. */
    let pkg = null

    if (exists && exists._id === _dataLabel) {
        /* Build package. */
        pkg = {
            ...exists,
            data: _data,
            lastUpdate: new Date().toJSON()
        }
    } else {
        /* Build package. */
        pkg = {
            _id: _dataLabel,
            data: _data,
            dataAdded:  new Date().toJSON(),
            lastUpdate: new Date().toJSON()
        }
    }

    /* Add/update document in database. */
    result = await _dbManager[_dbName].put(pkg)
        .catch(_errorHandler)

    /* Return the result. */
    if (result) {
        // console.log('Successfully saved config.', result)
        return result
    }
}

/**
 * Data Read
 *
 * Read data from one of the managed PouchDb databases.
 */
const _dbRead = async function (_dbName, _dataLabel) {
    // _addLog(`Reading ${_dataLabel} from ${_dbName}`)

    /* Initialize options. */
    const options = {
        key: _dataLabel,
        include_docs: true,
        descending: true
    }

    /* Retrieve all docs (using `key` filter). */
    const docs = await _dbManager[_dbName].allDocs(options)
        .catch(_errorHandler)

    /* Validate docs. */
    if (docs && docs.rows.length) {
        /* Retrieve the doc recordset. */
        const doc = docs.rows[0].doc

        /* Return the document. */
        return doc
    } else {
        /* No records found. */
        return null
    }
}

/**
 * Data Delete
 *
 * Delete data from one of the managed PouchDb databases.
 */
const _dbDelete = async function (_dbName, _dataLabel) {
    _addLog(`Deleting ${_dataLabel} from ${_dbName}`)

    /* Verify config in cache. */
    const exists = await _dbRead(_dbName, _dataLabel)

    /* Initialize result. */
    let result = null

    if (exists && exists._id === _dataLabel) {
        /* Remove document from database. */
        result = await _dbManager[_dbName].remove(exists)
            .catch(_errorHandler)
    } else {
        return _errorHandler(new Error('File was NOT found.'))
    }

    /* Return the result. */
    if (result) {
        // console.log('Successfully saved config.', result)
        return result
    }
}


/*******************************************************************************

  SockJS
  https://github.com/sockjs/sockjs-client

  We are using SockJS to manage all socket communications.

*******************************************************************************/


/**
 * Websocket Connect
 *
 * Open a new connection to the Zero Private Enterprise Network (0PEN).
 * via a websocket (or applicable fallback) connection.
 *
 * NOTE The closest (available) server can be reached by querying the DNS list:
 *      https://0pen.0net.io
 */
const _connect = function () {
    /* Create a new Socket JS connection . */
    conn = new SockJS(WS_ENDPOINT)

    /* Initialize event handlers. */
    conn.onopen = _connOpen
    conn.onmessage = _connMessage
    conn.onclose = _connClose
}

const _send0penMessage = function (_msg) {
    if (conn && conn.readyState === 1) {
        conn.send(JSON.stringify(_msg))

        return true
    } else {
        alert('0PEN is disconnected! Please try your request again...')

        return false
    }
}

const _handle0penMessage = async function (_msg) {
    try {
        /* Parse incoming message. */
        let msg = JSON.parse(_msg)
        console.log('Received', msg)

        /* Validate message. */
        if (!msg) {
            return _addLog(`Error processing [ ${JSON.stringify(msg)} ]`)
        }

        /* Retrieve the action. */
        const action = msg.action

        /* Initialize body holder. */
        let body = null
        let config = null
        let data = null
        let dataLabel = null
        let dbName = null
        let dest = null
        let files = null
        let fileExt = null
        let innerPath = null
        let isValid = null
        let pkg = null
        let target = null

        switch (action.toUpperCase()) {
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
                // _dbWrite(dbName, dataLabel, data)

                /* Decode body. */
                switch (fileExt.toUpperCase()) {
                case 'HTM':
                case 'HTML':
                    body = body.toString()
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
            /* Verify the signature of the configuraton (content.json). */
            const isSignatureValid = await _verifyConfig(msg.config)
                .catch((err) => console.error('Could NOT verify config', msg))

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
            const identity = msg.identity

            /* Calculate peer id. */
            peerId = CryptoJS.SHA1(identity)

            /* Update peer id on UI. */
            $('.peerId').html(`<span class="badge badge-info mt-1">PID: ${peerId}</span>`)

            /* Update the location display. */
            $('.location').html(`<h6 class="text-info">${identity}</h6>`)
            // $('.location').html(`<span class="badge badge-info">${identity}</span>`)
            // _updateLocDetails()

            break
        default:
            // nothing to do here
        }
    } catch (e) {
        _errorHandler(e)
    }
}

const _authRequest = async function () {
    /* Initialize network protocol. */
    const network = '0NET-TLR' // 0NET: TrustLess Republic

    /* Initialize ip address & port. */
    const address = '192.168.1.1:11337'

    /* Initialize nonce. */
    const nonce = moment().unix()

    const proof = `${network}:${address}:${nonce}`
    console.info('Generated authentication proof', proof)

    const signedProof = await signAuth(proof)
    console.info('Signed proof', signedProof)

    /* Build package. */
    const pkg = {
        action: 'AUTH',
        sig: signedProof
    }

    /* Send package. */
    _send0penMessage(pkg)
}

/**
 * Websocket - Connection Opened
 */
const _connOpen = async function () {
    _addLog('0PEN connected successfully.')

    /* Build package. */
    const pkg = {
        action: 'WHOAMI'
    }

    /* Send package. */
    _send0penMessage(pkg)
}



/**
 * Websocket - Message Received
 */
const _connMessage = function (e) {
    // console.info('Incoming 0PEN message', e.data)

    /* Handle incoming 0PEN message. */
    _handle0penMessage(e.data)
}

/**
 * Websocket - Connection Closed
 */
const _connClose = function () {
    console.info('0PEN connecton closed.')
}

/**
 * Signs a (data) proof provided by the server for account authentication.
 */
const signAuth = async function (_proof) {
    /* Initialize a new web3 object to our provider. */
    const web3 = new Web3()
    // const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/' + INFURA_API_KEY))

    // const privateKey = '0x9b2495bf3d9f3116a4ec7301cc2d8cd8c9d86b4f09b813a8455d8db18d6eb00' // 0xF51175cF846f88b9419228905d63dcDd43aeC9E8 (invalid)
    // const privateKey = '9b2495bf3d9f3116a4ec7301cc2d8cd8c9d86b4f09b813a8455d8db18d6eb00d' // 0xC3e7b7f10686263f13fF2fA2313Dc00c2592481d (invalid)
    const privateKey = '0x9b2495bf3d9f3116a4ec7301cc2d8cd8c9d86b4f09b813a8455d8db18d6eb00d' // 0x65C44EcAc56040a63da60bf5cA297951780eFEd1 (valid)
    // console.log('PRIVATE KEY', privateKey)

    /* Create the signature by signing the proof with private key. */
    const signature = web3.eth.accounts.sign(_proof, privateKey)

    /* Return the signed proof. */
    return signature
}

/**
 * Verify Configuration (content.json)
 */
const _verifyConfig = async function(_config) {
    /**
     * Escape unicode characters.
     * Converts to a string representation of the unicode.
     */
    const escapeUnicode = function (str) {
        return str.replace(/[^\0-~]/g, function (ch) {
            return '\\u' + ('000' + ch.charCodeAt().toString(16)).slice(-4)
        })
    }

    /* Retrieve address. */
    const address = _config.address

    /* Retrieve the signature. */
    const signature = _config.signs[address]

    /* Delete signs (as we can't verify ourselves in the signature). */
    delete _config.signs

    /* Convert the JSON to a string. */
    // NOTE: This matches the functionality of Python's `json.dumps` spacing.
    _config = JSON.stringify(_config).replace(/":/g, '": ').replace(/,"/g, ', "')

    /* Escape all unicode characters. */
    // NOTE: This matches the functionality of Python's `unicode` handling.
    _config = escapeUnicode(_config)

    return new Promise((_resolve, _reject) => {
        $.getScript('../libs/bitcoin-message.js', () => {
            /* Verify the Bitcoin signature. */
            const isValid = BitcoinMessage.verify(_config, address, signature)

            _resolve(isValid)
        })
    })
}

/**
 * Zite Search
 *
 * Handles ALL submissions from the Zite | Search input.
 */
const _ziteSearch = function () {
    /* Retrieve search query. */
    const query = inpZiteSearch.val()

    _addLog(`User submitted a query for [ ${query} ]`)

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
    let innerPath = null
    let pkg = null

    /* Basic validation. */
    if (!query || query === '' || !query.length) {
        return
    }

    if (query.slice(0, 10).toUpperCase() === 'DEBUG.MENU') {
        /* Show ADMIN permission modal. */
        $('#modalDebug').modal({
            backdrop: 'static',
            keyboard: false
        })

        /* Enable test buttons. */
        $('.btnModalDebugTest1').click(() => {
            inpZiteSearch.val('getinfo:1ExPLorERDSCnrYHM3Q1m6rQbTq7uCprqF')
            _ziteSearch()
        })
        $('.btnModalDebugTest2').click(() => {
            inpZiteSearch.val('getfile:1ExPLorERDSCnrYHM3Q1m6rQbTq7uCprqF:index.html')
            _ziteSearch()
        })
        $('.btnModalDebugTest3').click(() => {
            inpZiteSearch.val('getfile:1ExPLorERDSCnrYHM3Q1m6rQbTq7uCprqF:images/screen-01.png')
            _ziteSearch()
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

            /* Process MEDIA database. */
            docs = await _dbManager['media'].allDocs(options)
                .catch(_errorHandler)
            body += `<hr /><h1>Media</h1><pre><code>${JSON.stringify(docs, null, 4)}</code></pre>`

            /* Build gatekeeper package. */
            const pkg = { body }

            /* Send package to gatekeeper. */
            _gatekeeperMsg(pkg)
        })

        /* Reset search. */
        _resetSearch()
    } else if (query.slice(0, 7).toUpperCase() === 'GETINFO' && query.length > 8) {
        /* Retrieve destination. */
        dest = query.slice(8)

        /* Set action. */
        action = 'GETINFO'

        /* Build package. */
        pkg = { action, dest }
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
        /* Set action. */
        action = 'SEARCH'

        /* Build package. */
        pkg = { action, query }
    }

    /* Send package. */
    if (_send0penMessage(pkg)) {
        /* Reset search. */
        _resetSearch()
    }
}

/**
 * Manage Zitetags & Searching
 */
const btnZiteSearch = $('.btnZiteSearch')
btnZiteSearch.click(_ziteSearch)

const inpZiteSearch = $('.inpZiteSearch')
inpZiteSearch.on('keyup', function (e) {
    if (e.keyCode === 13) {
        _ziteSearch()
    }
})

/**
 * Update Location Details
 */
const _updateLocDetails = function () {
    /* Basic web bot (search spider) filter. */
    if (!navigator.userAgent.match(/bot|spider/i)) {
        $.get('https://ipinfo.io', function (response) {
            console.log('IpInfo.io', response)

            /* Retrieve city. */
            const city = response.city

            /* Retrieve country. */
            const country = response.country

            /* Retrieve organization. */
            const org = response.org

            /* Update UI location. */
            $('.location').append(`<br />${city}, ${country}<br /><small><em>${org}</em></small>`)
        }, 'jsonp')
    }
}

/**
 * jQuery says it's time to boogie!
 */
$(document).ready(function () {
    /* Send an empty message to the gatekeeper to initialize. */
    authGatekeeper()

    /* Verify NO parent window! */
    // if (window.self === window.top) {
    //     console.log('NOTIFICATION', Notification)
    //
    //     if (Notification) {
    //         console.log('Notification.permission', Notification.permission)
    //
    //         if (Notification.permission === 'denied') {
    //             console.log('Requesting have been denied!')
    //             alert('Oops! Looks like you DO NOT want to be IN THE KNOW!')
    //         } else if (Notification.permission !== 'granted') {
    //             console.log('Requesting permission now!')
    //             Notification.requestPermission()
    //         } else {
    //             var notification = new Notification('Notification title', {
    //                icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
    //                body: "Hey there! You've been notified!",
    //              })
    //
    //              notification.onclick = function () {
    //                window.open("http://stackoverflow.com/a/13328397/1269037");
    //              }
    //         }
    //     } else {
    //         alert('Desktop notifications not available in your browser. Try Chromium.');
    //     }
    // } else {
    //     console.info('P0rtal is contained within another window. Escaping now!')
    //
    //     window.open(window.location.toString(), '_top')
    // 	document.write('Please wait, now escaping from iframe...')
    // 	window.stop()
    // 	document.execCommand('Stop', false)
    // }
})

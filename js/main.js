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
// console.log('Event', _event)

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
            // console.log('DATA received', data)

            /* Handle any errors. */
            if (data.error) {
                return _addLog(`Oops! We have a problem.<br /><br />${data.msg}`)
            }

            /* Verify we have a successful message. */
            if (data.success) {
                _addLog(data.msg)

                /* Validate Iframe authorization. */
                if (data.msg === 'GATEKEEPER_IS_READY') {
                    console.info('Gatekeeper is ready to go!')

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
const _authGatekeeper = function () {
    /* Validate application initialization. */
    if (!gateReady) {
        setTimeout(function () {
            console.info('Requesting gatekeeper authorization.')

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

/* Initialize PouchDB for ALL required (configuration) data. */
const dbMain = new PouchDB('main')

/* Initialize PouchDB for (primary) zite files. */
// NOTE Separate db is used in the event of an LRU total database deletion.
//      see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria
const dbFiles = new PouchDB('files')

/* Initialize PouchDB for (optional) zite files. */
// NOTE Separate db is used in the event of an LRU total database deletion.
//      see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria
const dbOptional = new PouchDB('optional')

/* Initialize PouchDB for non-zite media (eg. downloaded or torrent data). */
// NOTE Separate db is used in the event of an LRU total database deletion.
//      see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria
const dbMedia = new PouchDB('media')

/**
 * @notice Save configuration data to database.
 *
 * @dev Write config data to our pouchdb.
 */
const _saveFile = async function (_name, _data) {
    /* Verify config in cache. */
    const exists = await _getFile(_name)

    /* Initialize result. */
    let result = null

    if (exists && exists._id === _name) {
        /* Build package. */
        const pkg = {
            ...exists,
            data: _data,
            lastUpdate: new Date().toJSON()
        }

        /* Update document in database. */
        result = await dbMain.put(pkg)
            .catch(_errorHandler)
    } else {
        /* Build package. */
        const pkg = {
            _id: _name,
            data: _data,
            dataAdded:  new Date().toJSON(),
            lastUpdate: new Date().toJSON()
        }

        /* Add document to database. */
        result = await dbMain.put(pkg)
            .catch(_errorHandler)
    }

    /* Return the result. */
    if (result) {
        // console.log('Successfully saved config.', result)
        return result
    }
}

/**
 * @notice Retreive configuration data from database.
 *
 * @dev Read config data from our pouchdb.
 */
const _getFile = async function (_name) {
    /* Initialize options. */
    const options = {
        key: _name,
        include_docs: true,
        descending: true
    }

    /* Retrieve all docs (using `key` filter). */
    const docs = await dbMain.allDocs(options)
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

const _removeFile = async function (_name) {
    /* Verify config in cache. */
    const exists = await _getFile(_name)

    /* Initialize result. */
    let result = null

    if (exists && exists._id === _name) {
        /* Remove document from database. */
        result = await dbMain.remove(exists)
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
    if (conn.readyState === 1) {
        conn.send(JSON.stringify(_msg))

        return true
    } else {
        alert('0PEN is disconnected! Please try your request again...')

        return false
    }
}

const _handle0penMessage = function (_msg) {
    try {
        /* Parse incoming message. */
        let msg = JSON.parse(_msg)
        console.log('Received', msg)

        /* Retrieve the action. */
        const action = msg.action

        /* Initialize body holder. */
        let body = null

        switch (action.toUpperCase()) {
        case 'GETINFO':
            /* Retrieve config. */
            body = `<pre><code>${JSON.stringify(msg.config, null, 4)}</code></pre>`

            /* Build gatekeeper message. */
            msg = { body }

            console.log('SEND TO GATEKEEPER', msg)
            /* Send message to gatekeeper. */
            _gatekeeperMsg(msg)

            break
        case 'SEARCH':
            /* Retrieve search result. */
            body = msg.result

            /* Build gatekeeper message. */
            msg = { body }

            /* Send message to gatekeeper. */
            _gatekeeperMsg(msg)

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
    console.info('0PEN connected successfully.')


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
 * Manage Zitetags & Searching
 */
const inpZiteSearch = $('.inpZiteSearch')
inpZiteSearch.on('keyup', function (e) {
    if (e.keyCode === 13) {
        /* Build package. */
        // const pkg = {
        //     action: 'SEARCH',
        //     query: inpZiteSearch.val()
        // }

        console.log('GETINFO')
        const pkg = {
            action: 'GETINFO',
            dest: '1ExPLorERDSCnrYHM3Q1m6rQbTq7uCprqF'
        }

        // console.log('LOADING CONTENT.JSON')
        // const pkg = {
        //     action: 'GETFILE',
        //     dest: '1ExPLorERDSCnrYHM3Q1m6rQbTq7uCprqF',
        //     innerPath: 'index.html'
        // }

        /* Send package. */
        if (_send0penMessage(pkg)) {
            /* Reset input. */
            inpZiteSearch.val('')
        }
    }
})

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


// RUN TESTS
const _runDbTests = async function () {
    // console.log('SAVING...', await _saveFile('settings', { autoUpdate: false, gpMode: true }))
    // console.log('SAVING...', await _saveFile('content.json', { title: 'Even Better Zite!' }))

    console.log('SETTINGS', await _getFile('settings'))
    // console.log('SAMPLE (content.json)', await _getFile('content.json'))

    // console.log('REMOVING...', await _removeFile('settings'))
}

const _run0penTests = async function () {
    console.log('Do something!');
}



/* jQuery says it's time to boogie! */
$(document).ready(function () {
    /* Send an empty message to the gatekeeper to initialize. */
    _authGatekeeper()

    $('.btnDbTests').click(_runDbTests)
    $('.btn0penTests').click(_run0penTests)

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

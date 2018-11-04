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
    // console.log('INCOMING MESSAGE EVENT', _event)

    /* Retrieve origin. */
    const origin = _event.origin

    /* Retrieve source. */
    const source = _event.source

    /* Validate the message contents. */
    if (origin === 'null' && source === contentWindow) {
        /* Retrieve data. */
        const data = _event.data

        console.log('INCOMING EVENT DATA', data)

        /* Validate data. */
        if (data) {
            /* Handle any errors. */
            if (data.error) {
                return _addLog(`Oops! We have a problem.\n\n${data.msg}`)
            }

            /* Handle any Api commands. */
            if (data.cmd && data.params) {
                /* Log all successful messages to console. */
                // _addLog(`${data.cmd} : ${data.params}`)

                /* Initialize command. */
                let cmd = null

                /* Initialize to (request id). */
                let to = null

                /* Initialize result. */
                let result = null

                switch(data.cmd.toUpperCase()) {
                case 'FILEGET':
                    _addLog('Received [ fileGet ]. Sending [ wrapperOpenedWebsocket ]')

                    /* Initialize file data holder. */
                    let fileData = null

                    /* Retrieve file data from zite manager. */
                    fileData = App.ziteMgr[App.destination]['data'][data.params]

                    /* Format for display. */
                    // FIXME Support ALL file types.
                    fileData = _formatFileData(fileData, 'html')

                    // console.log('FILE DATA', fileData)

                    /* Set command. */
                    cmd = 'response'

                    /* Set to. */
                    to = data.id

                    /* Set result. */
                    result = fileData

                    return _gatekeeperMsg({ cmd, to, result })

                case 'DBQUERY':
                    _addLog('Received [ dbQuery ]. Sending [ sample movies ]')

                    /* Set command. */
                    cmd = 'response'

                    /* Set to. */
                    to = data.id

                    /* Set result. */
                    // result = {
                    //     data: [
                    //         '1923|Comedy, Family|1h13m|7.9||32,598,282',
                    //         '2016|Thriller|1h25m|5.1|_RSHG7l99bs|5,3351,285'
                    //     ]
                    // }
                    result = [{
                        data: '2018|Action, Adventure, Sci-Fi|1h58m|7.4|8_rTIAOohas|941,6936,301',
                        added: 1538407063,
                        dl: "720p:1.44GB:06b0250624bad2be554a2cb63b4add9c0af3afb7|1080p:8.32GB:1a9efd751e78137053ecba8fc6ac92fee30ef83a|SD:809MB:f9923eafec0fcf7e835b3522864a9319c36e9a1b",
                        genre: "Action, Adventure, Sci-Fi",
                        imdb_id: "tt5095030",
                        imdb_rating: "7.4",
                        json_id: 27,
                        length: "1h58m",
                        name: "Ant-Man and the Wasp",
                        peers: 25542,
                        poster_data: "941,6936,301",
                        year: "2018",
                        youtube_id: "8_rTIAOohas"
                    }, {
                        data: '2018|Action, Crime, Thriller||7.0|HyNJ3UrGk_I|966,2456,300',
                        added: 1540911036,
                        dl: "1080p:4.15GB:a689e0372bac57f919ee2b2beaf3bcdab8b0a088|SD:1.15GB:06ee8cd8d71ff1b65042421c8e7b57f5434503bd",
                        genre: "Action, Crime, Thriller",
                        imdb_id: "tt3766354",
                        imdb_rating: "7.0",
                        json_id: 27,
                        length: "",
                        name: "The Equalizer 2",
                        peers: 19419,
                        poster_data: "966,2456,300",
                        year: "2018",
                        youtube_id: "HyNJ3UrGk_I"
                    }, {
                        data: '2018|Action, Adventure, Fantasy, Sci-Fi|2h29m|8.7|6ZfuNTqbHE8|892,6757,300',
                        added: 1532961938,
                        dl: "720p:1.84GB:2ed848835bb8b8300380fcc97c2480296429ba6e|1080p:12.05GB:0553cb47a2603a95bc4377cb1264da106c3adb9b|SD:718MB:c5027fe80419558b2e8a9dd26df4eef0993b4eb5",
                        genre: "Action, Adventure, Fantasy, Sci-Fi",
                        imdb_id: "tt4154756",
                        imdb_rating: "8.7",
                        json_id: 23,
                        length: "2h29m",
                        name: "Avengers: Infinity War",
                        peers: 34523,
                        poster_data: "892,6757,300",
                        year: "2018",
                        youtube_id: "6ZfuNTqbHE8"
                    }]

                    return _gatekeeperMsg({ cmd, to, result })

                case 'INNERREADY':
                    _addLog('Received [ innerReady ]. Sending [ wrapperOpenedWebsocket ]')

                    return _gatekeeperMsg({
                        cmd: 'wrapperOpenedWebsocket',
                        to: data.id,
                        result: null
                    })

                case 'SERVERINFO':
                    _addLog('Received [ serverInfo ]. Sending [ 0PEN sample ]')

                    cmd = 'response'

                    to = data.id

                    result = {
                        debug: false,
                        fileserver_ip: '*',
                        fileserver_port: 10443,
                        ip_external: false,
                        language: 'en',
                        platform: '0PEN', // 0PEN | Ghost | Nubo | Private | Web
                        plugins: [
                            'AnnounceLocal',
                            'AnnounceShare',
                            'AnnounceZero',
                            'Bigfile',
                            'Chart',
                            'ContentFilter',
                            'Cors',
                            'CryptMessage',
                            'FilePack',
                            'MergerSite',
                            'Newsfeed',
                            'OptionalManager',
                            'PeerDb',
                            // 'PeerMessage',
                            'Sidebar',
                            'Stats',
                            // 'Superuser',
                            // 'Sybil',
                            'TranslateSite',
                            'Trayicon',
                            'UiConfig',
                            'Zeroname'
                        ],
                        rev: 181003,
                        timecorrection: -5.038857062657674,
                        tor_enabled: false,
                        tor_has_meek_bridges: false,
                        tor_status: 'Error ([Errno 61] Connection refused)',
                        tor_use_bridges: false,
                        ui_ip: '127.0.0.1',
                        ui_port: 43110,
                        version: '18.10.3'
                    }

                    return _gatekeeperMsg({ cmd, to, result })

                case 'SITEINFO':
                    _addLog('Received [ siteInfo ]. Sending [ ZeroCoding sample ]')

                    cmd = 'response'

                    to = data.id

                    result = {
                        address: '1CoDiNGYdEQX3PmP32K3pbZnrHJ2nWxXun',
                        auth_address: '13a49FcHd7AK4JF7vDvGrc98QnAYZraYFP',
                        auth_key: '3a2ba02c7813b4e92983cadc37cd06120fed5517a888ffe0509cb78da07e2703',
                        bad_files: 0,
                        cert_user_id: 'd14na.test@nametag.bit',
                        content: {
                            files: 22,
                            description: 'A full-stack integrated development environment (I…ecentralized applications (DApps) on the Zeronet.',
                            address: '1CoDiNGYdEQX3PmP32K3pbZnrHJ2nWxXun',
                            favicon: 'images/favicon.png',
                            includes: 0
                        },
                        content_updated: 1541169510.480437,
                        feed_follow_num: 1,
                        next_size_limit: 10,
                        peers: 18,
                        privatekey: false,
                        settings: {
                            ajax_key: '08e4a273df1e423886ff03cc6a00ca096f07ea098a463f386498d04dcf6ce71f',
                            added: 1535758717,
                            optional_downloaded: 0,
                            serving: true,
                            domain: 'zerocoding.bit'
                        },
                        size_limit: 10,
                        started_task_num: 0,
                        tasks: 0,
                        workers: 0
                    }

                    return _gatekeeperMsg({ cmd, to, result })

                case 'WRAPPERGETLOCALSTORAGE':
                    _addLog('Received [ wrapperGetLocalStorage ]. Sending [ null ]')

                    cmd = 'response'

                    to = data.id

                    result = null

                    return _gatekeeperMsg({ cmd, to, result })

                case 'WRAPPERSETLOCALSTORAGE':
                    console.error('Writing to Local Storage is UNIMPLEMENTED!')

                    cmd = 'response'

                    to = data.id

                    result = null

                    return _gatekeeperMsg({ cmd, to, result })

                case 'WRAPPERGETSTATE':
                    _addLog('Received [ wrapperGetState ]. Sending [ null ]')

                    cmd = 'response'

                    to = data.id

                    result = null // window.history.state

                    return _gatekeeperMsg({ cmd, to, result })

                default:
                    return console.error('Unhandled API event', data)
                }
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
const _gatekeeperMsg = function (_message = {}) {
    contentWindow.postMessage(_message, '*')
}

/**
 * Authorize Gatekeeper
 */
const _authGatekeeper = async function () {
    /* Show "connecting..." notification. */
    await _wait('Starting New Session', 'This will only take a moment.', 'Please wait...')

    /* Validate application initialization. */
    if (!gateReady) {
        setTimeout(function () {
            /* Send empty message to the gatekeeper for initialization. */
            _gatekeeperMsg()
        }, 1000)
    }
}

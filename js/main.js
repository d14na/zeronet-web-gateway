/* Initialize constants. */
const WS_ENDPOINT = 'https://0pen.0net.io' // WebSockets endpoint
const INFURA_API_KEY = '61a2428e6a4e41a695d876dfac323f0f' // Infura API key

/* Initialize connection manager. */
let conn = null

/* Initialize Gatekeeper's Ready flag. */
let gateReady = false

/* Initialize Request Id. */
let requestId = 0

/* Initialize requests manager. */
let requestMgr = {}

/* Initialize global client details. */
let peerId = null
let account = null
let identity = null

/* Initialize a no-op stub. */
// function noop() {}

/* Initialize a manager to gatekeeper's (iframe). */
const gatekeeper = $('#gatekeeper')

/* Initialize the gatekeeper's content window. */
const contentWindow = gatekeeper[0].contentWindow

/**
 * Vue Application Manager
 */
const vueAppManager = {
    el: '#app',
    data: () => ({
        /* System */
        logMgr: [],

        /* Constants */
        BLOCK_HASH_LENGTH: 20,
        CHUNK_LENGTH: 16384,

        /* Search */
        query: null,

        /* Network Status */
        networkIdentity: null,
        networkStatus: null,
        networkStatusClass: null,

        /* Messaging */
        msgList: [],

        /* Profile */
        profile: {},

        /* Zeronet Zite Manager */
        ziteMgr: {},
        destination: null,

        /* Torrent Manager */
        torrentMgr: {}
    }),
    mounted: function () {
        /* Initialize application. */
        this._init()
    },
    computed: {
        msgIndicator: function () {
            if (this.msgList.length) {
                return true
            } else {
                return false
            }
        }
    },
    methods: {
        _init: function () {
            /* Initialize network status. */
            this.networkStatus = '0PEN is Disconnected'
            this.networkStatusClass = 'text-danger'

            /* Initialize profile. */
            this.profile = {
                icon: '/img/dark-hood-icon.jpg',
                nametag: 'Private Guest'
            }
        },
        _parseFlags: function (_flags) {
            if (_flags.indexOf('ADMIN') !== -1) {
                return `<strong class="text-danger">[ADMIN]</strong> `
            }
        },
        _setConnStatus: function (_status, _class) {
            this.networkStatus = _status
            this.networkStatusClass = _class
        },
        _setIdentity: function (_identity) {
            // 173.239.230.54 [ Toronto, Canada ]
            this.networkIdentity = _identity
        },
        _resetSearch: function () {
            /* Clear search input. */
            this.query = ''

            /* Set focus to window. */
            window.focus()
        },
        loadMsg: function (_msgId) {
            alert(`loading message [ ${_msgId} ]`)
        },
        msgMarkAllRead: function () {
            this.msgList = []
        },
        msgNew: function () {
            alert('new message')
        },
        msgShowAll: function () {
            alert('load all messages')
        },
        networkStatusLogs: function () {
            /* Initialize body. */
            let body = ''

            body += '<pre>'

            for (let entry of this.logMgr.reverse()) {
                body += `${entry}\n`
            }

            body += '</pre>'

            /* Build gatekeeper package. */
            pkg = { body }

            /* Send package to gatekeeper. */
            _gatekeeperMsg(pkg)
        },
        networkStatusShowAll: function () {
            alert('_networkStatusShowAll')
        },
        search: function () {
            if (!this.query) {
                return _alert('Peer2Peer Request Error', 'Please enter the REQUEST you desdire.')
            }

            /* Call search library. */
            _search(this.query)
        }
    }
}

/* Initialize the application. */
const App = new Vue(vueAppManager)

/**
 * jQuery says it's time to boogie!
 */
$(document).ready(() => {
    /* Send an empty message to the gatekeeper to initialize. */
    _authGatekeeper()

    /* Add keyboard (esc) detection. */
    $(document).keyup(function (e) {
        /* Hide ALL modal windows. */
        if (e.keyCode === 27) {
            /* Clear modals. */
            _clearModals(0)
        }
    })

    /* Verify NO parent window! */
    // if (window.self === window.top) {
    //     console.log('NOTIFICATION', Notification)
    //
    //     if (Notification) {
    //         console.log('Notification.permission', Notification.permission)
    //
    //         if (Notification.permission === 'denied') {
    //             console.log('Requesting have been denied!')
    //             alert('Oh! Looks like you DO NOT want to be IN THE KNOW!')
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
    //     console.info('0net is contained within another window. Escaping now!')
    //
    //     window.open(window.location.toString(), '_top')
    // 	document.write('Please wait, now escaping from iframe...')
    // 	window.stop()
    // 	document.execCommand('Stop', false)
    // }
})

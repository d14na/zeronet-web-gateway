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
function noop() {}

/* Initialize a manager to gatekeeper's (iframe). */
const gatekeeper = $('#gatekeeper')

/* Initialize the gatekeeper's content window. */
const contentWindow = gatekeeper[0].contentWindow

/* Initialize (global) constants. */
const BLOCK_HASH_LENGTH = 20
const CHUNK_LENGTH = 16384

/**
 * Vue Application Manager
 */
const vueManager = {
    el: '#app',
    data: () => ({
        logMgr: [],
        notifList: [],
        profile: {},
        zeroPenStatus: '0PEN is Disconnected!',
        zeroPenStatusClass: 'text-danger'
    }),
    mounted: function () {
        /* Initialize application. */
        this._init()
    },
    computed: {
        notifIndicator: function () {
            if (this.notifList.length) {
                return true
            } else {
                return false
            }
        }
    },
    methods: {
        _init: function () {
            /* Initialize profile. */
            this.profile = {
                icon: '/img/dark-hood-icon.jpg',
                nickname: 'Guest Peer'
            }
        },
        _loadNotif: function (_notifId) {
            alert(`loading notification [ ${_notifId} ]`)
        },
        _notifMarkAllRead: function () {
            this.notifList = []
        },
        _networkStatusLogs: function () {
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
        _networkStatusShowAll: function () {
            alert('_networkStatusShowAll')
        },
        _updateConnStatus: function (_status, _class) {
            this.zeroPenStatus = _status
            this.zeroPenStatusClass = _class
        }
    }
}

/* Initialize the Vue Manager. */
const vue = new Vue(vueManager)

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

    // TEMP SAMPLE NOTIFICATION -- FOR TESTING PURPOSES ONLY
    vue.notifList.push({
        id: 1337,
        heading: 'Londynn Lee',
        description: 'tagged you and 18 others in a post.',
        icon: 'https://i.imgur.com/mxle8nF.jpg',
        dateCreated: 'October 03, 2017 8:45am'
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
    //     console.info('0net is contained within another window. Escaping now!')
    //
    //     window.open(window.location.toString(), '_top')
    // 	document.write('Please wait, now escaping from iframe...')
    // 	window.stop()
    // 	document.execCommand('Stop', false)
    // }
})

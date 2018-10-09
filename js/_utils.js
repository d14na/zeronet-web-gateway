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
const _errorHandler = function (_err, _critical = false) {
    /* Handle critical errors with a throw (terminate application). */
    if (_critical) {
        throw new Error(_err)
    } else {
        console.error(_err)
    }
}

/**
 * Retrieve Action from Requests Manager
 */
const _getAction = function (_msg) {
    /* Initialize action. */
    let action = null

    /* Retrieve request id. */
    const requestId = _msg.requestId

    if (requestId && requestMgr[requestId]) {
        /* Retrieve action. */
        action = requestMgr[requestId].action

        /* Remove request from manager. */
        // FIXME Verify that we do not need to persist this request
        //       other than to retrieve the ACTION
        delete requestMgr[requestId]
    }

    /* Return the action. */
    return action
}

/**
 * Authorization Request
 */
const _authRequest = async function (_identity) {
    /* Initialize network protocol. */
    const network = '0NET-TLR' // 0NET: TrustLess Republic

    /* Initialize nonce. */
    const nonce = moment().unix()

    const proof = `${network}:${_identity}:${nonce}`
    console.info('Generated authentication proof', proof)

    /* Set action. */
    const action = 'AUTH'

    /* Retrieve signed proof. */
    const sig = await signAuth(proof)
    console.info('Signed proof', sig)

    /* Build package. */
    const pkg = { action, sig }

    /* Send package. */
    _send0penMessage(pkg)
}

/**
 * Signs a (data) proof provided by the server for account authentication.
 */
const signAuth = async (_proof) => {
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
const _verifyConfig = async (_config) => {
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
        /* Verify the Bitcoin signature. */
        const isValid = BitcoinMessage.verify(_config, address, signature)

        _resolve(isValid)
    })
}

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
 * Clear ALL (Escapable) Modals
 */
const _clearModals = function () {
    $('#modalAlert').modal('hide')
    $('#modalDebug').modal('hide')
    $('#modalWait').modal('hide')
}

/**
 * Image Converter
 */
const _imgConverter = function (_input) { // fn BLOB => Binary => Base64 ?
    let uInt8Array = new Uint8Array(_input)
    let i = uInt8Array.length

    let biStr = [] //new Array(i);
    while (i--) { biStr[i] = String.fromCharCode(uInt8Array[i])  }
    let base64 = window.btoa(biStr.join(''))

    return base64
}

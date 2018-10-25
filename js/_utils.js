/**
 * Add Log Entry
 *
 * NOTE All significant activities (that are NOT directly alerted to the user)
 *      are handled and recorded by this logging event.
 */
const _addLog = function (_message) {
    /* Build new log entry. */
    const timestamp = `➤ 0PEN ${moment().format('YYYY.MM.DD @ HH:mm:ss')}`
    const entry = `[ ${_message} ]`

    /* Add to log manager. */
    App.logMgr.push(`${timestamp} ${entry}`)

    /* Write to console. */
    console.info('%c' + timestamp + '%c ' + entry, 'color:red', 'color:black')
}

/**
 * Error Handler
 *
 * TODO How should we handle CRITICAL errors??
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
const _getAction = function (_data) {
    /* Initialize action. */
    let action = null

    /* Retrieve request id. */
    const requestId = _data.requestId

    if (requestId && requestMgr[requestId]) {
        /* Retrieve action. */
        action = requestMgr[requestId].action

        // TODO Completed requests should be CANCELLED by messaging the network.

        /* Remove request from manager. */
        // FIXME Verify that we do not need to persist this request
        //       other than to retrieve the ACTION
        // delete requestMgr[requestId]
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
    // console.log('Proof', proof)

    /* Set action. */
    const action = 'AUTH'

    /* Retrieve signed proof. */
    const sig = await _signAuth(proof)
    // console.log('Signed proof', sig)
    _addLog(`Authentication proof: [ ${proof} ]`)

    /* Build package. */
    const pkg = { action, sig }

    /* Send package. */
    _send0penMessage(pkg)
}

/**
 * Calculate File Hash
 *
 * NOTE Only the first half of the SHA-512 is used in verification.
 */
const _calcFileHash = function (_data) {
    /* Calculate the sha512 hash. */
    const hash = CryptoJS.createHash('sha512').update(_data).digest()

    /* Truncate to 256-bit and return hex. */
    return hash.toString('hex').slice(0, 64)
}

/**
 * Calculate Info Hash
 */
const _calcInfoHash = function (_data) {
    /* Compute the SHA-1 hash of the data provided. */
    return CryptoJS.createHash('sha1').update(_data).digest('hex')
}

/**
 * Calculate Peer Identity
 *
 * NOTE Returned by WHOAMI request.
 */
const _calcIdentity = function (_data) {
    return _calcInfoHash(_data)
}

/**
 * Signs a (data) proof provided by the server for account authentication.
 */
const _signAuth = async (_proof) => {
    /* Initialize a new web3 object to our provider. */
    const web3 = new Web3()

    // TEMP FOR DEVELOPMENT/TESTING PURPOSES ONLY
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
const _verifyConfig = (_config) => {
    /**
     * Escape unicode characters.
     * Converts to a string representation of the unicode.
     */
    const escapeUnicode = function (_str) {
        return _str.replace(/[^\0-~]/g, function (ch) {
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

    // NOTE This is a time extensive process, so let's NOT block the event loop.
    return new Promise((_resolve, _reject) => {
        /* Verify the Bitcoin signature. */
        const isValid = BitcoinMessage.verify(_config, address, signature)

        /* Resolve the result. */
        _resolve(isValid)
    })
}

/**
 * Image Converter
 */
const _imgConverter = function (_input) { // fn BLOB => Binary => Base64 ?
    /* Initialize input (typed array). */
    const uInt8Array = new Uint8Array(_input)

    /* Initialize length counter. */
    let i = uInt8Array.length

    /* Initialize binary string holder. */
    let biStr = [] //new Array(i);

    /* Perform byte(s) conversion. */
    while (i--) {
        biStr[i] = String.fromCharCode(uInt8Array[i])
    }

    /* Convert to base64. */
    const base64 = window.btoa(biStr.join(''))

    /* Return base64. */
    return base64
}

/**
 * Verify Torrent Metadata
 *
 * NOTE A torrent's info hash is derived from its metadata.
 */
const _verifyMetadata = function (_infoHash, _metadata) {
    /* Convert the metadata to a buffer. */
    const metadata = Buffer.from(_metadata, 'hex')

    /* Decode the metadata buffer using bencode. */
    const decoded = Bencode.decode(metadata)
    // console.log('DECODED (RAW)', typeof decoded, decoded)

    /* Retrieve the torrent info. */
    const torrentInfo = decoded['info']
    // console.log('Torrent INFO', torrentInfo)

    /* Encode torrent info. */
    const encoded = Bencode.encode(torrentInfo)
    // console.log('Encoded torrent info', encoded)

    /* Calculate verification hash (from encoded metadata). */
    const verificationHash = _calcInfoHash(encoded)
    console.info(`Calculated the verification hash [ ${verificationHash} ]`)

    /* Validate verficiation hash. */
    if (verificationHash === _infoHash) {
        return torrentInfo
    } else {
        return null
    }
}

/**
 * Parse File Data
 *
 * NOTE Decoding file data (primarily for UI display).
 */
const _formatFileData = function (_data, _fileExt) {
    switch (_fileExt.toUpperCase()) {
    // TODO Add support for ALL raw string formats.
    case '': // NOTE Support for extension-less files (eg LICENSE).
    //               Are there ANY binary files in this category??
    case 'HTM':
    case 'HTML':
    case 'MD':
        _data = Buffer.from(_data).toString()
        break
    case 'CSS':
        _data = `<style>${Buffer.from(_data).toString()}</style>`
        break
    case 'JS':
        _data = `<script>${Buffer.from(_data).toString()}</script>`
        break
    case 'XML':
        _data = `<xml>${Buffer.from(_data).toString()}</xml>`
        break
    case 'GIF':
        _data = `data:image/gif;base64,${_imgConverter(_data)}`
        // _data = `<img class="img-fluid" src="data:image/gif;base64,${_imgConverter(_data)}" width="300">`
        break
    case 'JPG':
    case 'JPEG':
        _data = `data:image/jpeg;base64,${_imgConverter(_data)}`
        // _data = `<img class="img-fluid" src="data:image/jpeg;base64,${_imgConverter(_data)}" width="300">`
        break
    case 'PNG':
        _data = `data:image/png;base64,${_imgConverter(_data)}`
        // _data = `<img class="img-fluid" src="data:image/png;base64,${_imgConverter(_data)}" width="300">`
        break
    default:
        // NOTE Leave as buffer (for binary files).

        // TODO Decide if we want to default to BINARY or STRING
        //      for any UNKNOWN file types.
    }

    return _data
}

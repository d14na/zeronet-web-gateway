/**
 * Initialize Debugging Actions
 */
$('.btnModalDebugTest4').click(() => {
    _search('getfile:1D14naQY4s65YR6xrJDBHk9ufj2eLbK49C:README.md')
    _clearModals()
})

$('.btnModalDebugTest5').click(async () => {
    /* Initialize data. */
    let data = Buffer.alloc(0)

    /* Initialize block. */
    let block = null

    /* Initialize body. */
    let body = ''

    /* Set endpoint. */
    const endpoint = '01c227c8c9aac311f9365b163ea94708c27a7db4'

    /* Process MAIN database. */
    block = await _dbRead('main', `${endpoint}:torrent`)
        .catch(_errorHandler)
    const decoded = Bencode.decode(block.data)
    const filename = Buffer.from(decoded['info']['name']).toString()
    console.log('decoded', decoded)
    console.log('FILE NAME', filename)

    /* Process BLOCKS database. */
    for (let i = 0; i < 8; i++) {
        block = await _dbRead('blocks', `${endpoint}:${i}`)
            .catch(_errorHandler)
        data = Buffer.concat([data, Buffer.from(block['data'])])
    }
    const txtSample = data.slice(-78)
    const ebook = data.slice(0, -78)
    body += `<h5>Text Sample: ${txtSample.length}</h5><pre><code>${Buffer.from(txtSample).toString()}</code></pre>`
    body += `<h5>Magic Number: ${Buffer.from(ebook.slice(0, 4)).toString('hex')}</h5>`
    body += `<h5>E-book: ${ebook.length}</h5><pre><code>${ebook}</code></pre>`

    /* Build gatekeeper package. */
    const pkg = { body, prepend: true }

    /* Send package to gatekeeper. */
    _gatekeeperMsg(pkg)

    const blob = new Blob([ebook], { type: 'application/epub+zip' })
    saveAs(blob, filename + '.epub')

    _clearModals()
})

$('.btnModalDebugDbDumps').click(async () => {
    /* Initialize options. */
    options = {
        // include_docs: true
    }

    /* Process MAIN database. */
    docs = await _dbManager['main'].allDocs(options)
        .catch(_errorHandler)
    body = `<h1>Main</h1><pre><code>${JSON.stringify(docs, null, 4)}</code></pre>`

    /* Process FILES database. */
    docs = await _dbManager['files'].allDocs(options)
        .catch(_errorHandler)
    body += `<hr /><h1>Zeronet Files</h1><pre><code>${JSON.stringify(docs, null, 4)}</code></pre>`

    /* Process OPTIONAL database. */
    docs = await _dbManager['optional'].allDocs(options)
        .catch(_errorHandler)
    body += `<hr /><h1>Optional Zeronet Files</h1><pre><code>${JSON.stringify(docs, null, 4)}</code></pre>`

    /* Process BLOCKS database. */
    docs = await _dbManager['blocks'].allDocs(options)
        .catch(_errorHandler)
    body += `<hr /><h1>Data / Media Blocks</h1><pre><code>${JSON.stringify(docs, null, 4)}</code></pre>`

    /* Build gatekeeper package. */
    pkg = { body }

    /* Send package to gatekeeper. */
    _gatekeeperMsg(pkg)

    _clearModals()
})

$('.btnModalDebugDropFilesDb').click(async () => {
    const result = await _dbManager['files'].destroy()
        .catch(_errorHandler)

    console.log('Files Db has been destroyed', result)

    _dbManager['files'] = new PouchDB('files')

    _clearModals()
})

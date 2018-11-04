/*******************************************************************************

  PouchDB
  https://pouchdb.com/

  We are using PouchDB to manage all "large" data sets stored by the browser.

*******************************************************************************/


/* Initailize database (object) manager. */
const _dbManager = {}

/* Initialize PouchDB for ALL required (configuration) data. */
// NOTE Options apply to this database due to its:
//          1. high-usage (called on nearly every action).
//          2. low read-write (mainly used for catalog / info lookups).
//          3. small size (storing only metadata).
_dbManager['main'] = new PouchDB('main', { auto_compaction: true })

/* Initialize PouchDB for (primary) zite files. */
// NOTE Separate db is used in the event of an LRU total database deletion.
//      see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria
_dbManager['files'] = new PouchDB('files')

/* Initialize PouchDB for (optional) zite files. */
// NOTE Separate db is used in the event of an LRU total database deletion.
//      see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria
_dbManager['optional'] = new PouchDB('optional')

/* Initialize PouchDB for non-zite data blokcs (eg. downloaded or torrent data). */
// NOTE Separate db is used in the event of an LRU total database deletion.
//      see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria
_dbManager['blocks'] = new PouchDB('blocks')

/**
 * Data Write
 *
 * Save data to one of the managed PouchDb databases.
 */
const _dbWrite = async function (_dbName, _dataId, _data) {
    _addLog(`Writing ${_dataId} to ${_dbName}`)

    /* Verify config in cache. */
    const exists = await _dbRead(_dbName, _dataId)

    /* Initialize result. */
    let result = null

    /* Initialize package. */
    let pkg = null

    if (exists && exists._id === _dataId) {
        /* Build package. */
        pkg = {
            ...exists,
            data: _data,
            lastUpdate: new Date().toJSON()
        }
    } else {
        /* Build package. */
        pkg = {
            _id: _dataId,
            data: _data,
            dateAdded:  new Date().toJSON(),
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
const _dbRead = async function (_dbName, _dataId) {
    // _addLog(`Reading ${_dataId} from ${_dbName}`)

    /* Initialize options. */
    const options = {
        key: _dataId,
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
const _dbDelete = async function (_dbName, _dataId) {
    _addLog(`Deleting ${_dataId} from ${_dbName}`)

    /* Verify config in cache. */
    const exists = await _dbRead(_dbName, _dataId)

    /* Initialize result. */
    let result = null

    if (exists && exists._id === _dataId) {
        /* Remove document from database. */
        result = await _dbManager[_dbName].remove(exists)
            .catch(_errorHandler)
    } else {
        return _errorHandler('File was NOT found.', false)
    }

    /* Return the result. */
    if (result) {
        // console.log('Successfully saved config.', result)
        return result
    }
}

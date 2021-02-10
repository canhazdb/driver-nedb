const path = require('path');
const fs = require('fs').promises;

const Datastore = require('nedb-promises');
const uuid = require('uuid').v4;

function parseOrder (object, item) {
  const splitted = item.split('(');
  const direction = splitted[0];
  const field = splitted[1].slice(0, -1);

  if (['asc', 'desc'].includes(direction)) {
    object[field] = direction === 'asc' ? 1 : -1;
    return object;
  }

  throw new Error('canhazdb-driver-nedb: sort must be "asc" or "desc" but was "' + direction + '"');
}

function createNedbDriver (state) {
  let connections = {};
  let closing;

  fs.mkdir(state.options.dataDirectory, { recursive: true })
    .catch(error => {
      console.log('could not make dataDirectory', state.options.dataDirectory);
      throw error;
    });

  async function getDatabaseConnection (collectionId) {
    if (closing) {
      throw new Error('canhazdb-driver-nedb: getDatabaseConnection failed as client is closing');
    }

    if (connections[collectionId]) {
      return connections[collectionId];
    }
    const dbFile = path.join(state.options.dataDirectory, './' + collectionId + '.db');

    connections[collectionId] = new Datastore({ filename: dbFile });

    return connections[collectionId];
  }

  async function count (collectionId, query) {
    if (closing) {
      throw new Error('canhazdb-driver-nedb: getDatabaseConnection failed as client is closing');
    }

    const db = await getDatabaseConnection(collectionId);

    return db.count(query);
  }

  async function get (collectionId, query, fields, order, limit, skip) {
    if (closing) {
      throw new Error('canhazdb-driver-nedb: getDatabaseConnection failed as client is closing');
    }

    if (fields && !fields.includes('id')) {
      fields.push('id');
    }

    const projections = fields
      ? fields.reduce((result, field) => {
          result[field] = 1;
          return result;
        }, {})
      : undefined;

    const db = await getDatabaseConnection(collectionId);
    let chain = db.find(query, projections);
    if (order) {
      chain = chain.sort(order.reduce(parseOrder, {}));
    }
    if (limit) {
      chain = chain.limit(limit);
    }
    if (skip) {
      chain = chain.skip(skip);
    }
    return chain.exec().then(documents => {
      return documents.map(document => {
        delete document._id;
        return document;
      });
    });
  }

  async function post (collectionId, document) {
    if (closing) {
      throw new Error('canhazdb-driver-nedb: getDatabaseConnection failed as client is closing');
    }

    const db = await getDatabaseConnection(collectionId);

    const insertableRecord = {
      ...document,
      id: uuid()
    };

    await db.insert(insertableRecord);
    return insertableRecord;
  }

  async function put (collectionId, document, query) {
    if (closing) {
      throw new Error('canhazdb-driver-nedb: getDatabaseConnection failed as client is closing');
    }

    const db = await getDatabaseConnection(collectionId);
    const items = await db.find(query);
    const promises = items.map(i => {
      return db.update({ _id: i._id }, { id: i.id, ...document });
    });

    await Promise.all(promises);

    return { changes: promises.length };
  }

  async function patch (collectionId, document, query) {
    if (closing) {
      throw new Error('canhazdb-driver-nedb: getDatabaseConnection failed as client is closing');
    }

    const db = await getDatabaseConnection(collectionId);
    const items = await db.find(query);
    const promises = items.map(i => {
      return db.update({ _id: i._id }, { ...i, ...document });
    });

    await Promise.all(promises);

    return { changes: promises.length };
  }

  async function del (collectionId, query) {
    if (closing) {
      throw new Error('canhazdb-driver-nedb: getDatabaseConnection failed as client is closing');
    }

    const db = await getDatabaseConnection(collectionId);
    const changes = await db.remove(query, { multi: true });

    return { changes };
  }

  function open () {
    closing = false;
  }

  async function close () {
    closing = true;
    connections = {};
  }

  return {
    count,
    get,
    put,
    post,
    patch,
    del,

    open,
    close
  };
}

module.exports = createNedbDriver;

'use strict';


/**
 * @module redis-clients
 * @name redis-clients
 * @description redis client factories
 * @author lally elias<lallyelias87@gmail.com>
 * @see {@link https://github.com/lykmapipo/redis-clients}
 * @since 0.1.0
 * @version 0.1.0
 * @singleton
 * @public
 * @type {Object}
 */


//global dependencies
const url = require('url');
const _ = require('lodash');
const redis = require('redis');
const uuid = require('uuid');


//local initializations
const noop = function () {};


//reference to all created redis clients
//mainly used for safe shutdown and resource cleanups
exports._clients = [];


//defaults settings
const defaults = {
  prefix: 'r',
  separator: ':',
  redis: {
    port: 6379,
    host: '127.0.0.1'
  }
};


/**
 * @name defaults
 * @description default redis client connection options
 * @type {Object}
 * @since 0.1.0
 * @public
 */
exports.defaults = _.merge({}, defaults);


/**
 * @function
 * @name createClient
 * @description instantiate new redis client if not exists
 * @return {Object} an instance of redis client
 * @since 0.1.0
 * @public
 */
exports.createClient = function (options) {

  //merge options
  options = _.merge({}, exports.defaults, options);

  //support connection string url
  if (_.isString(options.redis)) {

    // parse the url
    const connection = url.parse(options.redis, true /* parse query string */ );
    if (connection.protocol !== 'redis:') {
      throw new Error('Invalid Connection String. Require redis: protocol');
    }

    options.redis = {
      port: connection.port || 6379,
      host: connection.hostname,
      db: (connection.pathname ? connection.pathname.substr(1) : null) ||
        connection.query.db || 0,
      // see https://github.com/mranney/node_redis#rediscreateclient
      options: connection.query
    };

    if (connection.auth) {
      options.redis.auth = connection.auth.replace(/.*?:/, '');
    }

  }

  //instantiate a redis client
  const socket = options.redis.socket;
  const port = !socket ? (options.redis.port || 6379) : null;
  const host = !socket ? (options.redis.host || '127.0.0.1') : null;
  const client =
    redis.createClient(socket || port, host, options.redis.options);

  //authenticate
  if (options.redis.auth) {
    client.auth(options.redis.auth);
  }

  //select database
  if (options.redis.db) {
    client.select(options.redis.db);
  }

  //remember created client(s) for later safe shutdown
  exports._clients = _.compact([].concat(exports._clients).concat(client));

  return client;

};


/**
 * @function
 * @name init
 * @description initialize redis client and pubsub
 * @return {Object} redis client
 * @since 0.1.0
 * @public
 */
exports.init = exports.client = function () {

  //initialize normal client
  if (!exports._client) {
    exports._client = exports.createClient();
    exports._client._id = Date.now();
  }

  //initialize publisher and subscriber clients
  exports.pubsub();

  //return a normal redis client
  return exports._client;

};


/**
 * @function
 * @name pubsub
 * @description instantiate redis pub-sub clients pair if not exists
 * @since 0.1.0
 * @public
 */
exports.pubsub = function () {

  //create publisher if not exists
  if (!exports.publisher) {
    exports.publisher = exports.createClient();
    exports.publisher._id = Date.now();
  }

  //create subscriber if not exist
  if (!exports.subscriber) {
    exports.subscriber = exports.createClient();
    exports.subscriber._id = Date.now();
  }

  //exports pub/sub clients
  return { publisher: exports.publisher, subscriber: exports.subscriber };
};


/**
 * @function
 * @name multi
 * @description initialize redis multi command object
 * @return {Object} redis multi command object
 * @since 0.3.0
 * @see {@link https://github.com/NodeRedis/node_redis#clientmulticommands}
 * @public
 */
exports.multi = function () {
  //ensure clients
  const client = exports.init();

  //obtain client
  const multi = client.multi();

  return multi;
};


/**
 * @function
 * @name info
 * @description collect redis server health information
 * @param  {Function} done a callback to invoke on success or failure
 * @return {Object}        server details
 * @since 0.1.0
 * @public
 */
exports.info = function (done) {
  //ensure connection
  exports.init();

  exports.client().info(function (error /*, info*/ ) {
    // jshint camelcase:false
    done(error, exports._client.server_info);
    // jshint camelcase:true
  });
};


/**
 * @function
 * @name key
 * @description prepare data storage key
 * @param  {String|String[]} key valid data store key
 * @since 0.1.0
 * @public
 */
exports.key = function (...args) {

  //concatenate key is varargs
  let key = [].concat(...args);

  //ensure key
  if (key.length === 0) {
    key = key.concat(uuid.v1());
  }

  key = [exports.defaults.prefix].concat(key);

  //join key using separator
  key = key.join(exports.defaults.separator);

  return key;

};


/**
 * @function
 * @name count
 * @description count the number of keys that match specified pattern
 * @param {String|Array} [patterns] single or collection of patterns
 * @param {Function} done a callback to invoke on success or failure
 * @since 0.2.0
 * @public
 * @return {Number|Array} count per specified pattern in that order respectively
 * @see {@link https://redis.io/commands/eval}
 * @see {@link http://maaxiim.blogspot.ru/2012/09/implementing-redis-count-command-in-lua.html}
 */
exports.count = exports.size = function (...patterns) {

  //normalize patterns to array
  patterns = [].concat(...patterns);

  //compact and ensure unique patterns
  patterns = _.uniq(_.compact(patterns));

  //obtain callback
  const done = _.last(patterns);

  //drop callback if provided
  if (_.isFunction(done)) {
    patterns = _.initial(patterns);
  }

  //ensure patterns to count
  if (patterns && patterns.length > 0) {

    //get a client
    const client = exports.multi();

    //count for each pattern

    _.forEach(patterns, function (pattern) {

      //prepare count LUA script per pattern
      const script =
        (['return #redis.pcall("keys", "', pattern, '")'].join(''));

      //count using a lua script
      client.eval(script, 0);

    });

    client.exec(function (error, count) {

      //normalize count
      if (count) {
        count = count.length > 1 ? count : _.first(count);
      }

      done(error, count);

    });
  }

  //reply with bad request
  //as no collections specified
  else {
    let error = new Error('Missing Count Patterns');
    error.status = 400;
    done(error);
  }


};


/**
 * @function
 * @name reset
 * @description quit and reset redis clients states
 * @since 0.1.0
 * @public
 */
exports.reset = exports.quit = function () {

  //clear subscriptions and listeners
  if (exports.subscriber) {
    exports.subscriber.unsubscribe();
    exports.subscriber.removeAllListeners();
  }

  //quit all clients
  _.forEach(exports._clients, function (_client) {
    //TODO do they shutdown immediately
    //TODO check kue how they handle this
    _client.quit();
  });

  //TODO is there any memory leaks here?
  //TODO notify others before reset the clients for better cleanup
  //reset clients
  exports._client = null;
  exports.publisher = null;
  exports.subscriber = null;

  //reset settings
  exports.defaults = _.merge({}, defaults);

  //reset clients
  exports._clients = [];

};


/**
 * @function
 * @name clear
 * @description clear all data saved and their key
 * @param {String} [pattern] pattern of keys to be removed
 * @param {Function} done a callback to invoke on success or failure
 * @since 0.1.0
 * @public
 */
exports.clear = function (pattern, done) {

  //normalize arguments
  if (pattern && _.isFunction(pattern)) {
    done = pattern;
    pattern = undefined;
  }

  //ensure callback
  if (!done) {
    done = noop;
  }

  //prepare clear all key regex
  pattern = _.compact([exports.defaults.prefix, pattern]);
  if (pattern.length > 1) {
    pattern = pattern.join(exports.defaults.separator);
  }
  pattern = [pattern].concat(['*']).join('');

  //ensure client
  exports.init();

  //clear data in transaction
  exports.client().keys(pattern, function (error, keys) {

    //back-off in case there is error
    if (error) {
      done(error);
    }

    //execute delete using redis multi command
    else {

      //initiate multi to run all commands atomically
      const _client = exports.multi();

      //queue commands
      _.forEach(keys, function (key) {
        _client.del(key);
      });

      //execute commands
      _client.exec(done);
    }

  });

};
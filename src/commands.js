'use strict';

/**
 * @name commands
 * @description redis comman helper
 * @author lally elias<lallyelias87@gmail.com>
 * @since 0.4.0
 * @version 0.1.0
 * @singleton
 * @type {Object}
 */


/* dependencies */
const path = require('path');
const _ = require('lodash');
const flat = require('flat');
const unflat = require('flat').unflatten;
const redis = require(path.join(__dirname, 'redis'));


/* noop */
const noop = function () {};


/* stringify data to save to redis */
const stringify = function (value) {
  /* clone */
  let _value = _.clone(value);
  try {
    if (!_.isString(value)) {
      _value = JSON.stringify(value);
    }
    return _value;
  } catch (error) {
    return _value;
  }
};

/* parse data from redis */
const parse = function (value) {
  /* clone */
  let _value = _.clone(value);
  try {
    _value = JSON.parse(_value);
    return _value;
  } catch (error) {
    return _value;
  }
};


/**
 * @name set
 * @function set
 * @description Set key to hold the value. 
 * If key already holds a value, it is overwritten, 
 * regardless of its type.
 * 
 * @param {String} key key
 * @param {Mixed} value value
 * @param {String} [expiry] expiry strategy(i.e PX or EX)
 * @param {Number} [time] expiry time(i.e seconds or milliseconds)
 * @param {String} [strategy] save strategy(i.e NX or XX)
 * @param {Function} [done] a callback to invoke on success or failure
 * @see {@link https://redis.io/commands/set|SET}
 * @since 0.4.0
 * @version 0.1.0
 * @public
 */
exports.set = function set(key, value, expiry, time, strategy, done) {

  /* do nothing */
  if (_.isFunction(key)) {
    return (key && key());
  }

  /* do nothing */
  if (_.isFunction(value)) {
    return (value && value());
  }

  /* ensure client */
  const client = redis.client();

  /* prepare */
  const _key = redis.key(key);
  const _value = stringify(value);
  const _expiry = expiry && _.isString(expiry) ? expiry : undefined;
  const _time = time && _.isNumber(time) ? time : undefined;
  const _strategy = strategy && _.isString(strategy) ? strategy : undefined;


  /* callback */
  let _cb = noop;
  _cb = _.isFunction(expiry) ? expiry : _cb;
  _cb = _.isFunction(time) ? time : _cb;
  _cb = _.isFunction(strategy) ? strategy : _cb;
  _cb = _.isFunction(done) ? done : _cb;
  const cb = function (error) {
    return _cb && _cb(error, value);
  };


  /* compact */
  const args =
    _.compact([_key, _value, _expiry, _time, _strategy, cb]);


  /* set */
  return client.set.call(client, ...args);

};


/**
 * @name get
 * @function get
 * @description Get the value of key
 * 
 * @param {String} key key
 * @param {Function} [done] a callback to invoke on success or failure
 * @see {@link https://redis.io/commands/get|GET}
 * @since 0.4.0
 * @version 0.1.0
 * @public
 */
exports.get = function get(key, done) {

  /* do nothing */
  if (_.isFunction(key)) {
    return (key && key());
  }

  /* ensure client */
  const client = redis.client();

  /* prepare */
  const _key = redis.key(key);

  /* callback */
  let _cb = noop;
  _cb = _.isFunction(done) ? done : _cb;
  const cb = function (error, value) {
    return _cb && _cb(error, parse(value));
  };


  /* compact */
  const args = _.compact([_key, cb]);


  /* set */
  return client.get.call(client, ...args);

};


/**
 * @name hmset
 * @function hmset
 * @description Sets the specified fields to their respective values 
 * in the hash stored at key. 
 * 
 * @param {String} key key
 * @param {Object} value value
 * @param {Function} [done] a callback to invoke on success or failure
 * @see {@link https://redis.io/commands/hmset|HMSET}
 * @since 0.4.0
 * @version 0.1.0
 * @public
 */
exports.hmset = function hmset(key, value, done) {

  /* do nothing */
  if (_.isFunction(key)) {
    return (key && key());
  }

  /* do nothing */
  if (_.isFunction(value)) {
    return (value && value());
  }

  /* ensure client */
  const client = redis.client();

  /* prepare */
  const _key = redis.key(key);
  const _value = flat(value);

  /* callback */
  let _cb = noop;
  _cb = _.isFunction(done) ? done : _cb;
  const cb = function (error) {
    return _cb && _cb(error, value);
  };

  /* compact */
  const args = _.compact([_key, _value, cb]);


  /* set */
  return client.hmset.call(client, ...args);

};


/**
 * @name hgetall
 * @function hgetall
 * @description Returns all fields and values of the hash stored at key
 * 
 * @param {String} key key
 * @param {Function} [done] a callback to invoke on success or failure
 * @see {@link https://redis.io/commands/hgetall|HGETALL}
 * @since 0.4.0
 * @version 0.1.0
 * @public
 */
exports.hgetall = function hgetall(key, done) {

  /* do nothing */
  if (_.isFunction(key)) {
    return (key && key());
  }

  /* ensure client */
  const client = redis.client();

  /* prepare */
  const _key = redis.key(key);

  /* callback */
  let _cb = noop;
  _cb = _.isFunction(done) ? done : _cb;
  const cb = function (error, value) {
    return _cb && _cb(error, unflat(value));
  };


  /* compact */
  const args = _.compact([_key, cb]);


  /* set */
  return client.hgetall.call(client, ...args);

};
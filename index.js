'use strict';


//global dependencies
const path = require('path');
const _ = require('lodash');
const exit = require('exit-hook');


//local dependencies
const redis = require(path.join(__dirname, 'src', 'redis'));


exports = module.exports = function (options) {

  //merge options
  redis.defaults = _.merge({}, redis.defaults, options);

  //initialize
  redis.init();

  //listen for process exit and shutdown safely
  exit(function () {
    redis.quit();
  });

  //export factories
  return redis;

};
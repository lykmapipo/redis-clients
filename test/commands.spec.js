'use strict';

/* dependencies */
const path = require('path');
const _ = require('lodash');
const { expect } = require('chai');
const faker = require('faker');

const redis = require(path.join(__dirname, '..'))();
const { set, get, hmset, hgetall } = redis.commands;


describe('commands', function () {

  before(function (done) {
    redis.clear(done);
  });

  before(function () {
    redis.reset();
  });

  describe('set', function () {

    it('should be able to set', function (done) {

      set(function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.not.exist;
        done(error, result);
      });

    });

    it('should be able to set', function (done) {
      const key = faker.random.uuid();

      set(key, function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.not.exist;
        done(error, result);
      });

    });

    it('should be able to set string', function (done) {
      const key = faker.random.uuid();
      const value = faker.random.word();

      set(key, value, function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.eql(value);
        done(error, result);
      });

    });

    it('should be able to set number', function (done) {
      const key = faker.random.uuid();
      const value = faker.random.number();

      set(key, value, function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.eql(value);
        done(error, result);
      });

    });

    it('should be able to set array', function (done) {
      const key = faker.random.uuid();
      const value = [faker.random.word(), faker.random.word()];

      set(key, value, function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.eql(value);
        done(error, result);
      });

    });

    it('should be able to set plain object', function (done) {
      const key = faker.random.uuid();
      const value = faker.helpers.createTransaction();

      set(key, value, function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.eql(value);
        done(error, result);
      });

    });

    it('should be able to set expiry', function (done) {
      const key = faker.random.uuid();
      const value = faker.random.word();

      set(key, value, 'EX', 1, function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.eql(value);
        done(error, result);
      });

    });

    it('should be able to set save strategy', function (done) {
      const key = faker.random.uuid();
      const value = faker.random.word();

      set(key, value, 'EX', 1, 'NX', function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.eql(value);
        done(error, result);
      });

    });

  });

  describe('get', function () {

    const keyString = faker.random.uuid();
    const string = faker.random.word();

    const keyNumber = faker.random.uuid();
    const number = faker.random.number();

    const keyArray = faker.random.uuid();
    const array = [faker.random.word(), faker.random.word()];

    const keyObject = faker.random.uuid();
    const object = _.omit(faker.helpers.createTransaction(), 'date');

    before(function (done) {
      set(keyString, string, done);
    });

    before(function (done) {
      set(keyNumber, number, done);
    });

    before(function (done) {
      set(keyArray, array, done);
    });

    before(function (done) {
      set(keyObject, object, done);
    });

    it('should be able to get string', function (done) {

      get(keyString, function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.eql(string);
        done(error, result);
      });

    });

    it('should be able to get number', function (done) {

      get(keyNumber, function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.eql(number);
        done(error, result);
      });

    });

    it('should be able to get array', function (done) {

      get(keyArray, function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.eql(array);
        done(error, result);
      });

    });

    it('should be able to get plain object', function (done) {

      get(keyObject, function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.eql(object);
        done(error, result);
      });

    });

  });

  describe('hmset', function () {

    it('should be able to save simple object', function (done) {
      const key = faker.random.uuid();
      const value = faker.helpers.createTransaction();

      hmset(key, value, function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.eql(value);
        done(error, result);
      });

    });

    it('should be able to save nested object', function (done) {
      const key = faker.random.uuid();
      const value = faker.helpers.createCard();

      hmset(key, value, function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.eql(value);
        done(error, result);
      });

    });

  });

  describe('hgetall', function () {

    const keySimpleObject = faker.random.uuid();
    const simpleObject =
      _.omit(faker.helpers.createTransaction(), 'date');

    const keyNestedObject = faker.random.uuid();
    const nestedObject =
      _.omit(faker.helpers.createCard(), 'accountHistory');

    before(function (done) {
      hmset(keySimpleObject, simpleObject, done);
    });

    before(function (done) {
      hmset(keyNestedObject, nestedObject, done);
    });

    it('should be able to get simple object', function (done) {

      hgetall(keySimpleObject, function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.eql(simpleObject);
        done(error, result);
      });

    });

    it('should be able to get nested object', function (done) {

      hgetall(keyNestedObject, function (error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.eql(nestedObject);
        done(error, result);
      });

    });

  });

  after(function (done) {
    redis.clear(done);
  });

  after(function () {
    redis.reset();
  });

});
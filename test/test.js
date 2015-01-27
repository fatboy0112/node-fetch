
// test tools
var chai = require('chai');
var cap = require('chai-as-promised');
chai.use(cap);
var expect = chai.expect;
var bluebird = require('bluebird');
var then = require('promise');
var stream = require('stream');
var TestServer = require('./server');

// test subjects
var fetch = require('../index.js');
var Headers = require('../lib/headers.js');
var Response = require('../lib/response.js');
// test with native promise on node 0.11, and bluebird for node 0.10
fetch.Promise = fetch.Promise || bluebird;

var url, opts, local, base;

describe('Fetch', function() {

	before(function(done) {
		local = new TestServer();
		base = 'http://' + local.hostname + ':' + local.port;
		local.start(done);
	});

	after(function(done) {
		local.stop(done);
	});

	it('should return a promise', function() {
		url = 'http://example.com/';
		var p = fetch(url);
		expect(p).to.be.an.instanceof(fetch.Promise);
		expect(p).to.have.property('then');
	});

	it('should allow custom promise', function() {
		url = 'http://example.com/';
		var old = fetch.Promise;
		fetch.Promise = then;
		expect(fetch(url)).to.be.an.instanceof(then);
		fetch.Promise = old;
	});

	it('should throw error when no promise implementation found', function() {
		url = 'http://example.com/';
		var old = fetch.Promise;
		fetch.Promise = undefined;
		expect(function() {
			fetch(url)
		}).to.throw(Error);
		fetch.Promise = old;
	});

	it('should reject with error if url is protocol relative', function() {
		url = '//example.com/';
		return expect(fetch(url)).to.eventually.be.rejectedWith(Error);
	});

	it('should reject with error if url is relative path', function() {
		url = '/some/path';
		return expect(fetch(url)).to.eventually.be.rejectedWith(Error);
	});

	it('should reject with error if protocol is unsupported', function() {
		url = 'ftp://example.com/';
		return expect(fetch(url)).to.eventually.be.rejectedWith(Error);
	});

	it('should reject with error on network failure', function() {
		url = 'http://localhost:50000/';
		return expect(fetch(url)).to.eventually.be.rejectedWith(Error);
	});

	it('should resolve into response', function() {
		url = base + '/hello';
		return fetch(url).then(function(res) {
			expect(res).to.be.an.instanceof(Response);
			expect(res.headers).to.be.an.instanceof(Headers);
			expect(res.headers.get('content-type')).to.equal('text/plain');
			expect(res.status).to.equal(200);
			expect(res.statusText).to.equal('OK');
			expect(res.url).to.equal(url);
			expect(res.body).to.be.an.instanceof(stream.Transform);
			expect(res.bodyUsed).to.be.false;
		});
	});

});

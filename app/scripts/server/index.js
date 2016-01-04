var express = require('express');
var app = express();
var log = require('npmlog');
var util = require('util');
var sodium = require('libsodium-wrappers');
var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var fs = require('fs');
var mime = require('mime');

var events = {
  onNewSessionCreated: null
};

// In Memory Store
var sessionInfoLookup = {};

var authorise = function(req, res, next) {
  var failure = function() {
    res.set('WWW-Authenticate', 'Bearer token_type="JWT"');
    res.send(401, 'Unauthorised');
  };
  if (!req.get('Authorization')) {
    return failure();
  }
  var authToken = req.get('Authorization').split(' ')[1];
  if (!authToken) {
    return failure();
  }
  var sessionId = new Buffer(authToken.split('.')[1], 'base64').toString();
  if (!sessionId || !sessionInfoLookup[sessionId]) {
    return failure();
  }
  try {
    jwt.verify(authToken, sessionInfoLookup[sessionId].signingKey);
    next();
  } catch(e) {
    return failure();
  }
};



var AuthHandler = function(req, res) {
  var msgTemplate = 'Application: %s\nVendor: %s\n\nPermissions Requested:\n\t %s';
  var authReq = req.body;
  var permissions = authReq.permissions;
  var result = confirm(util.format(msgTemplate, authReq.app.name, authReq.app.vendor,
      permissions ? permissions[0] : 'NONE'));
  if (!result) {
    return res.send(401);
  }
  var appPubKey = new Uint8Array(new Buffer(authReq.publicKey, 'base64'));
  var appNonce = new Uint8Array(new Buffer(authReq.nonce, 'base64'));
  var sessionInfo = {};
  var sessionId = new Buffer(sodium.randombytes_buf(32)).toString('base64');
  var assymetricKeyPair = sodium.crypto_box_keypair();
  sessionInfo['app'] = authReq.app;
  sessionInfo['signingKey'] = new Buffer(sodium.randombytes_buf(sodium.crypto_box_SECRETKEYBYTES)).toString('base64');
  sessionInfo['permissions'] = permissions;
  sessionInfo['secretKey'] = sodium.randombytes_buf(sodium.crypto_box_SECRETKEYBYTES);
  var encryptedKey = sodium.crypto_box_easy(sessionInfo['secretKey'],appNonce, appPubKey, assymetricKeyPair.privateKey);
  var token = jwt.sign(sessionId, sessionInfo['signingKey']);
  sessionInfoLookup[sessionId] = sessionInfo;
  res.send(200, {
    token: token,
    encryptedKey: new Buffer(encryptedKey).toString('base64'),
    publicKey: new Buffer(assymetricKeyPair.publicKey).toString('base64'),
    permissions: permissions
  });
  if (events.onNewSessionCreated) {
    events.onNewSessionCreated(sessionId, sessionInfo);
  }
};

var unRegisteredAuthHandler = function(req, res) {
  var authReq = req.body;
  var permissions = [];
  var sessionInfo = {};
  var sessionId = new Buffer(sodium.randombytes_buf(32)).toString('base64');
  sessionInfo['app'] = authReq.app;
  sessionInfo['signingKey'] = new Buffer(sodium.randombytes_buf(sodium.crypto_box_SECRETKEYBYTES)).toString('base64');
  sessionInfo['permissions'] = permissions;
  var token = jwt.sign(sessionId, sessionInfo['signingKey']);
  sessionInfoLookup[sessionId] = sessionInfo;
  res.send(200, {
    token: token
  });
  if (events.onNewSessionCreated) {
    events.onNewSessionCreated(sessionId, sessionInfo);
  }
};

var getFile = function(req, res) {
  var filePath = path.resolve(__dirname, '../../content_store/', req.query.service + '.' + req.query.domain, req.query.path);
  log.info(filePath);

  try {
    var stat = fs.statSync(filePath);
    res.status(200);
    res.set('Content-Type', mime.lookup(filePath));
    res.set('Content-Length', stat.size);
    fs.createReadStream(filePath).pipe(res);
  } catch(e) {
    res.status(404);
    res.send();
  }
};

var getDirectoryList = function(req, res) {
  var sessionId = new Buffer(req.get('Authorization').split('.')[1], 'base64').toString();
  var sessionInfo = sessionInfoLookup[sessionId];
  if (!sessionInfo['signingKey']) {
    return req.send(403);
  }
  res.send(200, ['Home', 'Pictures', 'Downloads']);
};

var getDirectory = function(req, res) {
  var sessionId = new Buffer(req.get('Authorization').split('.')[1], 'base64').toString();
  var sessionInfo = sessionInfoLookup[sessionId];
  if (!sessionInfo['signingKey']) {
    return req.send(403);
  }
  res.send(200, ['index.html', 'app.css', 'app.js']);
};

app.get('/', function (req, res) {
  res.send(200, 'Gateway Service is Running!');
});

// Common
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', '*');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// Routes
app.post('/auth/registeredAccess', jsonParser, AuthHandler);
//app.post('/auth/unRegisteredAccess', jsonParser, unRegisteredAuthHandler);
app.get('/v1/dns/file', getFile);
app.get('/v1/nfs/directoryList', authorise, getDirectoryList);
app.get('/v1/nfs/directory', authorise, getDirectory);

app.get('/pac-file', function(req, res) {
  res.download(path.resolve('./pac-conf.pac'))
});

var server = app.listen(3000, function () {
  log.info('Example app listening at port ' + server.address().port);
  require('./proxy.js');
});

exports.onNewSession = function(callback) {
  events.onNewSessionCreated = callback;
};

exports.removeSession = function(sessionId) {
  delete sessionInfoLookup[sessionId];
};

exports.getSessionInfo = function(sessionId) {
  return sessionInfoLookup[sessionId];
};

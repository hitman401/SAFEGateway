var remote = require('remote');
var Menu = remote.require('menu');
var dialog = remote.require('dialog');
var path = require('path');
var util = require('util');
// Disable Menu bar
Menu.setApplicationMenu(null);
console.log(__dirname);
var appSrcFolderPath = __dirname;//(__dirname.indexOf('asar') === -1) ? path.resolve('app') : path.resolve(__dirname, '../../app/');
var jQuery = require(appSrcFolderPath + '/bower_components/jquery/dist/jquery.min');
var server;
var onNewSession = function(sessionId, sessionInfo) {
  var template = '<div id="%s" class="column card">\
      <div class="row">\
      <div class="col-sm-10">\
      <div class="appname margin-10-bottom">%s</div>\
      <div class="vendor">%s</div>\
      </div>\
      <div class="col-sm-2 margin-10-bottom">\
      <div onclick="moreInfo(\'%s\')">More Info</div>\
      <div onclick="removeSession(\'%s\', \'%s\')">Delete</div>\
      </div>\
      </div>\
      </div>';
  var domId = new Date().getTime();
  jQuery('#sessions_list').append(util.format(template, domId,
      sessionInfo.app.name + (sessionInfo['secretKey'] ? '' : '(Unregistered Access)'),
      sessionInfo.app.vendor, sessionId, sessionId, domId));
};

var validate = function() {
  jQuery('#login').hide();
  server = require(appSrcFolderPath + '/scripts/server/index.js');
  server.onNewSession(onNewSession);
  jQuery('#sessions').show();
};

var moreInfo = function(id) {
  alert('more info: ' + id);
};

var removeSession = function(id, domId) {
  server.removeSession(id);
  jQuery('#' + domId).remove();
};
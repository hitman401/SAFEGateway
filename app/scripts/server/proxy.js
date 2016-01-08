var http = require('http');
var httpProxy = require('http-proxy');
var url = require('url');
var log = require('npmlog');
var proxy = httpProxy.createProxyServer({});

http.createServer(function (req, res) {
  log.info('URL :: ' + req.url);
  var urlServe = url.parse(req.url);
  if (urlServe.host.indexOf('.safenet') > -1) { // Temp fix - use regex
    if (urlServe.host.indexOf('api.safenet') !== 0) {
      var tokens = urlServe.host.split('.');
      if (tokens.length === 3 && tokens[0] === 'www') { // redirect www.host to host
        res.statusCode = 302;
        res.setHeader('location', 'http://' + tokens[1] + '.' + tokens[2]);
        return res.end();
      }
      var service = tokens.length === 3 ? tokens[0] : 'www';
      var domain = tokens.length === 3 ? tokens[1] : tokens[0];
      var path = urlServe.pathname.split('/').slice(1).join('/') || 'index.html';
      req.url = urlServe.protocol + '//' + urlServe.host + '/v1/dns/file?service=' + service + '&domain=' + domain + '&path=' + path;
    }
    proxy.web(req, res, {target: 'http://localhost:3000/'});
  } else {
    proxy.web(req, res, {target: urlServe.protocol + '//' + urlServe.host});
  }
}).listen(8000);

log.info('Proxy server started');

const
  axios = require('axios'),
  crypto = require('crypto');

var BitruePrivate = function(api) {
  this.endPoint = "https://openapi.bitrue.com";
  this.apikey = api.apikey;
  this.secret = api.secret;
  this.passphrase = api.passphrase;
  this.timeout = 5000;
  this.keepalive = false;
};

var privateApi = module.exports = function(api) {
  return new BitruePrivate(api);
};

BitruePrivate.prototype.query = function(options) {

  const stamp=Date.now().toFixed(0);

  var query=Object.assign({},options.body);
  var source=stamp+options.method+options.url.replace(this.endPoint,'')+(Object.keys(query)==0?'':JSON.stringify(query));

  var signature = crypto.createHmac('sha256', this.secret).update(source).digest('base64');
  var phrase = crypto.createHmac('sha256', this.secret).update(this.passphrase).digest('base64');

//  options["headers"]={
//    "BT-API-KEY": this.apikey,
//    "BT-API-SIGN": signature,
//    "BT-API-TIMESTAMP": stamp,
//    "BT-API-PASSPHRASE": phrase,
//  };

  return axios(options).then(function(res) {
    return res.data
  }).catch(function(err) {
    console.log("Error",err,options);
    throw new Error(err.statusCode);
  });
};

BitruePrivate.prototype.getQuery = function(path, query) {
  var options = {
    method: "GET",
    url: this.endPoint + path,
    qs: query,
    json: true
  };
  return this.query(options);
};

BitruePrivate.prototype.otherQuery = function(method, path, query) {
  var options = {
    method: method,
    url: this.endPoint + path,
    body: query,
    json: true
  };
  return this.query(options);
};

//
// 
//


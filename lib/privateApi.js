const
  axios = require('axios'),
  util = require('util'),
  crypto = require('crypto');

const
  SIGN=true,
  NOSIGN=false;

var BitruePrivate = function(api) {
  this.endPoint = "https://openapi.bitrue.com",
  this.apikey = api.apikey;
  this.secret = api.secret;

  this.timeout = 5000;
  this.keepalive = false;
};

var privateApi = module.exports = function(api) {
  return new BitruePrivate(api);
};

BitruePrivate.prototype.query = function(options,sign) {

  if(sign) {
    const stamp=Date.now();
    if(!options.data.timestamp && !options.params.timestamp) { options.data["timestamp"]=stamp; };
    var source=JSON.stringify(Object.assign(options.params,options.data));
    var signature = crypto.createHmac('sha256',this.secret).update(source).digest('hex');
    options["params"]["signature"]=signature;
    options["headers"]={ "X-MBX-APIKEY": this.apikey };
  };

  return axios(options).then(function(res) {
    return res.data;
  }).catch(function(err) {
    const response={
      code: err.response.status,
      error: err.response.data.msg,
      reason: err.response.data.code,
      data: options
    };
    return response;
  });
};

BitruePrivate.prototype.getQuery = function(path,query,sign) {
  var options = {
    method: "GET",
    url: this.endPoint + path,
    params: query,
    data: {}
  };
  return this.query(options,sign);
};

BitruePrivate.prototype.otherQuery = function(method,path,query,sign) {
  var options = {
    method: method,
    url: this.endPoint + path,
    params: {},
    data: query
  };
  return this.query(options,sign);
};

//
// Account
//

BitruePrivate.prototype.getAccountInfo = function() {
  const path="/api/v1/account",options={};
  return this.otherQuery("GET",path,options,SIGN);
};

BitruePrivate.prototype.getBalances = async function() {
  const result=await this.getAccountInfo();
  return (result.hasOwnProperty("balances")?result.balances:result);
};

BitruePrivate.prototype.getFees = async function() {
  const result=await this.getAccountInfo();
  var fees={};
  Object.keys(result).forEach(key => {
    if(key.match(/.*Commission$/)) { fees[key]=result[key]; };
  });
  return (result.hasOwnProperty("balances")?fees:result);
};

BitruePrivate.prototype.getMyTrades = function(options) {
  var path="/api/v2/myTrades";
  return this.otherQuery("GET",path,{},SIGN);
};

BitruePrivate.prototype.getETFNetValue = async function(symbol) {
  var path="/api/v1/etf/net-value/"+symbol;
  return this.otherQuery("GET",path,{},SIGN);
};

//
// Orders
//

BitruePrivate.prototype.createOrder = function(options) {
  var path="/api/v1/order";
  return this.otherQuery("POST",path,options,SIGN);
};

BitruePrivate.prototype.getOrder = function(options) {
  var path="/api/v1/order";
  return this.otherQuery("GET",path,options,SIGN);
};

BitruePrivate.prototype.cancelOrder = function(options) {
  var path="/api/v1/order";
  return this.otherQuery("DELETE",path,options,SIGN);
};

BitruePrivate.prototype.getActiveOrders = function(options) {
  var path="/api/v1/openOrders";
  return this.otherQuery("GET",path,options,SIGN);
};

BitruePrivate.prototype.getOrders = function(options) {
  var path="/api/v1/allOrders";
  return this.otherQuery("GET",path,options,SIGN);
};

//
// Deposit & Withdraw
//

BitruePrivate.prototype.withdrawCommit = function(options) {
  const path="/api/v1/withdraw/commit";
  return this.otherQuery("POST",path,options);
};

BitruePrivate.prototype.getWithdrawals = function(options) {
  var path="/api/v1/withdraw/history",sep="?";
  options["timestamp"]=Date.now();
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  return this.getQuery(path,{});
};

BitruePrivate.prototype.getDeposits = function(options) {
  var path="/api/v1/deposit/history",sep="?";
  options["timestamp"]=Date.now();
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  return this.getQuery(path,{});
};

//
// WebSocket
//

BitruePrivate.prototype.createListenKey = function(options={}) {
  var path="/poseidon/api/v1/listenKey",sep="?";
  options["timestamp"]=Date.now();
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  return this.otherQuery("POST",path,{});
};

BitruePrivate.prototype.pingListenKey = function(key) {
  const path="/poseidon/api/v1/listenKey/"+key;
  return this.otherQuery("PUT",path,{});
};

BitruePrivate.prototype.deleteListenKey = function(key) {
  const path="/poseidon/api/v1/listenKey/"+key;
  return this.otherQuery("DELETE",path,{});
};

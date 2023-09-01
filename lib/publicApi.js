const
  axios = require('axios');

var BitruePublic = function() {
  this.endPoint = "https://openapi.bitrue.com";
  this.timeout = 10000;
  this.keepalive = false;
};

var publicApi = module.exports = function() {
  return new BitruePublic();
};

BitruePublic.prototype.query = function(options) {

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

BitruePublic.prototype.getQuery = async function(path,query) {
  var options = {
    method: "GET",
    url: this.endPoint + path,
    params: query,
    data: {}
  };
  return this.query(options);
};

BitruePublic.prototype.otherQuery = function(method,path,query,sign) {
  var options = {
    method: method,
    url: this.endPoint + path,
    params: {},
    data: query
  };
  return this.query(options);
};

//
// MARKET DATA 
//

BitruePublic.prototype.getSymbols = async function() {
  const result=await this.getExchangeInfo();
  return (result.hasOwnProperty("symbols")?result.symbols:result);
};

BitruePublic.prototype.getCurrencies = async function() {
  const result=await this.getExchangeInfo();
  return (result.hasOwnProperty("coins")?result.coins:result);
};

BitruePublic.prototype.getKlines = async function(options) {
  var path="/api/v1/market/kline",sep="?";
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  return this.getQuery(path,{});
};

BitruePublic.prototype.getOrderBook = async function(options) {
  var path="/api/v1/depth",sep="?";
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  return this.getQuery(path,{});
};

BitruePublic.prototype.getRecentTrades = async function(options) {
  var path="/api/v1/trades",sep="?";
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  return this.getQuery(path,{});
};

BitruePublic.prototype.getHistTrades = async function(options) {
  var path="/api/v1/historicalTrades",sep="?";
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  return this.getQuery(path,{});
};

BitruePublic.prototype.getAggregatedTrades = async function(options) {
  var path="/api/v1/aggTrades",sep="?";
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  return this.getQuery(path,{});
};

BitruePublic.prototype.getTicker = async function(options={}) {
  var path="/api/v1/ticker/24hr",sep="?";
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  const result=await this.getQuery(path,{});
  return (Array.isArray(result)?result:[result]);
};

BitruePublic.prototype.getLastPrice = async function(options) {
  var path="/api/v1/ticker/price",sep="?";
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  return this.getQuery(path,{});
};

BitruePublic.prototype.getBookTicker = async function(options) {
  var path="/api/v1/ticker/bookTicker",sep="?";
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  return this.getQuery(path,{});
};

//
// OTHERS
//

BitruePublic.prototype.getExchangeInfo = function() {
  const path="/api/v1/exchangeInfo";
  return this.getQuery(path,{});
};

BitruePublic.prototype.getServerTime = function() {
  const path="/api/v1/time";
  return this.getQuery(path,{});
};

BitruePublic.prototype.getConnectivity = function() {
  const path="/api/v1/ping";
  return this.getQuery(path,{});
};

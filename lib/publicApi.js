const
  axios = require('axios');

var BitruePublic = function() {
  this.endPoint = "https://openapi.bitrue.com";
  this.timeout = 5000;
  this.keepalive = false;
};

var publicApi = module.exports = function() {
  return new BitruePublic();
};

BitruePublic.prototype.query = async function(options) {

  try {
    const res=await axios(options);
    return res.data;
  } catch(err) {
    var response;
    if(err.hasOwnProperty("response")) {
      response={
        code: err.response.status,
        error: err.response.data.msg,
        reason: err.response.data.code,
        data: options
      };
    } else {
      response={
        code: err.code,
        error: "Unknown error occured",
        data: options
      };
    };
    return response;
  };
};

BitruePublic.prototype.getQuery = async function(path,query) {
  var options = {
    method: "GET",
    url: this.endPoint + path,
    params: query,
    data: {}
  };
  return await this.query(options);
};

//
// MARKET DATA 
//

BitruePublic.prototype.getSymbols = async function() {
  const result=await this.getExchangeInfo();
  if(result.error) { throw result; };
  return result.symbols;
};

BitruePublic.prototype.getCurrencies = async function() {
  const result=await this.getExchangeInfo();
  if(result.error) { throw result; };
  return result.coins;
};

BitruePublic.prototype.getKlines = async function(options) {
  var path="/api/v1/market/kline",sep="?";
  var weight=1;
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  const result=await this.getQuery(path,{});
  if(result.error) { throw result; };
  return result;
};

BitruePublic.prototype.getOrderBook = async function(options) {
  var path="/api/v1/depth",sep="?";
  var weight;
  switch(options.limit) {
    case 500: weight=5;
    case 1000: weight=10;
    default: weight=1
  };
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  const result=await this.getQuery(path,{});
  if(result.error) { throw result; };
  return result;
};

BitruePublic.prototype.getRecentTrades = async function(options) {
  var path="/api/v1/trades",sep="?";
  var weight=1;
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  const result=await this.getQuery(path,{});
  if(result.error) { throw result; };
  return result;
};

BitruePublic.prototype.getHistTrades = async function(options) {
  var path="/api/v1/historicalTrades",sep="?";
  var weight=5;
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  const result=await this.getQuery(path,{});
  if(result.error) { throw result; };
  return result;
};

BitruePublic.prototype.getAggregatedTrades = async function(options) {
  var path="/api/v1/aggTrades",sep="?";
  var weight=1;
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  const result=await this.getQuery(path,{});
  if(result.error) { throw result; };
  return result;
};

BitruePublic.prototype.getTicker = async function(options={}) {
  var path="/api/v1/ticker/24hr",sep="?";
  var weight=options.hasOwnProperty("symbol")?1:40;
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  var result=await this.getQuery(path,{});
  if(!Array.isArray(result)) {
    if(result.error) { throw result; };
    result=[result];
  };
  return result;
};

BitruePublic.prototype.getLastPrice = async function(options) {
  var path="/api/v1/ticker/price",sep="?";
  var weight=1;
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  const result=await this.getQuery(path,{});
  if(result.error) { throw result; };
  return result;
};

BitruePublic.prototype.getBookTicker = async function(options) {
  var path="/api/v1/ticker/bookTicker",sep="?";
  var weight=1;
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  const result=await this.getQuery(path,{});
  if(result.error) { throw result; };
  return result;
};

//
// OTHERS
//

BitruePublic.prototype.getExchangeInfo = async function() {
  const path="/api/v1/exchangeInfo";
  const result=await this.getQuery(path,{});
  if(result.error) { throw result; };
  return result;
};

BitruePublic.prototype.getServerTime = async function() {
  const path="/api/v1/time";
  const result=await this.getQuery(path,{});
  if(result.error) { throw result; };
  return result;
};

BitruePublic.prototype.sendPing = async function() {
  const path="/api/v1/ping";
  const result=await this.getQuery(path,{});
  if(result.error) { throw result; };
  return result;
};

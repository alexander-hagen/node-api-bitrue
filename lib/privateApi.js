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

BitruePrivate.prototype.query = async function(options,sign) {

  if(sign) {
    const stamp=Date.now();
    if(!options.data.timestamp && !options.params.timestamp) { options.data["timestamp"]=stamp; };
    var source=JSON.stringify(Object.assign(options.params,options.data));
    var signature = crypto.createHmac('sha256',this.secret).update(source).digest('hex');
    options["params"]["signature"]=signature;
    options["headers"]={ "X-MBX-APIKEY": this.apikey };
  };

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

BitruePrivate.prototype.getQuery = async function(path,query,sign) {
  var options = {
    method: "GET",
    url: this.endPoint + path,
    params: query,
    data: {}
  };
  return await this.query(options,sign);
};

BitruePrivate.prototype.otherQuery = async function(method,path,query,sign) {
  var options = {
    method: method,
    url: this.endPoint + path,
    params: {},
    data: query
  };
  return await this.query(options,sign);
};

//
// Account
//

BitruePrivate.prototype.getAccountInfo = async function() {
  const path="/api/v1/account",options={};
  var weight=5;
  const result=await this.getQuery(path,options,SIGN);
  if(result.error) {
    var err=new Error(result.error);
    Object.assign(err,result);
    throw err;
  };
  return result;
};

BitruePrivate.prototype.getBalances = async function() {
  const result=await this.getAccountInfo();
  return result.balances;
};

BitruePrivate.prototype.getFees = async function() {
  const result=await this.getAccountInfo();
  var fees={};
  Object.keys(result).forEach(key => {
    if(key.match(/.*Commission$/)) { fees[key]=result[key]; };
  });
  return fees;
};

BitruePrivate.prototype.getMyTrades = async function(options) {
  var path="/api/v2/myTrades",sep="?";
  const weight=5;
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  const result=await this.getQuery(path,{},SIGN);
  if(result.error) {
    var err=new Error(result.error);
    Object.assign(err,result);
    throw err;
  };
  return result;
};

BitruePrivate.prototype.getETFNetValue = async function(symbol) {
  var path="/api/v1/etf/net-value/"+symbol;
  var weight=1;
  const result=await this.getQuery(path,{},SIGN);
  if(result.error) {
    var err=new Error(result.error);
    Object.assign(err,result);
    throw err;
  };
  return result;
};

//
// Orders
//

BitruePrivate.prototype.createOrder = async function(options) {
  var path="/api/v1/order";
  var weight=1;
  const result=await this.otherQuery("POST",path,options,SIGN);
  if(result.error) {
    var err=new Error(result.error);
    Object.assign(err,result);
    throw err;
  };
  return result;
};

BitruePrivate.prototype.getOrder = async function(options) {
  var path="/api/v1/order";
  var weight=1;
  const result=await this.getQuery(path,options,SIGN);
  if(result.error) {
    var err=new Error(result.error);
    Object.assign(err,result);
    throw err;
  };
  return result;
};

BitruePrivate.prototype.cancelOrder = async function(options) {
  var path="/api/v1/order";
  var weight=1;
  const result=await this.otherQuery("DELETE",path,options,SIGN);
  if(result.error) {
    var err=new Error(result.error);
    Object.assign(err,result);
    throw err;
  };
  return result;
};

BitruePrivate.prototype.getActiveOrders = async function(options) {
  var path="/api/v1/openOrders",sep="?";
  const weight=1;
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  const result=await this.getQuery(path,{},SIGN);
  if(result.error) {
    var err=new Error(result.error);
    Object.assign(err,result);
    throw err;
  };
  return result;
};

BitruePrivate.prototype.getOrders = async function(options) {
  var path="/api/v1/allOrders",sep="?";
  const weight=5;
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  const result=await this.getQuery(path,{},SIGN);
  if(result.error) {
    var err=new Error(result.error);
    Object.assign(err,result);
    throw err;
  };
  return result;
};

//
// Deposit & Withdraw
//

BitruePrivate.prototype.withdrawCommit = async function(options) {
  const path="/api/v1/withdraw/commit";
  var weight=1;
  const result=await this.otherQuery("POST",path,options);
  if(result.error) {
    var err=new Error(result.error);
    Object.assign(err,result);
    throw err;
  };
  return result;
};

BitruePrivate.prototype.getWithdrawals = async function(options) {
  var path="/api/v1/withdraw/history",sep="?";
  var weight=1;
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  const result=await this.getQuery(path,{});
  if(result.error) {
    var err=new Error(result.error);
    Object.assign(err,result);
    throw err;
  };
  return result;
};

BitruePrivate.prototype.getDeposits = async function(options) {
  var path="/api/v1/deposit/history",sep="?";
  var weight=1;
  Object.keys(options).forEach(key => { path+=sep+key+"="+options[key]; sep="&"; });
  const result=await this.getQuery(path,{});
  if(result.error) {
    var err=new Error(result.error);
    Object.assign(err,result);
    throw err;
  };
  return result;
};

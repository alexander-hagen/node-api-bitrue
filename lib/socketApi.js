const
  axios = require('axios'),
  crypto = require('crypto'),
  pako = require('pako'),
  WebSocket = require('ws');

const
  marketUrl  = 'wss://ws.bitrue.com/market/ws', // Market Data Streams WebSocket  (GZIP)
  accountUrl = 'wss://wsapi.bitrue.com/stream?listenKey='; // User Data Streams WebSocket

const
  GZIP=true,
  NOZIP=false;

const
  SIGN=true,
  NOSIGN=false;

var SocketNum=0;
class SocketClient {

  constructor(url, keys, gzip, onConnected) {
    this._id = 1; // Request ID, incrementing
    this._onConnected = onConnected;
    this._promises = new Map();
    this._handles = new Map();

    this._pongInterval = undefined;
    this._pingTimeout = undefined;

    this._createSocket(url);

    this.compressed=gzip;
    this.name=(keys==undefined?"public":keys.name);
  }

  _createSocket(url) {
    this._ws = new WebSocket(url);

    this._ws.onopen = async () => {
      console.log('ws connected', this.name);

      if(this._onConnected!==undefined) { this._onConnected(); };

      this._pongInterval = setInterval(sendPong, 180000, this);
//      this._pingTimeout = setTimeout(terminateSocket, 20000, this);

    };

    this._ws.onclose = () => {
      console.log('ws closed', this.name);
      this._ws.emit('closed');
      this._promises.forEach((cb, id) => {
        this._promises.delete(id);
      });
      clearInterval(this._pongInterval);
    };

    this._ws.onerror = err => {
      console.log('ws error', this.name, err);
    };

    this._ws.onmessage = msg => {
      var key;

      var message,parts,method,symbol,option;
      if(this.compressed) { message = JSON.parse(pako.inflate(msg.data,{to:'string'})); } else { message=JSON.parse(msg.data); };

      switch(true) {
        case message.hasOwnProperty("ping"):
          console.log("Received",message);
          if(this._pingTimeout) { clearTimeout(this._pingTimeout); };
          heartbeat(this, message.ping);
          return;
          break;

        case message.hasOwnProperty("event_rep"):
          console.log("Response",message);
          key=message.event_rep+":"+message.channel;
          if (this._promises.has(key)) {
            const cb = this._promises.get(key);
            this._promises.delete(key);
            cb.resolve({code:"200", data: key});
          } else {
            console.log('Unprocessed response', this._promises, key, message)
          };
          break;

        case message.hasOwnProperty("event"):
          console.log("Response",message);
          switch(message.event) {
            case "ping": break;
            default:
              key=message.event;
              if (this._promises.has(key)) {
                const cb = this._promises.get(key);
                this._promises.delete(key);
                cb.resolve({code:"200", data: key});
              } else {
                console.log('Unprocessed response', this._promises, key, message)
              };
          };
          break;

        case message.hasOwnProperty("listenKey"):
          console.log("Response",message);
          break;

        case message.hasOwnProperty("tick"):
          console.log("Received",message.channel);
          var parts=message.channel.split("_"),method;
          const symbol=parts[1].toUpperCase();
          parts.splice(1,1);
          method=parts.join(".");

          if (this._handles.has(method)) {
            this._handles.get(method).forEach((cb,i) => { 
              cb(method,message.tick,symbol,message.ts);
             });
          } else {
            console.log('ws no handler', method);
          };
          break;

        case message.hasOwnProperty("e"):
          method=message.e;
          symbol=message.s;
           if (this._handles.has(method)) {
            this._handles.get(method).forEach((cb,i) => { 
              cb(method,message,symbol,message.E);
             });
          } else {
            console.log('ws no handler', method);
          };
          break;

        default:
          console.log("Unprocessed",method,message);
          break;
      };

    };

  }

  async request(key, options) {

    if (this._ws.readyState === WebSocket.OPEN) {
      return new Promise((resolve, reject) => {
        this._promises.set(key, {resolve, reject});
        this._ws.send(JSON.stringify(options));
        setTimeout(() => {
          if (this._promises.has(key)) {
            this._promises.delete(key);
            reject({"code":"408","error":"Request Timeout","data":options});
          };
        }, 10000);
      });
    } else { console.log("ws socket unavailable",key,options); };

  }

  setHandler(key, callback) {
    this._handles.set(key, []);
    this._handles.get(key).push(callback);
  }

  clearHandler(key) {
    if (this._handles.has(key)) { this._handles.delete(key); };
  }

}

function sendPong(socket) {
  if(socket._ws==null) { return; };

  const options={ event: "pong", ts: Date.now()};
  console.log("Send pong",socket.name,options);

  socket._ws.send(JSON.stringify(options));
}

function terminateSocket(socket) {

  console.log("Terminate socket "+socket.name);

  if(socket._ws!==null) {
    socket._ws.emit('closed');
    socket._ws.terminate();
//    socket._ws=null; // will be set to null when close is triggered
  };

};

function heartbeat(socket,pingid) {

  if(socket._ws==null) { return; };

  options={ pong: pingid }
  console.log('Pong ', socket.name, options);

  socket._ws.send(JSON.stringify(options));
  socket._pingTimeout = setTimeout(terminateSocket, 20000, socket);

};

var BitrueSocket = function(url, keys, token, gzip) {
  this.endPoint = "https://open.bitrue.com";
  this.baseURL = url;
  this.timeout = 5000;
  if(keys) {
    this.apikey = keys.apikey;
    this.secret = keys.secret;
  };
  this.initialized = false;
  this.authenticated = false;

  this.token=token;
  this.pingInterval = undefined;
  this.pongInterval = undefined;

  if(url) {
    if(token) { url+=token };
    this.socket = new SocketClient(url, keys, gzip, () => {
      this.initialized=true;
      if(keys!==undefined) { this.socket._ws.emit('authenticated'); } else { this.socket._ws.emit('initialized'); };
    });
  };
};

module.exports = {
  marketApi: function(keys) { return new BitrueSocket(marketUrl, keys, undefined, GZIP); },
  accountApi: function(keys,token) { return new BitrueSocket(accountUrl, keys, token, NOZIP); },
  streamApi: function(keys) { return new BitrueSocket(undefined,keys, undefined, NOZIP); }
};

BitrueSocket.prototype.setHandler = function(method, callback) {
  this.socket.setHandler(method, callback);
};

BitrueSocket.prototype.clearHandler = function(method) {
  this.socket.clearHandler(method);
};

BitrueSocket.prototype.query = async function(options,sign) {

  if(sign) {
    const stamp=Date.now();
    if(!options.data.timestamp && !options.params.timestamp) { options.data["timestamp"]=stamp; };
    var source=JSON.stringify(Object.assign(options.params,options.data));
    var signature = crypto.createHmac('sha256',this.secret).update(source).digest('hex');
    options["params"]["signature"]=signature;
    options["headers"]={ "X-MBX-APIKEY": this.apikey };
  };

  return await axios(options).then(function(res) {
    return res.data
  }).catch(function(err) {
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
        data: options
      };
    };
    return Promise.reject(response);
  });
};

BitrueSocket.prototype.getQuery = async function(path,query,sign) {
  var options = {
    method: "GET",
    url: this.endPoint + path,
    params: query,
    data: {}
  };
  return await this.query(options,sign);
};

BitrueSocket.prototype.otherQuery = async function(method,path,query,sign) {
  var options = {
    method: method,
    url: this.endPoint + path,
    params: {},
    data: query
  };
  return await this.query(options,sign);
};

//
// WEBSOCKET FEED
//

// Uses marketApi

BitrueSocket.prototype.subscribeOrderBook = async function(symbol) {
  const
    channel="market_"+symbol.toLowerCase()+"_simple_depth_step0",
    key="subed:"+channel;
  const options={
    "event":"sub",
    "params":{ "cb_id": symbol.toLowerCase(), "channel": channel }
  };
  const result = await this.socket.request(key,options);
  return result;
};

BitrueSocket.prototype.unsubscribeOrderBook = async function(symbol) {
  const
    channel="market_"+symbol.toLowerCase()+"_simple_depth_step0",
    key="unsubed:"+channel;
  const options={
    "event":"unsub",
    "params":{ "cb_id": symbol.toLowerCase(), "channel": channel }
  };
  const result = await this.socket.request(key,options);
  return result;
};

// Private

BitrueSocket.prototype.createListenKey = async function() {
  const path="/poseidon/api/v1/listenKey",options={};
  const result=await this.otherQuery("POST",path,options,SIGN);
  if(result.code==200) { this.pingInterval=setInterval(this.renewListenKey,1200000,result.data.listenKey,this); };
  return result;
};

BitrueSocket.prototype.renewListenKey = async function(key,handler=this) {
console.log("Renew listenKey",key);
  const path="/poseidon/api/v1/listenKey/"+key,options={};
  const results=await handler.otherQuery("PUT",path,options,SIGN);
};

BitrueSocket.prototype.deleteListenKey = function(key,handler=this) {
  if(this.pingInterval!==undefined) { clearInterval(this.pingInterval); };
//  if(this.pongInterval!==undefined) { clearInterval(this.pongInterval); };
  const path="/poseidon/api/v1/listenKey/"+key,options={};
  return handler.otherQuery("DELETE",path,options,SIGN);
};

// User User feed

BitrueSocket.prototype.subscribeOrderUpdates = async function(symbols) {
  const
    channel="user_order_update",
    key=channel;
  const options={
    "event":"sub",
    "params":{ "channel": channel }
  };
  const result = await this.socket.request(key,options);
  return result;
};

BitrueSocket.prototype.unsubscribeOrderUpdates = async function(symbols) {
  const
    channel="user_order_update",
    key=channel;
  const options={
    "event":"unsub",
    "params":{ "channel": channel }
  };
  const result = await this.socket.request(key,options);
  return result;
};

BitrueSocket.prototype.subscribeBalanceUpdates = async function() {
  const
    channel="user_balance_update",
    key=channel;
  const options={
    "event":"sub",
    "params":{ "channel": channel }
  };
  const result = await this.socket.request(key,options);
  return result;
};

BitrueSocket.prototype.unsubscribeBalanceUpdates = async function(symbols) {
  const
    channel="user_balance_update",
    key=channel;
  const options={
    "event":"unsub",
    "params":{ "channel": channel }
  };
  const result = await this.socket.request(key,options);
  return result;
};


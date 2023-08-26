const
  axios = require('axios'),
  crypto = require('crypto'),
  WebSocket = require('ws');

const
  marketUrl  = 'wss://ws.bitrue.com/market/ws',
  socketUrl = 'wss://wsapi.bitrue.com';

const
  GZIP=true,
  NOZIP=false;

var SocketNum=0;
class SocketClient {

  constructor(url, keys, gzip, token, onConnected) {
    this._id = 1; // Request ID, incrementing
    this._onConnected = onConnected;
    this._promises = new Map();
    this._handles = new Map();
    this._num=(++SocketNum);
    this._pingTimeout=token.instanceServers[0].pingTimeout;
    this._token=token;

    this._createSocket(url);

//    this.compressed=gzip;
    this.name=(keys==undefined?"market":keys.name);
  }

  _createSocket(url) {
    this._ws = new WebSocket(url);
    this._ws.onopen = async () => {
      console.log('ws connected', this.name);
      this.pingInterval = setInterval(sendPing, this._token.instanceServers[0].pingInterval, this);

      if(this._onConnected!==undefined) { this._onConnected(); };
    };

    this._ws.onclose = () => {
      console.log('ws closed', this.name);
      this._ws.emit('closed');
      this._promises.forEach((cb, id) => {
        this._promises.delete(id);
//        cb.reject(new Error('Disconnected'));
      });
      clearInterval(this.pingInterval);
      clearTimeout(this.pingTimeout);

      this._ws=null;
    };

    this._ws.onerror = err => {
      console.log('ws error', this.name, err);
//      setTimeout(() => this._createSocket(this._ws._url), 500);
    };

    this._ws.onmessage = msg => {
//      try {
        var message,parts,method,symbol,option;
        message=JSON.parse(msg.data);

        var request;
        switch(message.type) {

          case "welcome":
            break;

          case "ack":
            if (this._promises.has(message.id)) {
              const cb = this._promises.get(message.id);
              this._promises.delete(message.id);
              cb.resolve({code:"200", data: message.type});
            } else {
              console.log('Unprocessed response', this._promises, message.id, message)
            };
            break;

          case "pong":
            clearTimeout(this.pingTimeout);
            break;

          case "message":
            var method,symbol,option;
            const parts=message.topic.split(":");
            const params=parts.length==1?[""]:parts[1].split("_");
            switch(message.topic) {
              case "/market/ticker:all":
                symbol=message.subject;
                method="trade.ticker";                 
                break;
              default:
                method=message.subject;
                symbol=params[0];
                break;
            };
            option=params[1];

            if (this._handles.has(method)) {
              this._handles.get(method).forEach((cb,i) => { 
                cb(method,message.data,symbol,option);
               });
            } else {
              console.log('ws no handler', method);
            };

            break;

          case "notice":
            break;

          case "command":
            break;

          default:
            break;

        };

//      } catch (e) {
//        console.log('Fail parse message', e);
//      }

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
            reject({"code":"408","error":"Request Timeout"});
          };
        }, 10000);
      });
    } else { console.log("ws socket unavailable"); };

  }

  setHandler(key, callback) {
    this._handles.set(key, []);
    this._handles.get(key).push(callback);
  }

  clearHandler(key) {
    if (this._handles.has(key)) { this._handles.delete(key); };
  }

}

function sendPing(socket) {
  if(socket._ws==null) { return; };

  const request={ id: Date.now(), type: "ping"};
  console.log("Ping "+socket.name,request);

  socket.pingTimeout = setTimeout(terminateSocket, socket._token.instanceServers[0].pingTimeout, socket);
  socket._ws.send(JSON.stringify(request));
}

function terminateSocket(socket) {

  console.log("Terminate socket "+socket.name);

  clearInterval(socket.pingInterval);
  if(socket._ws!==null) {
    socket._ws.emit('closed');
    socket._ws.terminate();
//    socket._ws=null; // will be set to null when close is triggered
  };

};

var BitrueSocket = function(url, keys, token, gzip) {
  this.endPoint = "https://api.bitrue.com";
  this.baseURL = url;
  this.timeout = 5000;
  this.initialized = false;
  this.authenticated = false;
  this.token=token.data;

  var newurl=this.token.instanceServers[0].endpoint+"?token="+token.data.token;
  this.socket = new SocketClient(newurl, keys, gzip, this.token, () => {
    this.initialized=true;
    if(keys!==undefined) { this.socket._ws.emit('authenticated'); } else { this.socket._ws.emit('initialized'); };

  });
};

module.exports = {
  publicApi: function(token) { return new BitrueSocket(publicUrl, undefined, token, GZIP); },
  privateApi: function(keys,token) { return new BitrueSocket(privateUrl, keys, token, NOZIP); }
};

BitrueSocket.prototype.setHandler = function(method, callback) {
  this.socket.setHandler(method, callback);
};

BitrueSocket.prototype.clearHandler = function(method) {
  this.socket.clearHandler(method);
};

//
// WEBSOCKET FEED
//


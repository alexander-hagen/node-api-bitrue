const
  dotenv = require("dotenv").config(),
  bitrue = require("../index.js");

const
  apikey=process.env.MY_API_KEY,
  secret=process.env.MY_API_SECRET;

const
  symbol="BTCUSDC",
  invalid_symbol="!@#$%^&*",
  limit=5,
  depth=5;

const timeout=5000;

// Get sockets

var token;

var accountAPI;
var timers={};

describe('Market Data Steams WebSocket', () => {

  var marketAPI;

  beforeAll(async () => { // initialize socket
    marketAPI=new bitrue.sockets.marketApi();
    await waitForConnection(marketAPI);
    await marketAPI.setHandler('market.simple.depth.step0', (method,data,symbol,stamp) => { eventHandler(method); });
    return;
  });

  test('Test subscribeOrderBook() function', async () => {
    const result=await marketAPI.subscribeOrderBook(symbol);
    expect(result).toHaveProperty("code", "200");
  }, timeout);

  test('Test market.simple.depth.step0 event', async () => {
    const result=await waitForPromise('market.simple.depth.step0');
    expect(result).toHaveProperty("code", "200");;
  }, timeout);

  //test('Test pong/ping function', async () => {
  //}, timeout);

  //test('Test unsubscribeOrderBook() function', async () => {
  //  const result=await marketAPI.unsubscribeOrderBook(symbol);
  //  expect(result).toHaveProperty("code", "200");
  //}, timeout);

  afterAll(async () => { // clean-up socket
    await marketAPI.clearHandler('market.simple.depth.step0');
    marketAPI.socket.terminate();
  });

});

describe('User Data Steams WebSocket', () => {

  var streamAPI,accountAPI,token;

  beforeAll(async () => { // initialize socket
    const
      streamAPI=new bitrue.sockets.streamApi({ "apikey": apikey, "secret": secret, "name": "stream"  }),
      listenkey=await streamAPI.createListenKey();
    if(listenkey.data) {
      token=listenkey.data.listenKey;
      accountAPI=new bitrue.sockets.accountApi({ "apikey": apikey, "secret": secret, "name": "account" }, token);
    };
    await waitForConnection(accountAPI);
    await accountAPI.setHandler('executionReport', (method,data,symbol,stamp) => { eventHandler(method); });
    await accountAPI.setHandler('BALANCE', (method,data,symbol,stamp) => { eventHandler(method); });
    return;
  });

  test('Test subscribeOrderUpdates() function', async () => {
    const result=await accountAPI.subscribeOrderUpdates();
    expect(result).toHaveProperty("code", "200");
  }, timeout);

  //test('Test executionReport event', async () => {
  //  const result=await waitForPromise('executionReport');
  //  expect(result).toHaveProperty("code", "200");
  //}, timeout);

  test('Test unsubscribeOrderUpdates() function', async () => {
    const result=await accountAPI.unsubscribeOrderUpdates();
    expect(result).toHaveProperty("code", "200");
  }, timeout);

  test('Test subscribeBalanceUpdates() function', async () => {
    const result=await accountAPI.subscribeBalanceUpdates();
    expect(result).toHaveProperty("code", "200");
  }, timeout);

  //test('Test BALANCE event', async () => {
  //  const result=await waitForPromise('BALANCE');
  //  expect(result).toHaveProperty("code", "200");;
  //}, timeout);

  test('Test unsubscribeBalanceUpdates() function', async () => {
    const result=await accountAPI.unsubscribeBalanceUpdates();
    expect(result).toHaveProperty("code", "200");
  }, timeout);

  //test('Test ping/pong function', async () => {
  //}, timeout);

  test('Test renewListenKey() function', async () => {
    const result=await accountAPI.renewListenKey(token);
    expect(result).toHaveProperty("code", 200);
  }, timeout);

  test('Test deleteListenKey() function', async () => {
    const result=await accountAPI.deleteListenKey(token);
    expect(result).toHaveProperty("code", 200);
  }, timeout);

  afterAll(async () => { // clean-up socket
    await accountAPI.clearHandler('executionReport');
    await accountAPI.clearHandler('BALANCE');
    accountAPI.socket.terminate();
  });

});

//test('Test createListenKey() function', async () => {
//  const result=await streamAPI.createListenKey();
//  if(result.data) { token=result.data.listenKey; };
//  expect(result).toHaveProperty("code", 200);
//}, timeout);

// Error testing

// Helper functions

function stringIsJSON(str) {
  try { 
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

function objectIsJSON(obj) {
  try { 
    JSON.parse(JSON.stringify(obj));
    return true;
  } catch {
    return false;
  }
};

function checkError(obj,code,reason) {
  if(obj.code==code && obj.reason==reason) { return true; }
  return false;
};

function waitForConnection(websocket) {
  var socketResolve,socketReject;
  var done=false;
  var timer=setTimeout( () => { if(!done) { socketReject(done); }; }, timeout);

  websocket.socket._ws.on('authenticated', async () => { // Wait for websocket to authenticate.
    console.log('authenticated');
    done=true;clearTimeout(timer);socketResolve(done);
  });

  websocket.socket._ws.on('initialized', async () => { // Wait for websocket to initialize.
    console.log('initialized');
    done=true;clearTimeout(timer);socketResolve(done);
  });

  var promise=new Promise(function(resolve, reject) { socketResolve=resolve; socketReject=reject; });

  return promise;
};

var _promises = new Map();

function eventHandler(key) {
  console.log("Received event ",key);
  if (_promises.has(key)) {
    clearTimeout(timers[key]);
    const cb = _promises.get(key);
    _promises.delete(key);
    cb.resolve({code:"200", data: key});
  };
};

function waitForPromise(key) {
  var promise=new Promise((resolve, reject) => {
    _promises.set(key, {resolve, reject});
    timers[key]=setTimeout(() => {
      if (_promises.has(key)) {
        _promises.delete(key);
        reject({"code":"408", "data": key});
      };
    }, timeout-1000);
  });
  return promise;
};

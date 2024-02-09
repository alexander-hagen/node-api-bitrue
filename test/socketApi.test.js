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
var timers={},resolved=[],rejected=[];

describe('Market Data Steams WebSocket', () => {

  var marketAPI;

  beforeAll(async () => { // initialize socket
    marketAPI=new bitrue.sockets.marketApi();
    await marketAPI.setHandler('market.simple.depth.step0', (method,data,symbol,stamp) => { eventHandler(method); });
    return waitForConnection(marketAPI);
  });

  test('Test subscribeOrderBook() function', async () => {
    const result=await marketAPI.subscribeOrderBook(symbol);
    expect(result).toHaveProperty("code", "200");
  }, timeout);

  test('Test market.simple.depth.step0 event', async () => {
    const received=await waitForPromise('market.simple.depth.step0');
    expect(received).toBe(true);
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
    await streamAPI.setHandler('executionReport', (method,data,symbol,stamp) => { eventHandler(method); });
    await streamAPI.setHandler('BALANCE', (method,data,symbol,stamp) => { eventHandler(method); });
    return waitForConnection(accountAPI);
  });

  test('Test subscribeOrderUpdates() function', async () => {
    const result=await accountAPI.subscribeOrderUpdates();
    expect(result).toHaveProperty("code", "200");
  }, timeout);

  test('Test executionReport event', async () => {
    const received=await waitForPromise('executionReport');
    expect(received).toBe(true);
  }, timeout);

  test('Test unsubscribeOrderUpdates() function', async () => {
    const result=await accountAPI.unsubscribeOrderUpdates();
    expect(result).toHaveProperty("code", "200");
  }, timeout);

  test('Test subscribeBalanceUpdates() function', async () => {
    const result=await accountAPI.subscribeBalanceUpdates();
    expect(result).toHaveProperty("code", "200");
  }, timeout);

  test('Test BALANCE event', async () => {
    const received=await waitForPromise('BALANCE');
    expect(received).toBe(true);
  }, timeout);

  test('Test unsubscribeBalanceUpdates() function', async () => {
    const result=await accountAPI.unsubscribeBalanceUpdates();
    expect(result).toHaveProperty("code", "200");
  }, timeout);

  //test('Test ping/pong function', async () => {
  //}, timeout);

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

// Clean-up tests

//test('Test renewListenKey() function', async () => {
//  const result=await streamAPI.renewListenKey(token);
//  expect(result).toHaveProperty("code", 200);
//}, timeout);

//test('Test deleteListenKey() function', async () => {
//  const result=await streamAPI.deleteListenKey(token);
//console.log("Delete Listenkey",result);
//  expect(result).toHaveProperty("code", 200);
//}, timeout);


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
    done=true;clearTimeout(timer);socketResolve(done);
  });

  websocket.socket._ws.on('initialized', async () => { // Wait for websocket to initialize.
    done=true;clearTimeout(timer);socketResolve(done);
  });

  var promise=new Promise(function(resolve, reject) { socketResolve=resolve; socketReject=reject; });

  return promise;
};

function eventHandler(method) {
  console.log("Event",method);
  clearTimeout(timers[method]);
  resolved[method](true);
};

function waitForPromise(method) {
  timers[method]=setTimeout( () => { rejected[method](false); }, timeout-1000);
  var promise=new Promise(function(resolve, reject) { resolved[method]=resolve; rejected[method]=reject; });
  return promise;
};

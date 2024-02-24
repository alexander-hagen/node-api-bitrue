const
  bitrue = require("../index.js");

const
  publicAPI=new bitrue.publicApi(),
  timeout=publicAPI.timeout;

const
  symbol="BTCUSDC",
  limit=5,
  depth=5;

// Normal requests

test('Test getSymbols() function', async () => {
  expect(objectIsJSON(await publicAPI.getSymbols())).toBe(true);
}, timeout);

test('Test getCurrencies() function', async () => {
  expect(objectIsJSON(await publicAPI.getCurrencies())).toBe(true);
}, timeout);

test('Test getKlines() function', async () => {
  const options={ symbol: symbol, scale: "1m", limit: limit };
  expect(objectIsJSON(await publicAPI.getKlines(options))).toBe(true);
}, timeout);

test('Test getOrderBook() function', async () => {
  const options={ symbol: symbol, depth: depth };
  expect(objectIsJSON(await publicAPI.getOrderBook(options))).toBe(true);
}, timeout);

test('Test getRecentTrades() function', async () => {
  const options={ symbol: symbol, limit: limit };
  expect(objectIsJSON(await publicAPI.getRecentTrades(options))).toBe(true);
}, timeout);

test('Test getHistTrades() function', async () => {
  const options={ symbol: symbol, limit: limit };
  expect(objectIsJSON(await publicAPI.getHistTrades(options))).toBe(true);
}, timeout);

test('Test getAggregatedTrades() function', async () => {
  const options={ symbol: symbol, limit: limit };
  expect(objectIsJSON(await publicAPI.getAggregatedTrades(options))).toBe(true);
}, timeout);

test('Test getTicker() function', async () => {
  const options={ symbol: symbol };
  expect(objectIsJSON(await publicAPI.getTicker(options))).toBe(true);
}, timeout);

test('Test getLastPrice() function', async () => {
  const options={ symbol: symbol };
  expect(objectIsJSON(await publicAPI.getLastPrice(options))).toBe(true);
}, timeout);

test('Test getBookTicker() function', async () => {
  const options={ symbol: symbol };
  expect(objectIsJSON(await publicAPI.getBookTicker(options))).toBe(true);
}, timeout);

test('Test getServerTime() function', async () => {
  expect(objectIsJSON(await publicAPI.getServerTime())).toBe(true);
}, timeout);

test('Test sendPing() function', async () => {
  expect(await publicAPI.sendPing()).toStrictEqual({});
}, timeout);

// Error testing

test('Test Error: 412 (-1102) Mandatory parameter is missing or illegal.', async () => {
  const options={ };
  try {
    await publicAPI.getLastPrice(options);
    expect(true).toBe(false);
  } catch (err) {
    expect(err.code == 412 && err.reason == -1102).toBeTruthy();
  };
}, timeout);

test('Test Error: 412 (-1121) Invalid symbol', async () => {
  const options={ symbol: "!@#$%^" };
  try {
    await publicAPI.getLastPrice(options);
    expect(true).toBe(false);
  } catch (err) {
    expect(err.code === 412 && err.reason === -1121).toBeTruthy();
  };
}, timeout);

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
const
  dotenv = require("dotenv").config(),
  bitrue = require("../index.js");

const
  apikey=process.env.MY_API_KEY,
  secret=process.env.MY_API_SECRET,
  privateAPI=new bitrue.privateApi({ "apikey": apikey, "secret": secret });
  timeout=privateAPI.timeout;

const
  symbol="BTCUSDC",
  limit=5,
  depth=5;

// Normal requests

test('Test getAccountInfo() function', async () => {
  expect(objectIsJSON(await privateAPI.getAccountInfo())).toBe(true);
}, timeout);

test('Test getBalances() function', async () => {
  expect(objectIsJSON(await privateAPI.getBalances())).toBe(true);
}, timeout);

test('Test getFees() function', async () => {
  expect(objectIsJSON(await privateAPI.getFees())).toBe(true);
}, timeout);

test('Test getMyTrades() function', async () => {
  const options={ symbol: symbol, limit: limit };
  expect(objectIsJSON(await privateAPI.getMyTrades(options))).toBe(true);
}, timeout);

test('Test getETFNetValue() function', async () => {
  expect(objectIsJSON(await privateAPI.getETFNetValue(symbol))).toBe(true);
}, timeout);

// BitruePrivate.prototype.createOrder = function(options) {
// BitruePrivate.prototype.getOrder = function(options) {
// BitruePrivate.prototype.cancelOrder = function(options) {

test('Test getActiveOrders() function', async () => { // timestamp set by function
  const options={ symbol: symbol, limit: limit };
  expect(objectIsJSON(await privateAPI.getActiveOrders(options))).toBe(true);
}, timeout);

test('Test getOrders() function', async () => { // timestamp set by function
  const options={ symbol: symbol, limit: limit };
  expect(objectIsJSON(await privateAPI.getOrders(options))).toBe(true);
}, timeout);

// BitruePrivate.prototype.withdrawCommit = function(options) {
// BitruePrivate.prototype.getWithdrawals = function(options) {
// BitruePrivate.prototype.getDeposits = function(options) {

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
# node-api-bitrue

**WARNING: Due to lack of funds on Bitrue, only market data is available.**

Sponsorship of USD 10-15 will be needed to implement ordering API's. All donations are welcome and are sent directly to my Bitrue account:

| Asset         | Deposit Address                            |
| :------------ | :----------------------------------------- |
| BTR (ERC-20)  | 0xc2fe1b83505609056fad3f341202b214b16604f8 |
| USDT (ERC-20) | 0xc2fe1b83505609056fad3f341202b214b16604f8 |
| BTC (BTC)     | 1HrcoDh8ZvzCov1dWQ9mw4Fo9vCycvpgNH         |

Non-official implementation of Bitrue's API's. Developed for personal use.

For support on using the API's or development issues, please refer to the official API documentation. For questions regarding this package, please consult the code first.

Ping and pong messages are built-in to the API. No user action required.
When required, and if not set, timestamp parameters are automatically set by the API.

## __PUBLIC API__

```javascript
  const bitrue=require('node-api-bitrue');

  const publicAPI=new bitrue.publicApi();

```

### Market Data

| API                     | DESCRIPTION |
| :----                   | :---- |
| getSymbols              | Derivative from getExchangeInfo() |
| getCurrencies           | Derivative from getExchangeInfo() |
| getKlines               | |
| getOrderBook            | |
| getRecentTrades         | |
| getHistTrades           | |
| getAggregatedTrades     | |
| getTicker               | |
| getLastPrice            | |
| getBookTicker           | |

### Other

| API                     | DESCRIPTION |
| :----                   | :---- |
| getExchangeInfo         | |
| getServerTime           | |
| getConnectivity         | |

## __PRIVATE API__

```javascript
  const bitrue=require('node-api-bitrue');

  const auth = {
    apikey: 'MY_API_KEY',
    secret: 'MY_API_SECRET'
  };

  const privateAPI=new bitrue.privateApi(auth);

```

### Account

| API                     | DESCRIPTION |
| :----                   | :---- |
| getAccountInfo          | |
| getBalances             | Derivative from getAccountInfo() }
| getFees                 | Derivative from getAccountInfo() }
| getETFNetValue          | |

### Orders

| API                     | DESCRIPTION |
| :----                   | :---- |
| createOrder             | May or may not work. Needs funding to finalize. |
| getOrder                | May or may not work. Needs funding to finalize. |
| cancelOrder             | May or may not work. Needs funding to finalize. |
| getActiveOrders         | May or may not work. Needs funding to finalize. |
| getOrders               | May or may not work. Needs funding to finalize. |
| getAccountTrades        | May or may not work. Needs funding to finalize. |

### Deposit & Withdraw

| API                     | DESCRIPTION |
| :----                   | :---- |
| withdrawCommit          | May or may not work. Needs funding to finalize. |
| getWithdrawals          | |
| getDeposits             | |

## __WEBSOCKET API__

```javascript
  const bitrue=require('node-api-bitrue');

  const auth = {
    apikey: 'MY_API_KEY',
    secret: 'MY_API_SECRET'
  };

  const marketAPI=new bitrue.sockets.marketApi();
  marketAPI.setHandler('market.simple.depth.step0', (method,data,symbol,stamp) => { snapshotOrderBook(symbol,method,data,handler); });

  marketAPI.socket._ws.on('initialized', async () => {
    // do your own initialization, e.g. subscribe to orderbook
  });

  function snapshotOrderBook(symbol,method,data,handler) {
    // do something
  };

  const streamAPI=new bitrue.sockets.streamApi(auth);
  var res=await streamAPI.createListenKey();
  const token=res.data.listenKey;

  const accountAPI=new bitrue.sockets.userApi(auth,token);
  accountAPI.setHandler('executionReport', (symbol,method,data,option) => { updateOrder(symbol,method,data); });
  accountAPI.setHandler('BALANCE', (symbol,method,data,option) => { updateBalance(symbol,method,data); });

  accountAPI.socket._ws.on('authenticated', async () => {
    // do your own initialization, e.g. subscribe to updates
  });

  accountAPI.socket._ws.on('closed', async () => {
    // do something, like clean-up and reconnect
  });

  function updateOrder(symbol,method,data) {
    // do something
  };

  function updateBalance(symbol,method,data) {
    // do something
  };

```

| API                                               | HANDLER                   | DESCRIPTION |
| :----                                             | :----                     | :---- |
| subscribeOrderBook unsubscribeOrderBook           | market.simple.depth.step0 | Uses marketApi  |
| createListenKey                                   |                           | Uses streamAPI, calls renewListenKey at 20min intervals |
| renewListenKey                                    |                           | Uses streamAPI  |
| deleteListenKey                                   |                           | Uses streamAPI  |
| subscribeOrderUpdates unsubscribeOrderUpdates     | executionReport           | Uses accountApi |
| subscribeBalanceUpdates unsubscribeBalanceUpdates | BALANCE                   | Uses accountApi |

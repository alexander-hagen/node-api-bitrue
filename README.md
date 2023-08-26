# node-api-bitrue

**WARNING: This package is still early beta! Expect breaking changes until this sees a major release.**

Non-official implementation of Bitrue's API's. Developed for personal use.

For support on using the API's or development issues, please refer to the official API documentation. For questions regarding this package, please consult the code first.

## __PUBLIC API__

```javascript
  const bitrue=require('node-api-bitrue');

  const publicAPI=new bitrue.publicApi();

```

| API                     | DESCRIPTION |
| :----                   | :---- |

## __PRIVATE API__

```javascript
  const bitrue=require('node-api-bitrue');

  const auth = {
    apikey: 'MY_API_KEY',
    secret: 'MY_API_SECRET'
  };

  const privateAPI=new bitrue.privateApi(auth);

```

| API                     | DESCRIPTION |
| :----                   | :---- |

## __WEBSOCKET API__

```javascript
  const bitrue=require('node-api-bitrue');

  const auth = {
    apikey: 'MY_API_KEY',
    secret: 'MY_API_SECRET'
  };

  const marketAPI=new bitrue.sockets.marketApi();
  marketAPI.socket._ws.on('initialized', async () => {
    // do your own initialization
  });

  const tradingAPI=new bitrue.sockets.tradingApi(auth);
  tradingAPI.setHandler('orders', (symbol,method,data,option) => { updateOrder(symbol,method,data); });

  tradingAPI.socket._ws.on('authenticated', async () => {
    const res=await tradingAPI.subscribeOrderUpdates();
  });

  tradingAPI.socket._ws.on('closed', async () => {
    // do something, like clean-up and reconnect
  });

  function updateOrder(symbol,method,data) {
    // do something
  };

```

| API                                       | HANDLER              | DESCRIPTION |
| :----                                     | :----                | :---- |


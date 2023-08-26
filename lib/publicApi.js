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

BitruePublic.prototype.getQuery = async function(path) {
  const request={
      url: this.endPoint + path,
      method: "GET",
      timeout: this.timeout,
      forever: this.keepalive,
    };
  return result=await axios(request)
    .then(function(res) {
      return res.data;
    })
    .catch(function(err) {
      console.log("Error: " + err,request);
      throw new Error(err.statusCode);
    });
};

BitruePublic.prototype.otherQuery = async function(method,path) {
  const request={
      url: this.endPoint + path,
      method: method,
      timeout: this.timeout,
      forever: this.keepalive,
    };
  return result=await axios(request)
    .then(function(res) {
      return res.data;
    })
    .catch(function(err) {
      console.log("Error: " + err,request);
      throw new Error(err.statusCode);
    });
};

//
// 
//


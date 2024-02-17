chrome.proxy.settings.set({
    value: {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: "http",
          host: "192.53.138.185",
          port: 6123,
          username: 'qncfrkqa',
          password: '5khqiuxpqsg4'
        }
      }
    },
    scope: "regular",
},
function() {});
  
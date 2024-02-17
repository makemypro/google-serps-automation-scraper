const utils = require("../utils.js");
const browser_utils = require("../cdp/browser_utils");
const proxy_utils = require("../cdp/proxy_utils.js");

const fs = require('fs');
let env = {}
proxy_utils.get_proxy().then(async proxy => {
    env['HTTPS_PROXY'] = proxy.http_proxy_url;
    env['HTTP_PROXY'] = proxy.http_proxy_url;
    env['PROXY_USERNAME'] = proxy.credentials.username;
    env['PROXY_PASSWORD'] = proxy.credentials.password;
    console.log("process", env)
    fs.writeFileSync('.env', Object.entries(env).map(([key, value]) => `${key}=${value}`).join('\n'));
    process.exit()
})
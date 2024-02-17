const CDP = require('chrome-remote-interface');
const chromeLauncher = require('chrome-launcher');
const utils = require("../utils");
const R = require("rambdax");
const fs = require("fs");
const imagePath = './image.jpeg';
const SEARCHBOX_SELECTOR = "input";
const request = require('request');
const execSync = require("child_process").execSync;
const axios = require('axios');
// captcha service urls and credentials
const deathByCaptchaUrl = 'http://api.dbcapi.me/api/captcha';
const twoCaptchaUrl = 'http://2captcha.com/in.php';
const deathByCaptchaUsername = 'marslan';
const deathByCaptchaPassword = 'Found?tion11';
const api_key = 'f3d80e6f9a641400b8c4ac0347eb8831';
const redis = require('redis');
const url = require('url');
const fetch = require('cross-fetch');

async function get_redis_client(url){
  if (!url) {
    url = 'redis://:eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81@redis:6379'
  }
  let redisClient = redis.createClient({url: url});

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
  return new Promise((resolve, reject) => {
     resolve(redisClient)
  });
}

exports.get_redis_client = get_redis_client

const redis_serps_count_key = 'serps_count_key'
const captcha_appear_after_serps_count_key = 'captcha_appeared_after'

const DESKTOP_USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_2_7) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/49.0.1708.385 Safari/537',
    // 'Mozilla/5.0 (Macintosh; Intel Mac OS X 7_8_8) Gecko/20100101 Firefox/51.1',  // unsupported browser in YT
    // 'Mozilla/5.0 (U; Linux i574 x86_64; en-US) AppleWebKit/603.28 (KHTML, like Gecko) Chrome/47.0.2809.268 Safari/601',  // unsupported browser in YT
    // 'Mozilla/5.0 (U; Linux x86_64; en-US) Gecko/20100101 Firefox/46.6',  // unsupported browser in YT
    'Mozilla/5.0 (Windows; Windows NT 6.3; Win64; x64; en-US) AppleWebKit/536.47 (KHTML, like Gecko) Chrome/53.0.3503.383 Safari/600',
    'Mozilla/5.0 (Linux; Linux i555 x86_64) AppleWebKit/603.9 (KHTML, like Gecko) Chrome/50.0.2698.142 Safari/600',
    'Mozilla/5.0 (Windows; Windows NT 10.0; Win64; x64; en-US) Gecko/20100101 Firefox/68.8',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 9_2_1) Gecko/20130401 Firefox/52.4',
    'Mozilla/5.0 (U; Linux i676 ; en-US) Gecko/20100101 Firefox/64.5',
    // 'Mozilla/5.0 (Linux; Linux i543 x86_64; en-US) Gecko/20100101 Firefox/46.9',  // unsupported browser in YT
    'Mozilla/5.0 (U; Linux i582 x86_64; en-US) Gecko/20100101 Firefox/66.2',
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 8_5_3) AppleWebKit/601.27 (KHTML, like Gecko) Chrome/50.0.1700.365 Safari/537',
    'Mozilla/5.0 (U; Linux i664 ; en-US) AppleWebKit/600.19 (KHTML, like Gecko) Chrome/53.0.2867.152 Safari/537',
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_1_4; en-US) Gecko/20130401 Firefox/69.5',
    // 'Mozilla / 5.0 (compatible; MSIE 10.0; Windows; U; Windows NT 6.1; Trident / 6.0)',  // unsupported browser in YT
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 9_4_3) AppleWebKit/602.23 (KHTML, like Gecko) Chrome/55.0.3509.121 Safari/602',
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; en-US) Gecko/20100101 Firefox/60.3',
    // 'Mozilla/5.0 (Linux; Linux i642 x86_64; en-US) Gecko/20100101 Firefox/46.0',  // unsupported browser in YT
    'Mozilla/5.0 (Linux x86_64; en-US) AppleWebKit/601.28 (KHTML, like Gecko) Chrome/51.0.2310.396 Safari/534',
    // 'Mozilla / 5.0 (compatible; MSIE 9.0; Windows; Windows NT 6.2;; en-US Trident / 5.0)',  // unsupported browser in YT
    // 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 9_3_1) Gecko/20130401 Firefox/45.8',  // unsupported browser in YT
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 7_7_6; en-US) Gecko/20100101 Firefox/70.3',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2; en-US) Gecko/20100101 Firefox/58.4',
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 8_9_0; en-US) AppleWebKit/537.48 (KHTML, like Gecko) Chrome/52.0.2441.156 Safari/536',
    'Mozilla/5.0 (Windows; U; Windows NT 6.2; WOW64; en-US) AppleWebKit/602.21 (KHTML, like Gecko) Chrome/53.0.3190.398 Safari/603',
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_4_1; en-US) Gecko/20100101 Firefox/68.5',
    'Mozilla/5.0 (Windows NT 10.1; Win64; x64) Gecko/20100101 Firefox/63.5',
    // 'Mozilla / 5.0 (compatible; MSIE 8.0; Windows; Windows NT 6.2; WOW64 Trident / 4.0)',   // unsupported browser in YT
    // 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 9_6_6) AppleWebKit/602.10 (KHTML, like Gecko) Chrome/47.0.1608.391 Safari/537',  // unsupported browser in YT
    'Mozilla/5.0 (Windows NT 6.2; x64; en-US) Gecko/20100101 Firefox/66.5',
    'Mozilla/5.0 (Linux i570 ) AppleWebKit/537.12 (KHTML, like Gecko) Chrome/49.0.3591.190 Safari/601',
    // 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_1_3) AppleWebKit/601.12 (KHTML, like Gecko) Chrome/47.0.2456.246 Safari/602',  // unsupported browser in YT
    'Mozilla/5.0 (Linux i562 x86_64) Gecko/20100101 Firefox/57.3',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 7_8_8) Gecko/20100101 Firefox/66.1',
    'Mozilla/5.0 (Windows; U; Windows NT 10.5;; en-US) Gecko/20100101 Firefox/60.7',
    'Mozilla/5.0 (Linux i683 x86_64) Gecko/20100101 Firefox/58.7',
    'Mozilla/5.0 (Windows NT 6.1; x64; en-US) AppleWebKit/602.23 (KHTML, like Gecko) Chrome/54.0.2174.376 Safari/535',
    // 'Mozilla/5.0 (Windows NT 10.3;; en-US) Gecko/20130401 Firefox/50.4',  // unsupported browser in YT
    'Mozilla/5.0 (Linux; Linux x86_64; en-US) AppleWebKit/602.11 (KHTML, like Gecko) Chrome/53.0.2051.306 Safari/535',
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 8_6_7; en-US) AppleWebKit/601.32 (KHTML, like Gecko) Chrome/49.0.1764.106 Safari/603',
    // 'Mozilla/5.0 (Linux x86_64) Gecko/20130401 Firefox/50.5', // unsupported browser in YT
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_9_9) AppleWebKit/600.6 (KHTML, like Gecko) Chrome/49.0.1606.152 Safari/603',
    'Mozilla/5.0 (Windows; U; Windows NT 10.5; WOW64) Gecko/20100101 Firefox/61.3',
    'Mozilla/5.0 (Linux x86_64) Gecko/20130401 Firefox/70.1',
]

const MOBILE_USER_AGENTS = [
    'Mozilla/5.0 (Linux; U; Android 5.0.1; HTC Butterfly S 919 Build/LRX22G) AppleWebKit/536.47 (KHTML, like Gecko)  Chrome/48.0.1922.128 Mobile Safari/536.9',
    'Mozilla/5.0 (Linux; Android 6.0; HTC One_M8 dual sim Build/MRA58K) AppleWebKit/536.40 (KHTML, like Gecko)  Chrome/53.0.1615.202 Mobile Safari/535.8',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0_3; like Mac OS X) AppleWebKit/534.20 (KHTML, like Gecko)  Chrome/47.0.2272.110 Mobile Safari/600.4',
    'Mozilla/5.0 (Linux; U; Android 6.0; Nexus 5 Build/MDB08L) AppleWebKit/600.35 (KHTML, like Gecko)  Chrome/48.0.3850.352 Mobile Safari/535.5',
    'Mozilla/5.0 (Android; Android 7.1; Xperia V Build/NDE63X) AppleWebKit/536.30 (KHTML, like Gecko)  Chrome/49.0.1898.119 Mobile Safari/533.8',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 11_6_1; like Mac OS X) AppleWebKit/601.15 (KHTML, like Gecko)  Chrome/55.0.3428.360 Mobile Safari/603.3',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 9_9_9; like Mac OS X) AppleWebKit/602.11 (KHTML, like Gecko)  Chrome/52.0.1101.253 Mobile Safari/533.2',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 8_9_3; like Mac OS X) AppleWebKit/602.45 (KHTML, like Gecko)  Chrome/55.0.3585.278 Mobile Safari/602.5',
    'Mozilla/5.0 (Android; Android 4.4.4; SM-G900W8 Build/KOT49H) AppleWebKit/602.1 (KHTML, like Gecko)  Chrome/48.0.3150.196 Mobile Safari/537.7',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 11_6_5; like Mac OS X) AppleWebKit/537.12 (KHTML, like Gecko)  Chrome/47.0.3097.348 Mobile Safari/601.6',
    'Mozilla/5.0 (Linux; Android 6.0.1; HTC One_M8 Build/MRA58K) AppleWebKit/602.28 (KHTML, like Gecko)  Chrome/48.0.1884.372 Mobile Safari/537.5',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1_3; like Mac OS X) AppleWebKit/535.46 (KHTML, like Gecko)  Chrome/55.0.1336.141 Mobile Safari/537.4',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 8_9_2; like Mac OS X) AppleWebKit/600.31 (KHTML, like Gecko)  Chrome/49.0.1466.158 Mobile Safari/537.9',
    'Mozilla/5.0 (Linux; Android 7.1; Nexus 5P Build/NPD90G) AppleWebKit/600.36 (KHTML, like Gecko)  Chrome/51.0.3355.233 Mobile Safari/535.9',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 7_9_0; like Mac OS X) AppleWebKit/602.17 (KHTML, like Gecko)  Chrome/54.0.3852.356 Mobile Safari/536.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 11_5_6; like Mac OS X) AppleWebKit/535.50 (KHTML, like Gecko)  Chrome/51.0.1905.374 Mobile Safari/535.9',
    'Mozilla/5.0 (Linux; U; Android 5.1.1; SAMSUNG SM-G920FG Build/LMY47X) AppleWebKit/603.3 (KHTML, like Gecko)  Chrome/52.0.2721.176 Mobile Safari/535.6',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 9_2_3; like Mac OS X) AppleWebKit/534.8 (KHTML, like Gecko)  Chrome/48.0.3418.131 Mobile Safari/602.5',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 10_5_0; like Mac OS X) AppleWebKit/536.37 (KHTML, like Gecko)  Chrome/47.0.2488.204 Mobile Safari/600.0',
    'Mozilla/5.0 (iPod; CPU iPod OS 8_7_4; like Mac OS X) AppleWebKit/534.16 (KHTML, like Gecko)  Chrome/52.0.3926.254 Mobile Safari/536.7',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 8_4_2; like Mac OS X) AppleWebKit/534.30 (KHTML, like Gecko)  Chrome/50.0.2021.261 Mobile Safari/537.9',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 9_7_9; like Mac OS X) AppleWebKit/600.16 (KHTML, like Gecko)  Chrome/55.0.1880.263 Mobile Safari/602.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 8_7_1; like Mac OS X) AppleWebKit/602.16 (KHTML, like Gecko)  Chrome/54.0.2787.352 Mobile Safari/601.5',
    'Mozilla/5.0 (iPod; CPU iPod OS 7_7_4; like Mac OS X) AppleWebKit/533.23 (KHTML, like Gecko)  Chrome/53.0.3182.373 Mobile Safari/602.6',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 7_6_8; like Mac OS X) AppleWebKit/534.23 (KHTML, like Gecko)  Chrome/47.0.2257.342 Mobile Safari/536.7',
    'Mozilla/5.0 (iPod; CPU iPod OS 7_6_0; like Mac OS X) AppleWebKit/603.26 (KHTML, like Gecko)  Chrome/52.0.2785.284 Mobile Safari/601.7',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 8_5_2; like Mac OS X) AppleWebKit/533.35 (KHTML, like Gecko)  Chrome/53.0.1690.229 Mobile Safari/534.7',
    'Mozilla/5.0 (Android; Android 5.1.1; Nexus 7 Build/LRX22C) AppleWebKit/602.47 (KHTML, like Gecko)  Chrome/48.0.3995.374 Mobile Safari/534.8',
]

const SUBSCRIBE_BUTTON_SELECTOR = "#modern .yt-spec-button-shape-next"
const YOUTUBE_COMMENT_AREA = "#placeholder-area"
const LIKE_BUTTON = "#segmented-like-button button"
const ZOOM_IN_SELECTOR = "button[id='widget-zoom-in']";
const ZOOM_OUT_SELECTOR = "button[id='widget-zoom-out']"



exports.getRandomUserAgent = function(type='desktop') {
    if (type === 'desktop') {
        return utils.random_item_from_list(DESKTOP_USER_AGENTS);
    } else {
        return utils.random_item_from_list(MOBILE_USER_AGENTS);
    }
}


exports.launchChrome = async function (headless=false) {
    return new Promise(async (resolve, reject) => {
        const chrome = await chromeLauncher.launch({
            port: 9222, // Uncomment to force a specific port of your choice.
            chromeFlags: [
              '--window-size=1920,1080',
              '--disable-gpu',
              '--incognito',
              headless ? '--headless' : ''
            ]
                // --proxy-server=${proxyUrl}
                // https://blog.apify.com/4-ways-to-authenticate-a-proxy-in-puppeteer-with-headless-chrome-in-2022/
          });
        resolve(chrome)
    });
};

exports.closeChromeWindow = async function (){
    // it doesn't work :(
    await chromeLauncher.killAll({port: 9222});
};

exports.getCurrentURLOfPage = async function (Page){
    let navigation_history_entries = (await Page.getNavigationHistory())['entries'];
    let last_navigation_history_entry = navigation_history_entries[navigation_history_entries.length-1];
    let active_url = last_navigation_history_entry.url;
    let  title_of_page = last_navigation_history_entry.title;
    console.log("current URL of Page:", active_url, "Title:", title_of_page);
    return new Promise((resolve, reject) => {
        resolve(active_url);
    })
};


exports.startChrome = async function(){
    console.log('[startChrome] Starting Chrome window...');
    return new Promise(async (resolve, reject) => {
        await exports.launchChrome();
        let client = await CDP({port: '9222'});
        let {Network, Page, Runtime, DOM} = client;
    
        // setup handlers
        // if interested in all of the different requests the client is making, check out "Group By" in here
        // https://medium.com/swlh/chrome-dev-tools-protocol-2d0ef2baf4bf
        // Network.requestWillBeSent((params) => {
        //     console.log(params.request.url);
        // });
    
        // Refactor
        Page.loadEventFired(async () => {
            let active_url = await exports.getCurrentURLOfPage(Page);
            let innerHTMLResult = await Runtime.evaluate({expression: innerHTMLSelector});
            url_page_html[active_url] = innerHTMLResult;
    
            checkIfHTMLContainsRecaptcha(innerHTMLResult.result.value);
            // console.log('innerHTMLResult Length:' + innerHTMLResult.result.value.length);
            // let pageTitleSelectorResult = await Runtime.evaluate({expression: pageTitleSelector});
            // console.log('Title of page: ' + pageTitleSelectorResult.result.value);
        });
    
        await Promise.all([Page.enable(), Runtime.enable()]);
        await Promise.all([Network.enable(), DOM.enable()]);
        resolve(client);
    });
};


exports.loginAsGoogleUser = async function (Page, username, password){
    await Page.navigate({url: 'https://accounts.google.com/servicelogin'});
    await Runtime.evaluate({expression: 'document.getElementById("identifierId").setAttribute("value", '+username+');'});
};

const pageLoadEventFiredHandler = async function(){
    let innerHTMLResult = await Runtime.evaluate({expression: innerHTMLSelector});
    url_page_html[url] = innerHTMLResult;
    // console.log('innerHTMLResult:', innerHTMLResult);
    checkIfHTMLContainsRecaptcha(innerHTMLResult.result.value);
    //console.log('innerHTMLResult Length:' + innerHTMLResult.result.value.length);
    let pageTitleSelectorResult = await Runtime.evaluate({expression: pageTitleSelector});
    //console.log('Title of page: ' + pageTitleSelectorResult.result.value);
};

//
// Page Loading Methods
//

exports.loadPageInNewTab = async function (url){
    console.log('loading URL in tab:', url);
    let tabMeta = await CDP.New();
    let client = await CDP({tab: tabMeta});
    let {DOM, Network, Page, Runtime, Console} = client;
      await Promise.all([
        DOM.enable(),
        Network.enable(),
        Page.enable(),
        Runtime.enable(),
        Console.enable()
      ]);

    // Refactor
    Page.loadEventFired(async () => {
        let innerHTMLResult = await Runtime.evaluate({expression: innerHTMLSelector});
        url_page_html[url] = innerHTMLResult;
        // console.log('innerHTMLResult:', innerHTMLResult);
        checkIfHTMLContainsRecaptcha(innerHTMLResult.result.value);
        // console.log('innerHTMLResult Length:' + innerHTMLResult.result.value.length);
        let pageTitleSelectorResult = await Runtime.evaluate({expression: pageTitleSelector});
        // console.log('Title of page: ' + pageTitleSelectorResult.result.value);
    });

    await Page.addScriptToEvaluateOnLoad({ scriptSource: "`Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5, 7, 8, 9]});`" });
    await Page.addScriptToEvaluateOnLoad({ scriptSource: "console.log('INJECTED SCRIPT')"});

    await Page.navigate({url: url});
    // await Page.loadEventFired();

    tab_idx++;
    tab_dict[tab_idx] = tabMeta;
    return tabMeta;
};

var url_page_html = {};

exports.validatePageUrl = async function(Page, url){
    let navigation_history_entries = (await Page.getNavigationHistory())['entries'];
    let last_navigation_history_entry = navigation_history_entries[navigation_history_entries.length-1];
    let active_url = last_navigation_history_entry.url;
    console.log('validating', active_url, 'contains', url);
    return active_url.includes(url);
};

exports.loadPageInTab = async function (url, client, referrer='https://facebook.com'){
    // let tab = grab_last_tab();
    //var client = await CDP({tab: tab});
    let {Page, Network, Runtime} = client;
    //await CDP.Activate({id: tab.id});
    console.log('loadPageInTab url:', url);
    await Page.navigate({url: url, referrer: referrer});
    console.log("Page.url:", Page.url, Page.displayedUrl);
    // await Page.loadEventFired(); // Note -- putting this line here will block execution
    return new Promise((resolve, reject) => {
        resolve(Page);
    });
};

exports.pressEnter = async function(Input, selector) {
    if (selector && selector.startsWith('textarea')) {
        await Input.dispatchKeyEvent({ type: 'keyDown', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' });
        await Input.dispatchKeyEvent({ type: 'keyUp', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, key: 'Enter', code: 'Enter' });
    }
    else {
        await Input.dispatchKeyEvent({ "type": "rawKeyDown", "windowsVirtualKeyCode": 13, "unmodifiedText": "\r", "text": "\r" })
        await Input.dispatchKeyEvent({ "type": "char", "windowsVirtualKeyCode": 13, "unmodifiedText": "\r", "text": "\r" })
        await Input.dispatchKeyEvent({ "type": "keyUp", "windowsVirtualKeyCode": 13, "unmodifiedText": "\r", "text": "\r" })
    }
    return
};


var tab_dict = {};
var tab_index_to_id = {};
var tab_idx = 0;
var index_of_oldest_tab = 0;
var tab_order = [];
var tab_order_idxes = [];

function grab_last_tab(){
    // console.log('current tab order:', tab_order_idxes);
    let tab_id = tab_order.shift();
    let tab_order_idx = tab_order_idxes.shift();
    tab_order.push(tab_id);
    tab_order_idxes.push(tab_order_idx);
    // console.log('new tab order:', tab_order_idxes);
    // console.log('returning tab idx', tab_order_idx);
    return tab_dict[tab_order_idx];
}

//
// Recaptcha Related Methods
//

const handleRecaptchaOnPage = async function (){
    // Check if RECAPTCHA is hit!
    while (is_recaptcha_hit){
        console.log('handleRecaptchaOnPage Hit! Sleeping for 2 second');
        await pollIfRecaptchaIsHit();
        await utils.sleep(2000);
    }
};

function RecaptchaEncountered (message, hasIPRotated) {
    this.hasIPRotated = hasIPRotated;
    this.message = message;
    this.name = 'RecaptchaEncountered';
};
RecaptchaEncountered.prototype = new Error();

const checkIfHTMLContainsRecaptcha = function (html) {
    if (html === null || html === undefined) {
        console.log('RECAPTCHA CHECK:', null);
    }
    let recaptchaToken = "Our systems have detected unusual traffic from your computer network";
    let recaptcha_check_result = html.includes(recaptchaToken);
    console.log('RECAPTCHA CHECK:', recaptcha_check_result);
    return recaptcha_check_result;
};

exports.RecaptchaEncountered = RecaptchaEncountered;
exports.checkIfHTMLContainsRecaptcha = checkIfHTMLContainsRecaptcha;

const pageTitleSelector = "document.querySelector('title').textContent";
const innerHTMLSelector = "document.documentElement.innerHTML";

exports.pollIfRecaptchaIsHit = async function (){
    const client =await CDP({port: '9222'})
    return new Promise( async (resolve, reject) => {
        let {Page, Network, Runtime} = client;
        let is_recaptcha_hit = true
        let recaptcha_check_result = is_recaptcha_hit

        while(is_recaptcha_hit) {
            let innerHTMLResult = await Runtime.evaluate({expression: innerHTMLSelector});
            let recaptcha_check_result = checkIfHTMLContainsRecaptcha(innerHTMLResult.result.value);
            is_recaptcha_hit = recaptcha_check_result;
            console.log('recaptcha_check_result:', recaptcha_check_result);
            console.log('is_recaptcha_hit:', is_recaptcha_hit);
            if (is_recaptcha_hit){
                let redis_client = await get_redis_client()
                let serps_count = await redis_client.get(captcha_appear_after_serps_count_key)
                let now = new Date()
                let key = captcha_appear_after_serps_count_key + `_${serps_count}_serps_at_${now.toLocaleString()}`
                await redis_client.set(key, 1)
                await redis_client.set(redis_serps_count_key, 0)
                await exports.ByPassCaptcha();
                global.actions.push(
                    {
                        "current_ip": await getProxyIpAddress(),
                        "current_url": await exports.getCurrentURLOfPage(Page),
                        "code": "recaptcha",
                        "is_recaptcha_hit": is_recaptcha_hit,
                        "message": "Recaptcha hit."
                    }
                );
            }
            console.log('innerHTMLResult Length:' + innerHTMLResult.result.value.length);
            let pageTitleSelectorResult = await Runtime.evaluate({expression: pageTitleSelector});
            console.log('Title of page: ' + pageTitleSelectorResult.result.value);
        }
        client.close();
        resolve(recaptcha_check_result);
        });
};

exports.nodeAppears = async function(client, selector) {
    // browser code to register and parse mutations
    const browserCode = (selector) => {
        return new Promise((fulfill, reject) => {
            new MutationObserver((mutations, observer) => {
                // add all the new nodes
                const nodes = [];
                mutations.forEach((mutation) => {
                    nodes.push(...mutation.addedNodes);
                });
                // fulfills if at least one node matches the selector
                if (nodes.find((node) => node instanceof Element && node.matches(selector))) {
                    observer.disconnect();
                    fulfill();
                }
            }).observe(document.body, {
                childList: true
            });
        });
    };
    // inject the browser code
    const {Runtime} = client;
    await Runtime.evaluate({
        expression: `(${browserCode})(${JSON.stringify(selector)})`,
        awaitPromise: true
    });
};


async function getCoords(css_selector) {
  return new Promise(async (resolve, reject) => {
    let client;
    try {
        // connect to endpoint
        client = await CDP();
        // extract domains
        const { Page, Runtime, DOM } = client;
        // enable events then start!
        await Promise.all([Runtime.enable()]);

        let result = null;
        let clientRectCmd = `var targetCoordEl = document.querySelector('${css_selector}'); if (targetCoordEl) { JSON.stringify(targetCoordEl.getClientRects()); }`;

        result = await Runtime.evaluate({expression: clientRectCmd,});

        // get offset screen positioning
        const screenPos = await Runtime.evaluate({
        expression: "JSON.stringify({offsetY: window.scrollY, offsetX: window.scrollX})"
        });

        let offset = JSON.parse(screenPos.result.value);
        let clientRect = null;

        try {
        clientRect = JSON.parse(result.result.value)["0"];
        } catch(err) {
            resolve();
        }

        let retVal =  {
        x: offset.offsetX + clientRect.left,
        y: offset.offsetY + clientRect.top,
        width: clientRect.width,
        height: clientRect.height,
        };
        console.log('coords:', JSON.stringify(retVal));
        if (client) {
            await client.close();
        }
        resolve(retVal)
    } catch (err) {
        console.error(err);
        resolve()
    }
  })
}
exports.getCoords = getCoords;

exports.getCoordsofEl = async function (css_selector, idx = 0) {
    let client;
    try {
        // connect to endpoint
        client = await CDP();
        // extract domains
        const {Runtime} = client;
        // enable events then start!
        await Runtime.enable();
    
        let result = null;
        let clientRectCmd = `var targetCoordEl = document.querySelectorAll("${css_selector}")[${idx}]; if (targetCoordEl) { JSON.stringify(targetCoordEl.getBoundingClientRect()); }`;
        result = await Runtime.evaluate({expression: clientRectCmd,});
        // console.log(clientRectCmd);
        // console.log(result);

        let clientRect = null;
        // console.log(result);
        try {
            clientRect = JSON.parse(result.result.value);
        } catch(err) {
            console.log(err);
            return null;
        }
        let retVal = {
            top: clientRect.top,
            bottom: clientRect.bottom,
            right: clientRect.right,
            left: clientRect.left,
            width: clientRect.width,
            height: clientRect.height,
        };
        return retVal;
    } catch (err) {
        console.error(err);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

// will be removed once confirmed we dont need actual clicks
async function getDocCoords(css_selector, idx=0) {
  let client;
    try {
        // connect to endpoint
        client = await CDP();
        // extract domains
        const {Runtime} = client;
        // enable events then start!
        await Runtime.enable();

        let result = null;
        let clientRectCmd = `var targetCoordEl = doc.querySelectorAll("${css_selector}")[${idx}]; if (targetCoordEl) { JSON.stringify(targetCoordEl.getBoundingClientRect()); }`;
        result = await Runtime.evaluate({expression: clientRectCmd,});
        // console.log(clientRectCmd);
        // console.log(result);

        let clientRect = null;
        // console.log(result);
        try {
            clientRect = JSON.parse(result.result.value);
        } catch(err) {
            console.log(err);
            return null;
        }
        let retVal = {
            top: clientRect.top,
            bottom: clientRect.bottom,
            right: clientRect.right,
            left: clientRect.left,
            width: clientRect.width,
            height: clientRect.height,
        };
        return retVal;
    } catch (err) {
        console.error(err);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

exports.getDocCoords = getDocCoords;

exports.elementExists = async function(css_selector) {
    let client;
    try {
        // connect to endpoint
        client = await CDP();
        // extract domains
        const {Runtime} = client;
        // enable events then start!
        await Runtime.enable();

        let result = null;
        let cmd = `var targetCoordEl = document.querySelector("${css_selector}"); if (targetCoordEl) { 1 } else { 0 };`;
        result = await Runtime.evaluate({expression: cmd,});

        let res = null;
        try {
            res = result.result.value;
        } catch(err) {
            console.log(err);
        }
        if (res) {
            console.log(`Element ${css_selector} exists!`);
            return true;
        }
        console.log(`Element ${css_selector} doesn't exist!`);
        return false;
    } catch (err) {
        console.error(err);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

exports.isVideoLoaded = async function(css_selector) {
    let client;
    try {
        // connect to endpoint
        client = await CDP();
        // extract domains
        const {Runtime} = client;
        // enable events then start!
        await Runtime.enable();

        let result = null;
        let cmd = `var video = document.querySelector("${css_selector}"); if (video.readyState === 4) { 1 } else { 0 };`;
        result = await Runtime.evaluate({expression: cmd,});

        let res = null;
        try {
            res = result.result.value;
        } catch(err) {
            console.log(err);
        }
        if (res) {
            console.log(`Video ${css_selector} loaded!`);
            return true;
        }
        console.log(`Video ${css_selector} didn't load yet!`);
        return false;
    } catch (err) {
        console.error(err);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

exports.getRecaptchaCoords = async function (){
    let result = await getCoords("#recaptcha");
    // console.log(result);
    return result;
}


const clickSomeActionThenSubmitForm = function (Runtime) {
    const clickSomeAction = 'document.querySelector(\'a[href="#someAction"]\').click()';
    const setSomeInfo = 'document.querySelector("input#someinfo").value = "info"';
    const submit = 'document.querySelector(\'form[action*="/smilesAndJoy"] button\').click()';

    return Runtime
        .evaluate({ expression: clickSomeAction })
        .then(() => { return new Promise(resolve => { clickSomeActionThenSubmitForm = resolve; }) })
        .then(() => { return Runtime.evaluate({expression: setSomeInfo })})
        .then(() => { return Runtime.evaluate({expression: submit })})
        .then(() => { return new Promise(resolve => { clickSomeActionThenSubmitForm = resolve; }) });
};
//Page.loadEventFired(() => { pageLoad(Runtime) });

exports.clickAtPosition = async function (client, x, y, button='left') {
    console.log('Clicking at position x:', x, 'y:', y);

    CDP((client) => {
        const options = {
            x: x,
            y: y,
            button: button,
            clickCount: 1
        };
        Promise.resolve().then(() => {
            options.type = 'mousePressed';
            return client.Input.dispatchMouseEvent(options);
        }).then(() => {
            options.type = 'mouseReleased';
            return client.Input.dispatchMouseEvent(options);
        }).catch((err) => {
            console.error(err);
        }).then(() => {
            client.close();
        });
    }).on('error', (err) => {
        console.error(err);
    });
}

exports.moveMouseTo = async function (client, x, y) {
    console.log('Moving mouse to position x:', x, 'y:', y);

    CDP((client) => {
        const options = {
            x: x,
            y: y,
        };
        Promise.resolve().then(() => {
            options.type = 'mouseMoved';
            return client.Input.dispatchMouseEvent(options);
        }).catch((err) => {
            console.error(err);
        }).then(() => {
            client.close();
        });
    }).on('error', (err) => {
        console.error(err);
    });
}

exports.scrollMouseBy = async function (client, x, y, deltaX, deltaY) {
    console.log('Scrolling mouse to position x:', x, 'y:', y, 'deltaX:', deltaX, 'deltaY:', deltaY);

    CDP((client) => {
        const options = {
            x: x,
            y: y,
            type: 'mouseWheel',
            deltaX: deltaX,
            deltaY: deltaY
        };
        Promise.resolve().then(() => {
            return client.Input.dispatchMouseEvent(options);
        }).catch((err) => {
            console.error(err);
        }).then(() => {
            client.close();
        });
    }).on('error', (err) => {
        console.error(err);
    });
}

exports.scrollBy = async function(Runtime, distance){
    await Runtime.evaluate({
        expression: `window.scrollBy(0, `+distance+`)`
    });
};

exports.scrollRandomly = async function(Runtime, duration) {
  console.log(`Going to randomly scroll for the next ${duration} seconds...`)
  const startTime = Date.now();
  const endTime = startTime + duration * 1000; // Convert duration to milliseconds

  while (Date.now() < endTime) {
    const distance = Math.floor(Math.random() * 501); // Generate random distance between 0 and 500 pixels
    console.log(`Scrolling for ${distance} pixels...`)
    await exports.scrollBy(Runtime, distance);

    const delay = Math.floor(Math.random() * 2001) + 500; // Generate random delay between 500ms and 2500ms
    console.log(`Sleeping for ${delay} ms...`)
    await new Promise(resolve => setTimeout(resolve, delay));
  }
};

exports.scrollIntoView = async function (Runtime, selector, element_number){
    console.log(`Scrolling to selector ${selector} ele_number: ${element_number}...`)
    await Runtime.evaluate({
        expression: `
          document.querySelectorAll('`+selector+`')[`+element_number+`]
        .scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' });
        `
    });

    // scroll a little more
    exports.scrollBy(Runtime, 100);
};

exports.scrollToBottom = async function (Runtime) {
  console.log("Scrolling to the bottom...");
  await Runtime.evaluate({
    expression: `
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    `
  });
};


exports.pressBackButton = async function(client){

    CDP((client) => {
        const options = {
            x:0,
            y:0,
            button: 'back',
            clickCount: 1
        };
        Promise.resolve().then(() => {
            options.type = 'mousePressed';
            return client.Input.dispatchMouseEvent(options);
        }).then(() => {
            options.type = 'mouseReleased';
            return client.Input.dispatchMouseEvent(options);
        }).catch((err) => {
            console.error(err);
        }).then(() => {
            client.close();
        });
    }).on('error', (err) => {
        console.error(err);
    });
};

exports.saveScreenshot = async function(Page, filename){
    const data = await Page.captureScreenshot({captureBeyondViewport: true, format: 'jpeg', quality: 10});
    console.log(`Saving screenshot... at ${filename}`);
    // fs.writeFileSync(filename, Buffer.from(data, 'base64'));
    return new Promise((resolve, reject) => {
        resolve(data);
    })
};


exports.saveScreenshotLowWidth = async function(Page, filename){
    const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve(null); // Resolves with null to indicate a timeout
        }, 10000);
      });
    const data = await Promise.race([Page.captureScreenshot(), timeoutPromise]);
    console.log(`Saving screenshot... at ${filename}`);
    // fs.writeFileSync(filename, Buffer.from(data, 'base64'));
    return new Promise((resolve, reject) => {
        resolve(data);
    })
};

exports.closeInitialWarningWindow = async function(client){
    var {Network, Page, Runtime, Input, DOM} = client;
    console.log('issuing keyword command to close warning tab');
    let x = 1260;
    let click='left';
    exports.clickAtPosition(client, x, -20, click);
    // exports.clickAtPosition(client, x, 85, click);
    // exports.clickAtPosition(client, x, 75, click);
    // exports.clickAtPosition(client, x, 65, click);
    // exports.clickAtPosition(client, x, 55, click);
    // exports.clickAtPosition(client, x, 45, click);
    // exports.clickAtPosition(client, x, 35, click);


    // await Input.dispatchKeyEvent({ "type": "rawKeyDown", "windowsVirtualKeyCode": 9, "unmodifiedText": "\t", "text": "\t" })
    // await Input.dispatchKeyEvent({ "type": "char", "windowsVirtualKeyCode": 9, "unmodifiedText": "\t", "text": "\t" })
    // await Input.dispatchKeyEvent({ "type": "keyUp", "windowsVirtualKeyCode": 9, "unmodifiedText": "\t", "text": "\t" })
    //
    // await R.delay(200);
    // await Input.dispatchKeyEvent({"type": "rawKeyDown", WindowsVirtualKeyCode: 9, NativeVirtualKeyCode: 9},);
    // await R.delay(200);
    // await Input.dispatchKeyEvent({"type": "rawKeyDown", WindowsVirtualKeyCode: 13, NativeVirtualKeyCode: 13},);
    // await R.delay(20000);

    await Input.dispatchKeyEvent({ type: 'char', text: 'a' });
    await Input.dispatchKeyEvent({ type: 'char', text: 'z' });
    await Input.dispatchKeyEvent({ type: 'char', text: 'u' });
    await Input.dispatchKeyEvent({ type: 'char', text: 'l' });
    // await R.delay(200);
    // await Input.dispatchKeyEvent({"type": "rawKeyDown", WindowsVirtualKeyCode: 9, NativeVirtualKeyCode: 9},);
    // await R.delay(200);
    // await Input.dispatchKeyEvent({ type: 'char', text: 'cielo'});
    // await R.delay(200);
    // await Input.dispatchKeyEvent({ "type": "rawKeyDown", WindowsVirtualKeyCode: 13, NativeVirtualKeyCode: 13},);

}

exports.ByPassCaptcha = async function (){

    let client = await CDP({port: '9222'});
    let {Network, Page, Runtime, Input, DOM} = client;
    let captcha_url =  await exports.getCurrentURLOfPage(Page)

    var site_key = await Runtime.evaluate({expression: "document.querySelector('#recaptcha').getAttribute('data-sitekey');"});
    let data_s = await Runtime.evaluate({expression: "document.querySelector('#recaptcha').getAttribute('data-s');"});
    var img_file = await Runtime.evaluate({expression: "document.getElementsByTagName('image')[0].src;"});
    var screenshot;
    var name;
    // this means the captcha is text image captcha
    if(img_file.result.value){
        coords = await getCoords('img');
        screenshot = await capture_captcha_screenshot(Page, coords);
    }
   else
   {
        // launch captcha iframe by clicking on i am not robot checkbox
        let coords = await exports.getRecaptchaCoords();
        exports.clickAtPosition(client, x=coords.x, y=coords.y);

        // wait for captcha image to load
        await utils.sleep(3000);
        var should_click_skip = true
        // this means captcha inst resolvable by 2captcha so we need to skip the images till they appear to be resolvable
        while(should_click_skip) {

            let iframe_docs = `let doc = document.getElementsByTagName('iframe')[2].contentWindow.document; doc.getElementById('rc-imageselect').focus()`
            let result = await Runtime.evaluate({expression: iframe_docs})
            var is_skip = await Runtime.evaluate({expression: "doc.getElementById('recaptcha-verify-button').innerHTML;"})
            console.log("skip button title", is_skip)
            if (is_skip.result.value == 'Skip'){
                await Runtime.evaluate({expression: "doc.getElementById('recaptcha-verify-button').click();"})
                await utils.sleep(3000);
            } else { should_click_skip = false}
        }

        // get the iframe in which captcha is handled
        let iframe = `document.getElementsByTagName('iframe')[2].name`
        let iframe_name = await Runtime.evaluate({expression: iframe})

        name = iframe_name.result.value;
        console.log("captcha iframe_name value !", name);

        // get coords for a captcha image
        var captcha_coords = await getCoords(`iframe[name=${name}]`);
        console.log('Captcha Coords!', captcha_coords)
    }

    if (name || screenshot) {
    let should_not_retry = false;
    let is_resolved;
    await Runtime.evaluate({expression: 'let docu;'})
    while(!should_not_retry) {

        screenshot = await capture_captcha_screenshot(Page, captcha_coords)

        // send try to resolve captcha by getting solution from 2captcha
        is_resolved = await resolve_captcha(screenshot, client, site_key, img_file, data_s);
        if (is_resolved) {
            should_not_retry = is_resolved;
        }
    }

    // return the promise
    return new Promise((resolve, reject) => {
           resolve(should_not_retry);
    });
}
   else {
    return new Promise((resolve, reject) => {
           resolve(true);
    });
   }
};


// API calls for deathByCaptcha
async function post_captcha(siteKey=null, pageUrl=null, data_s=null, img_file=null, recaptcha_new = true) {

    var formData = null
    if (siteKey){
       formData = {
        username: deathByCaptchaUsername,
        password: deathByCaptchaPassword,
        type: '5',
        token_params: JSON.stringify({
          googlekey: siteKey,
          pageurl: pageUrl,
          "data-s": data_s,
          "action": 'verify',
          "min_score": 0.3
        })
      };
  }
  else {
      const image_file = await read_base64_image();
      formData = {
        username: deathByCaptchaUsername,
        password: deathByCaptchaPassword,
        captchafile: "base64:" + image_file
      };
  }
  console.log("Form Data: ", formData)

  return new Promise((resolve, reject) => {
    request.post({url: deathByCaptchaUrl, form: formData }, function(err, httpResponse, body) {
    if (err) {
      console.error('Error solving captcha:', err);
      return;
    }
    console.log("Captcha Body:", body)
    let captcha_id = body.split("=")[1].split("&")[0]
    resolve(captcha_id)
    });
  });

}

// get captcha task results from deathByCaptcha
async function get_captcha_solution(captcha_id){
    var options = {
      'method': 'GET',
      'url': `http://api.dbcapi.me/api/captcha/${captcha_id}`,
      'headers': {
        'Cookie': 'BACKEND=B|ZECIV|ZECAS'
      }
    };
    await utils.sleep(1000);
    return new Promise((resolve, reject) => {
        request(options, function (error, response) {
          if (error) throw new Error(error);
          console.log("Get Body Response", response.body )
          resolve(response.body.split('=')[2].split('&')[0])
        });
    });

}

exports.run_shell_command = function run_shell_command(command){
    const result = execSync(command);
    // convert and show the output.
    console.log(result.toString("utf8"));
}

async function get_current_ip(){
    return new Promise(async (resolve, reject) => {
        let client = await CDP();
        let {Network, Page, Runtime, DOM} = client;
        await Page.navigate({url: 'https://www.whatsmyip.org/'});
        await utils.sleep(2000);
        let ip = await Runtime.evaluate({expression:"document.getElementById('ip').innerText"});
        console.log("IP:", ip.result.value)
        resolve(ip.result.value)
    });
}

exports.get_current_ip = get_current_ip

async function getProxyIpAddress() {
    return new Promise(async (resolve, reject) => {
        const targetUrl = 'http://ipv4.icanhazip.com/';
        let proxyUrl = global.proxyUrl;
        const proxy = url.parse(proxyUrl);
        axios.get(targetUrl, {
            proxy: {
                host: proxy.hostname,
                port: proxy.port,
                auth: proxy.auth,
                protocol: proxy.protocol
            },
        })
        .then((response) => {
            console.log(response.data);
            resolve(response.data);
        })
        .catch((error) => {
            console.error(error.message);
            resolve(null)
        });
    });
}


// Export the method for usage in other files
exports.getProxyIpAddress = getProxyIpAddress;


exports.getProxyIpInfo = async function (ip) {
    return new Promise(async (resolve, reject) => {
        const targetUrl = `https://ipinfo.io/${ip}/json`;
        const response = await fetch(targetUrl,  {method: 'get'});
        let data = JSON.parse(await response.text())
        let locations = data.loc.split(',')
        data['lat'] = locations[0]
        data['long'] = locations[1]
        console.log(data);
        resolve(data);
    });
}

// convert image to base64
async function read_base64_image(){
       return new Promise((resolve, reject) => {
           fs.readFile(imagePath, (error, data) => {
            if (error) {
                console.error(`Error reading image: ${error.message}`);
                resolve(null);
            }
      // Convert the image data to a base64-encoded string
      const base64Image = Buffer.from(data).toString('base64');
      console.log("Read the base 64 data!", data)
      resolve(base64Image);
    });
  });
}


// 2Captcha API implementation
async function post_captcha_with_2captcha(image_file) {
   const formData = {
    key: api_key,
    method: 'base64',
    body: image_file
  };

  console.log("Form Data: ", formData)

  return new Promise((resolve, reject) => {
    request.post({url: twoCaptchaUrl, form: formData }, function(err, httpResponse, body) {
    if (err) {
      console.error('Error solving captcha:', err);
      return;
    }
    console.log("Captcha Body:", body)
    let captcha_id = body.split("|")[1]
    resolve(captcha_id);
    });
  });
}


async function get_2captcha_solution(captcha_id){
    const url = `http://2captcha.com/res.php?key=${api_key}&action=get&id=${captcha_id}`;
    console.log("variable options !", url)
    await utils.sleep(1000);
    return new Promise((resolve, reject) => {
        request.get(url, function (error, httpResponse, body) {
          if (error) throw new Error(error);
          console.log("Get Body Response", body)
          resolve(body.split('|')[1])
        });
    });
}

async function capture_captcha_screenshot(Page, captcha_coords){
    var screenshot =  await Page.captureScreenshot({
        format: 'jpeg',
        quality: 20,
        clip: {
            x: captcha_coords.x,
            y: captcha_coords.y,
            width: captcha_coords.width,
            height: captcha_coords.height,
            scale: 1.0
        }
    });
    console.log("captcha image screen shot",screenshot.data)
    fs.writeFileSync(imagePath, screenshot.data);
    return screenshot.data

}

// resolve captcha and return True if resolved otherwise return false
async function resolve_captcha(screenshot, client, site_key=null, image_file=null, data_s=null){
    let {Network, Page, Runtime, Input, DOM} = client;
    return new Promise((resolve, reject) => {

        let solution;
        post_captcha_with_2captcha(screenshot).then(async (captcha_id) => {
            console.log("got id:", captcha_id)
            while(!solution) {
                solution =   await get_2captcha_solution(captcha_id)
                if (solution == 'ERROR_CAPTCHA_UNSOLVABLE' || solution == 'ERROR_WRONG_CAPTCHA_ID') {

                    Runtime.evaluate({expression: 'location.reload();'})
                    resolve(false);
                }
                if (solution){
                solution = solution.replace(' ', '')
                solution = format_number(solution);
                }
                console.log("re-polling for captcha response")
                if (site_key.result.value && solution) {
                    console.log('submitting the solution: ' + solution);
                    let iframe_docs = `docu = document.getElementsByTagName('iframe')[2].contentWindow.document; docu.getElementById('rc-imageselect').focus()`
                    let result = await Runtime.evaluate({expression: iframe_docs})
                    console.log("solution is", result);

                    for(let sol of solution) {
                       sol = String(Number(sol) + 3);
                       console.log("Clicking at position", sol);
                       await Runtime.evaluate({expression: `docu.querySelector('td[tabindex="${sol}"]').click();`})
                       await utils.sleep(2000);
                }
                await Runtime.evaluate({expression: "docu.getElementById('recaptcha-verify-button').click();"})
                await utils.sleep(2000);
                await Runtime.evaluate({expression: `docu = document.getElementsByTagName('iframe')[2].contentWindow.document; doc.getElementById('rc-imageselect').focus()`})
                let verify_result = await Runtime.evaluate({expression: `docu.getElementsByClassName('rc-imageselect-error-select-more')[0].getAttribute('tabindex');`});
                let more_click_suggestion = await Runtime.evaluate({expression: `docu.getElementsByClassName('rc-imageselect-error-dynamic-more')[0].getAttribute('tabindex');`});
                let select_something = await Runtime.evaluate({expression: `docu.getElementsByClassName('rc-imageselect-error-select-something')[0].getAttribute('tabindex');`});
                console.log("Verify Result:", verify_result);
                if (verify_result.result.value == '0' || more_click_suggestion.result.value =='0'|| select_something.result.value == '0' ) {
                    console.log("Captcha not resolve !");
                    resolve(false);
               } else {
                    await Runtime.evaluate({expression: `docu = document.getElementsByTagName('iframe')[2].contentWindow.document; doc.getElementById('rc-imageselect').focus()`});
                    is_captcha = await Runtime.evaluate({expression: "docu.getElementById('recaptcha-verify-button').innerHTML;"});
                    if (is_captcha.result.value){
                        resolve(false);
                    }

                   resolve(true);
               }
          }
          else if(solution && img_file)
          {
              console.log('Image captcha solution!', solution)
              let searchbox = await exports.getCoordsofEl(SEARCHBOX_SELECTOR);
              await utils.sleep(1000);
              await exports.clickAtPosition(client, searchbox.left + 2, searchbox.top + 2, 'left');
              await utils.sleep(1000);
              for (let letter of String(solution)) {
                console.log('Typing letter!', letter)
                await Input.dispatchKeyEvent({ type: 'char', text: letter });
                await R.delay(200);
              }
            let coords = await getCoords('input[name=btn-submit]');
            await utils.sleep(2000);
            exports.clickAtPosition(client, x=coords.x, y=coords.y);
            await utils.sleep(2000);
            resolve(true);
          }
        }
      });
    });
}

function format_number(num){
    num = num.split('');
    let i =0;
    let is_join = 0;
    let format_numb = [];
    while(i<num.length)
    {   let n;
        n = num[i]
        if (num[i]>num[i+1]){
            is_join = 1;
            i++;
            format_numb.push(n)
    }
        if (is_join){
            n = num[i]+num[i+1];
            i++;
        }
    format_numb.push(n)
    i++;
    }
    return format_numb
}


function getRandomEmail() {
  var emails = ['mar916362@gmail.com', 'lambertbart0071@gmail.com']
  const randomIndex = Math.floor(Math.random() * emails.length);
  return emails[randomIndex];
}


exports.performLogin = async function performLogin(url = 'https://accounts.google.com/'){
    var email = getRandomEmail()
    var password = 'AdmI1@#m!'
    var should_check_password_input = true
    return new Promise(async (resolve, reject) => {
    const client = await CDP({port: '9222'} );
    let {Input, Runtime, Network} = client;
    await Runtime.enable()
    await exports.loadPageInTab(url, client);
    // this google event page has no load event so we have to wait here
    // explicitly, as we cannot wait with await tabobj.loadEventFired(); as it goes forever
    await utils.sleep(9000)

    for (let letter of String(email)) {
        await Input.dispatchKeyEvent({ type: 'char', text: letter });
        await R.delay(200);
    }
    await exports.pressEnter(Input);
    await utils.sleep(9000)
    for (let letter of String(password)) {
        await Input.dispatchKeyEvent({ type: 'char', text: letter });
        await R.delay(200);
    }
    await exports.pressEnter(Input);
    await utils.sleep(6000);
    resolve();
});
}

exports.cycleIp = async function() {
    url = 'https://dashboard.iproyal.com/api/4g-mobile-proxies/rotate-ip/jgRA81sSKc';
    return new Promise((resolve, reject) => {
        request.get(url, function (error, httpResponse, body) {
          if (error) throw new Error(error);
          var res = JSON.parse(body)
          if (res.status == 'error') {
            var st = res.message;
            var splited_list = st.split(' ')
            var m = parseFloat(splited_list[splited_list.length - 2].replace('m', '')) * 60
            var s = parseFloat(splited_list[splited_list.length - 1].replace('s', ''))
            var total_wait = m + s
            console.log(`IP will be cycled in ${total_wait} seconds..`)
            resolve(total_wait * 1000)
          }
          resolve(false)
        });
    });
};

exports.waitTillIpIsRotated = async function waitTillIpIsRotated(){

    return new Promise(async (resolve, reject) => {
        let ip_rotation_wait_time;
        let should_wait_to_rotate_again = true;
        while(should_wait_to_rotate_again) {
            ip_rotation_wait_time = await exports.cycleIp();
            if (ip_rotation_wait_time) {
                console.log(`Waiting for ${ip_rotation_wait_time / 1000} seconds before retrying IP recycle.`)
                await utils.sleep(ip_rotation_wait_time)
            }
            else {
                should_wait_to_rotate_again = false
            }
        }
        resolve()
    });
}



exports.loadPageWithInNewTab = async function loadPageWithInNewTab(url, client){
    return new Promise(async (resolve, reject) => {
        const {Target} = client;
        await Target.createTarget({ url: url, incognito: true });
        resolve()
    });
}

exports.closeChromeWindows = async function closeChromeWindows(client) {
    const timeout = 5000;
    // Get the list of targets (windows)
    try {
        await client.Network.ping()
    } catch(error) {
        client = await CDP({port: '9222'} );
    }
    const { targetInfos } = await client.Target.getTargets();
    const filteredTargetInfos = targetInfos.filter((targetInfo) => targetInfo.type == 'page' && targetInfo.attached == true);
    await client.Target.createTarget({ url: 'about:blank'});


    // activate any other tab rather than the newly opened one.
    // await client.Target.activateTarget({targetId: filteredTargetInfos[0].targetId})
    // await utils.sleep(1000)

    // Close each window
    for (const targetInfo of filteredTargetInfos) {
        let closeTargetPromise = client.Target.closeTarget({ targetId: targetInfo.targetId });

        let timeoutPromise = new Promise((resolve) => {
            setTimeout(() => resolve('timeout'), timeout);
        });

        // Wait for either the closeTargetPromise to resolve or the timeoutPromise to resolve
        const result = await Promise.race([closeTargetPromise, timeoutPromise]);

        if (result === 'timeout') {
            // Handle the timeout situation
            console.log('Closing the target forcefully due to timeout');
            await client.Page.close();
        }
    }
    return new Promise(async (resolve, reject) => {
        await client.close();
        resolve()
    });
}

exports.convertToInteger = function convertToInteger(numberString) {
  const multipliers = {
    'k': 1000,
    'm': 1000000,
    'b': 1000000000,
  };

  const sanitizedString = numberString.replace(/[,.]/g, '');
  const multiplierChar = sanitizedString.charAt(sanitizedString.length - 1);
  const multiplier = multipliers[multiplierChar] || 1;

  return parseInt(sanitizedString) * multiplier;
}


// Use this method when user sign in
exports.likeVideo = async function(){
    const client = await CDP({port: '9222'} );
    let {Input, Runtime, Network} = client;
    await Runtime.enable()
    return new Promise(async (resolve, reject) => {
    while (!await exports.elementExists(LIKE_BUTTON)){
        await utils.sleep(1000);
    }
    await Runtime.evaluate({expression: `document.querySelector('${LIKE_BUTTON}').click()`});
    resolve()
  });
}


exports.randomNumber = function(min=1, max=50) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.addCommentOnProvidedYouTubeVideo = async function(comment, url){

        return new Promise(async (resolve, reject) => {
        const client = await CDP({port: '9222'});
        let {Input, Runtime, Network, Page} = client;
        await Promise.all([Page.enable(), Runtime.enable()]);
        await exports.performLogin()
        await utils.sleep(2000);
        await exports.loadPageInTab(url, client);
        await Page.loadEventFired()
        while (!await exports.elementExists(YOUTUBE_COMMENT_AREA)){
                await utils.sleep(1000);
            }
        await utils.sleep(3000);
        let is_user_signin = await Runtime.evaluate({expression: `Boolean(document.querySelector("#avatar-btn")) || Boolean(document.querySelector("#avatar-btn img"))`})
        if (is_user_signin.result.value){
            console.log("Adding comment on video !")
            await Runtime.evaluate({expression: `document.querySelector('${YOUTUBE_COMMENT_AREA}').click()`});
            await utils.sleep(2000);
            await Runtime.evaluate({expression: `document.getElementById("contenteditable-root").innerText = "${comment}";`})
            await Runtime.evaluate({expression: `document.getElementById('submit-button').click();`})
            resolve();
        }
        });
}

exports.subscribeOnProvidedYouTubeVideo = async function(url){

        return new Promise(async (resolve, reject) => {
        const client = await CDP({port: '9222'});
        let {Input, Runtime, Network, Page} = client;
        await Promise.all([Page.enable(), Runtime.enable()]);
        await exports.performLogin()
        await utils.sleep(2000);
        await exports.loadPageInTab(url, client);
        await Page.loadEventFired()
        while (!await exports.elementExists(SUBSCRIBE_BUTTON_SELECTOR)){
                await utils.sleep(1000);
        }
        await utils.sleep(2000);
        let is_user_signin = await Runtime.evaluate({expression: `Boolean(document.querySelector("#avatar-btn")) || Boolean(document.querySelector("#avatar-btn img"))`});
        let is_not_already_subscribe = await Runtime.evaluate({expression: `document.getElementById('notification-preference-toggle-button').hidden;`})
        if (is_user_signin.result.value && is_not_already_subscribe.result.value){

            console.log("Subscribing a video!")
            await Runtime.evaluate({expression: `document.querySelector('${SUBSCRIBE_BUTTON_SELECTOR}').click()`});
            await utils.sleep(2000);
            resolve();
        }
        });
}

exports.closeTab = async function(tabId) {
    const timeout = 2000;
    const client = await CDP({port: '9222'});
    let {Target, Page} = client;
    await Promise.all([Page.enable()]);

    // close a single tab
    let closeTargetPromise = client.Target.closeTarget({ targetId: tabId });

    let timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve('timeout'), timeout);
    });

    // Wait for either the closeTargetPromise to resolve or the timeoutPromise to resolve
    const result = await Promise.race([closeTargetPromise, timeoutPromise]);

    if (result === 'timeout') {
        // Handle the timeout situation
        console.log('Closing the target forcefully due to timeout');
        await client.Page.close();
    }

    return new Promise(async (resolve, reject) => {
        resolve()
    });
}

exports.enterTextIntoField = async (client, selector, text, pressEnter = true, mask = false) => {
    // Scroll to the input field and activate it.
    await utils.sleep(1500);
    await exports.clickOnEl(client, selector);
    await utils.sleep(1500);

    // Reset input field value to an empty string.
     await client.Input.dispatchKeyEvent({type : "char", key: "A", commands: ['selectAll']});
     await utils.sleep(500);

    // Start typing new value.
    console.log(`Typing in '${mask ? 'xxxx' : text}' into the element '${selector}'.`);
    while (true) {
        for (let letter of String(text)) {
            await utils.sleep(100);
            await client.Input.dispatchKeyEvent({ type: 'char', text: letter });
            await utils.sleep(100);
        }

        const input = await client.Runtime.evaluate({
            expression: `document.querySelector("${selector}").value`
        });
        if (text !== input.result.value) {
            console.log(`Incorrect value: '${mask ? 'xxxx' : input.result.value}', resetting..`);
            await utils.sleep(500);

            // reset input field
            await exports.clickOnEl(client, selector);
            await utils.sleep(500);
            await client.Input.dispatchKeyEvent({type : "char", key: "A", commands: ['selectAll']});
            await utils.sleep(500);
        } else {
            // typed successfully.
            break;
        }
        console.log(`Typing in '${mask ? 'xxxx' : text}' into the element '${selector}' again.`);
    }

    if (pressEnter) {
        await utils.sleep(2000);
        await exports.pressEnter(client.Input, selector);
    }
};

exports.waitUntilElExists = async (client, selector, maxRetries = -1) => {
    let currentTry = 0;
    const maxTryBeforeReload = 10
    let {Page} = client;
    await Page.enable()
    while (maxRetries === -1 ? true : currentTry < maxRetries) {
        const elementLoaded = await exports.elementExists(selector);
        console.log('element loaded', elementLoaded)
        if (elementLoaded) {
            return true;
        } else {
            currentTry += 1;
            if (currentTry > maxTryBeforeReload) {
                await Page.reload()
                console.log(`Reloading page after tries ${currentTry}`)
                currentTry = 0
                await utils.sleep(1000);
            }
            await utils.sleep(500);
        }
    }
    return false;
};

exports.clickOnEl = async (client, selector, idx = 0, xOffset = null, yOffset = null) => {
    // wait for element to load.
    await exports.waitUntilElExists(client, selector);

    // wait for element to be available to click.
    while (true) {
        let coords = await exports.getCoordsofEl(selector, idx);
        console.log("Input Coords:", coords)
        if (coords !== null && coords.top !== 0 && coords.left !== 0) {
            let [x, y] = [
                (coords.left + coords.right) / 2,
                (coords.top + coords.bottom) / 2
            ];

            /**
             * Use case for introducing offset support in relative to an element.
             * Offset will enable use cases like closing a dropdown by clicking a bit outside the container.
             **/

            // xOffset handling
            if (Number.isInteger(xOffset) && xOffset !== 0) {
                if (xOffset > 0) {
                    x = coords.right + xOffset;
                } else {
                    x = coords.left + xOffset;
                }
            }

            // yOffset handling
            if (Number.isInteger(yOffset) && yOffset != 0) {
                if (yOffset > 0) {
                    y = coords.bottom + yOffset;
                } else {
                    y = coords.top + yOffset;
                }
            }

            await exports.clickAtPosition(client, x, y, 'left');
            // clicked successfully
            break
        } else {
            console.log(`Element "${selector}" is not visible on screen to click yet, waiting..`);
            await utils.sleep(500);
        }
    }
};

function ElementDoesNotExist (message) {
    this.message = message;
    this.name = 'ElementDoesNotExist';
};
ElementDoesNotExist.prototype = new Error();

exports.retrieveExistingSelector = async (client, selectors, inf = true) => {
    let currentTry = 0;
    let reloadTries = 0
    const maxTryBeforeReload = 20
    let {Page} = client;
    await Page.enable()

    // const maxTries = 3 * selectors.length;
    while (true) {
        if (reloadTries > 3) {
            throw new ElementDoesNotExist(`${selectors} does n't exists!`)
        }
        for (let selector of selectors) {
            const exists = await exports.elementExists(selector);
            if (exists) {
                return selector;
            } else {
                currentTry += 1;
                if (currentTry > maxTryBeforeReload) {
                    await Page.reload()
                    console.log(`Reloading page after tries ${currentTry}`)
                    currentTry = 0
                    reloadTries += 1
                    await utils.sleep(1000);
                }
                await utils.sleep(500);
            }
        }
    }
};

exports.createAndReadFileAsBase64 = async (fileName, fileContent) => {
    try {
      // Create a text file with content
      fs.writeFileSync(fileName, fileContent, 'utf-8');
  
      // Read the file as Base64
      const base64Data = fs.readFileSync(fileName, 'base64');
  
      return base64Data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }
exports.capture_captcha_screenshot = capture_captcha_screenshot;

exports.getZoomValue = (googleMapsURL) => {

    let zoomValue = null;

    // Split the URL by '/'
    let urlParts = googleMapsURL.split('/');

    // Find a segment that contains the zoom value (e.g., '14z')
    let zoomSegment = urlParts.find(part => /(\d+)z/.test(part));

    if (zoomSegment) {
      // Extract the zoom value from the segment
      zoomValue = parseInt(zoomSegment.match(/(\d+)z/)[1]);
      console.log("Zoom Value:", zoomValue);
    }
    return zoomValue
}

exports.setZoomValue = async (client, mapUrl, job) => {
    var zoomValue = exports.getZoomValue(mapUrl)
    console.log("Google map url zoom value", zoomValue)
    while(zoomValue !== parseInt(job.fields.zoom)) {
         console.log("setting the zoom value", zoomValue)
          if (zoomValue < job.fields.zoom){
            await exports.clickOnEl(client, ZOOM_IN_SELECTOR)
            zoomValue++;
            await utils.sleep(5000);
          }
          else {
            await exports.clickOnEl(client, ZOOM_OUT_SELECTOR)
            zoomValue--;
            await utils.sleep(5000);
          }
    }
    return zoomValue
}

exports.getReviewScore = async (client) => {
    let {Runtime} = client;
    const expression = `
        let review = document.querySelector('.F7nice > span:nth-child(2) > span > span').innerHTML;
        let rating = document.querySelector(".F7nice > span > span").innerHTML;
        if (!review) { review = document.querySelector("span[aria-label*='reviews']").innerHTML};
        if (review || rating){ JSON.stringify({'reviews': review, "rating": rating}); }
    `
    try {
        let review_score = await Runtime.evaluate({expression: expression});
        return JSON.parse(review_score.result.value);
    }
    catch (e) {
        console.log(e.message);
        return {'reviews': null, 'rating': null};
    }

}

exports.isPageLoaded = async (client) => {
    const loadPromise = client.Page.loadEventFired();
    const timeout = 20000; // Set a timeout value (e.g., 20 seconds)

    const pageLoaded = Promise.race([loadPromise, new Promise((resolve) => {
    setTimeout(() => {
    resolve(false); // Resolve to false on timeout
    }, timeout);
    })]);

    if (await pageLoaded) {
    // Page has loaded
        return true
    } else {
    // Handle the case where the load event didn't occur within the timeout
    console.log("Page load event timed out.");
    }

}

// Function that clicks on coordinates on the page and set timeout in that case when function stuck
exports.clickAtPositionWithTimeout = async function (client, x, y, button, timeout = 10000) {
    console.log('Clicking at position x:', x, 'y:', y);

    return new Promise(async (resolve, reject) => {
        // Set up a timeout
        const timeoutId = setTimeout(() => {
            reject(new Error('Click operation timed out')); // Throw a timeout error
        }, timeout);

        CDP(async (client) => {
            const options = {
                x: x,
                y: y,
                button: button,
                clickCount: 1
            };

            try {
                // Mouse press
                options.type = 'mousePressed';
                await client.Input.dispatchMouseEvent(options);

                // Mouse release
                options.type = 'mouseReleased';
                await client.Input.dispatchMouseEvent(options);

                // Operation completed successfully, clear the timeout
                clearTimeout(timeoutId);
                resolve();
            } catch (err) {
                // Operation failed, clear the timeout
                clearTimeout(timeoutId);
                reject(err);
            } finally {
                client.close();
            }
        }).on('error', (err) => {
            // Clear the timeout in case of an error
            clearTimeout(timeoutId);
            console.error(err);
            reject(err);
        });
    });
}

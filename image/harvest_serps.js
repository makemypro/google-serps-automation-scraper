const CDP = require('chrome-remote-interface');
const chromeLauncher = require('chrome-launcher');

const coordinates = require('./cdp/coords');

// ## get from utils.js
async function getRandomElementFromList(items){
    return items[Math.floor(Math.random()*items.length)];
}
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function loginAsGoogleUser(Page, username, password){
    await Page.navigate({url: 'https://accounts.google.com/servicelogin'});
    await Runtime.evaluate({expression: 'document.getElementById("identifierId").setAttribute("value", "m@sportsinspace.com");'})
}




// 1) create a function to login to Gmail to have an Authenticated User
//

// 2) process a keyword in an open tab
// processKeywordForTab(tab_id)

// 3)
// chrome-remote-interface new 'https://accounts.google.com/servicelogin'


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
    console.log('returning tab idx', tab_order_idx);
    return tab_dict[tab_order_idx];
}

function extractHTMLFromTab(tab){

}

function launchChrome(headless=false) {
    return chromeLauncher.launch({
    port: 9222, // Uncomment to force a specific port of your choice.
    chromeFlags: [
      '--window-size=412,732',
      '--disable-gpu',
      headless ? '--headless' : ''
    ]
  });
}

//
// var chrome = launchChrome();
// var protocol = CDP({port: '9222'} );
// const {Page, Runtime} = protocol;

var keyword_serp_html = {};
var is_recaptcha_hit = false;
const pageTitleSelector = "document.querySelector('title').textContent";
const innerHTMLSelector = " document.documentElement.innerHTML";

// html_utils.js
function checkIfHTMLContainsRecaptcha(html){
    let recaptchaToken = "Our systems have detected unusual traffic from your computer network";
    let recaptcha_check_result = html.includes(recaptchaToken);
    console.log('RECAPTCHA CHECK:', recaptcha_check_result);
    is_recaptcha_hit = recaptcha_check_result;
    return recaptcha_check_result;
}

async function pollIfRecaptchaIsHit(){
    let client = await CDP({port: '9222'});
    let {Page, Network, Runtime} = client;

    let innerHTMLResult = await Runtime.evaluate({expression: innerHTMLSelector});
    let recaptcha_check_result = checkIfHTMLContainsRecaptcha(innerHTMLResult.result.value);
    is_recaptcha_hit = recaptcha_check_result;
    console.log('recaptcha_check_result:', recaptcha_check_result);
    console.log('is_recaptcha_hit:', is_recaptcha_hit);
    console.log('innerHTMLResult Length:' + innerHTMLResult.result.value.length);
    let pageTitleSelectorResult = await Runtime.evaluate({expression: pageTitleSelector});
    console.log('Title of page: ' + pageTitleSelectorResult.result.value);
    return recaptcha_check_result;
}


async function loadPageInNewTab(url, keyword){
    console.log('loading URL in tab:', url);
    let tabMeta = await CDP.New();
    let client = await CDP({tab: tabMeta});
    let {Page, Network, Runtime} = client;
    await Page.enable();
    Page.loadEventFired(async () => {
        let innerHTMLResult = await Runtime.evaluate({expression: innerHTMLSelector});
        keyword_serp_html[keyword] = innerHTMLResult;
        // console.log('innerHTMLResult:', innerHTMLResult);
        checkIfHTMLContainsRecaptcha(innerHTMLResult.result.value);
        console.log('innerHTMLResult Length:' + innerHTMLResult.result.value.length);
        let pageTitleSelectorResult = await Runtime.evaluate({expression: pageTitleSelector});
        console.log('Title of page: ' + pageTitleSelectorResult.result.value);
    });

    await Page.navigate({url: url});
    await Page.loadEventFired();

    tab_idx++;
    tab_dict[tab_idx] = tabMeta;
    return tabMeta;
}

async function loadPageInTab(url, keyword){
    let tab = grab_last_tab();
    var client = await CDP({tab: tab});
    let {Page, Network, Runtime} = client;
    await CDP.Activate({id: tab.id});
    await Page.enable();
    Page.loadEventFired(async () => {
        let innerHTMLResult = await Runtime.evaluate({expression: innerHTMLSelector});
        keyword_serp_html[keyword] = innerHTMLResult;
        // console.log('innerHTMLResult:', innerHTMLResult);
        checkIfHTMLContainsRecaptcha(innerHTMLResult.result.value);
        console.log('innerHTMLResult Length:' + innerHTMLResult.result.value.length);
        let pageTitleSelectorResult = await Runtime.evaluate({expression: pageTitleSelector});
        console.log('Title of page: ' + pageTitleSelectorResult.result.value);
    });
    await Page.navigate({url: url});
    await Page.loadEventFired();
}

var initial_configuration = {
  'start_page': 'google.com',
  'num': null,
};


async function strategy_harvest_serps() {
    // // connect to endpoint

    const chrome = await launchChrome();
    var client = await CDP({port: '9222'});
    var {Network, Page, Runtime, DOM} = client;
    await Promise.all([Page.enable(), Runtime.enable()]);
    await Promise.all([Network.enable(), Page.enable(),DOM.enable()]);
    var maxTabs = 1;

    await Network.enable();
    await Page.enable();
    await DOM.enable();

    var keywords_processed = 1;
    while (1){

        var keyword = 'Apollo '+keywords_processed;
        // getRandomElementFromList(serp_harvesting_keywords);
        var url = 'https://google.com/search?num=100&q='+keyword;
        console.log('keyword:', keyword);

        // Check if RECAPTCHA is hit!
        while (is_recaptcha_hit){
            console.log('strategy_harvest_serps Hit! Sleeping for 2 second');
            await pollIfRecaptchaIsHit();
            let results = await getRecaptchaCoords();
            console.log('recaptcha coords:', results);
            await sleep(2000);
        }

        if (tab_idx < maxTabs) {
            let tabobj = await loadPageInNewTab(url, keyword);
            console.log('tab_idx', tab_idx);
            tab_order.push(tabobj);
            tab_order_idxes.push(tab_idx);
            //await sleep(200);
        } else {
            await loadPageInTab(url, keyword);
            //await sleep(200);
        }
        keywords_processed ++;
    }
}


async function getCoords(css_selector) {
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

    result = await Runtime.evaluate({
      expression: clientRectCmd,
    });

    // get offset screen positioning
    const screenPos = await Runtime.evaluate({
      expression: "JSON.stringify({offsetY: window.screen.height - window.innerHeight, offsetX: window.screen.width - window.innerWidth})"
    });

    let offset = JSON.parse(screenPos.result.value);
    let clientRect = null;

    try {
      clientRect = JSON.parse(result.result.value)["0"];
    } catch(err) {
      return null;
    }

    let retVal =  {
      x: offset.offsetX + clientRect.x,
      y: offset.offsetY + clientRect.y,
      width: clientRect.width,
      height: clientRect.height,
    };
    console.log(JSON.stringify(retVal));
    return retVal;
  } catch (err) {
    console.error(err);
  } finally {
    if (client) {
      await client.close();
    }
  }
}


async function getRecaptchaCoords(){
    let result = await getCoords("#recaptcha-anchor");
    console.log(result);
    return result;
}

strategy_harvest_serps();



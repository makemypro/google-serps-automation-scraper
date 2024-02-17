const CDP = require('chrome-remote-interface');
const coordinates = require('./cdp/coords');
const page_source = require('./cdp/page_source');
const utils = require('./utils');
const browser_utils = require('./cdp/browser_utils');
const google_actions = require('./cdp/google_actions');
const google_desktop = require('./extractors/google_desktop');
const R = require("rambdax");
var assert = require('assert');
const fs = require('fs');


// search the keyword and store serps in redis

const innerHTMLSelector = " document.documentElement.innerHTML";

exports.strategy_google_serps = async function (job, clientInput = null, shouldCloseClient = true) {


    console.log('strategy_google_serps received job:', job);
    var keyword = job.fields.keyword;

    // Stage 1 - Perform Google Search
    // a) Get Chrome Setup
    if (clientInput) {
        var client = clientInput;
        var {Network, Page, Runtime, Input, DOM} = client;
    } else {
        var client = await browser_utils.startChrome();
        var {Network, Page, Runtime, Input, DOM} = client;
        await Network.enable();
        await Page.enable();
        await DOM.enable();
    }


    // b) Go to first page of Google.com
    var url = 'https://google.com?num=100';
    let tabobj = await browser_utils.loadPageInTab(url, client);
    await tabobj.loadEventFired();
    //await R.delay(1000);
    assert(browser_utils.validatePageUrl(tabobj, "google.com/search"));

    // c) Type the letters into the search box + hit ENTER
    console.log('typing in', keyword);
    for (let letter of String(keyword)) {
        await Input.dispatchKeyEvent({ type: 'char', text: letter });
        await R.delay(200);
    }
    browser_utils.pressEnter(Input);
    await Page.loadEventFired();

    // d) Check if RECAPTCHA is hit!
    await google_actions.resolveCaptchaOnPageIfDiscovered(client);
    console.log("after resolveCaptchaOnPageIfDiscovered")
    R.delay(300);
    var response_html = await page_source.getPageSource();
    if (shouldCloseClient) {
        client.close();
    }
    return response_html
};

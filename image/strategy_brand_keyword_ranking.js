const page_source = require('./cdp/page_source');
const browser_utils = require('./cdp/browser_utils');
const google_actions = require('./cdp/google_actions');
const google_desktop = require('./extractors/google_desktop');
const R = require("rambdax");
var assert = require('assert');


exports.strategy_brand_keyword_ranking = async function (job, clientInput = null, shouldCloseClient = true, session_id = null) {

    // Initiate and start Redis client
    let redis_client = await browser_utils.get_redis_client()

    console.log('[strategy_brand_keyword_ranking] received job:', job);
    var keyword = job.fields.keyword;
    var organic_target = job.fields.organic_target;

    // List of actions that occurred during this strategy that we will be logging
    global.actions = [];

    global.keyword = keyword;
    var currentUrl = null;

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
    var url = "https://google.com";
    let tabobj = await browser_utils.loadPageInTab(url, client);
    await tabobj.loadEventFired();
    assert(browser_utils.validatePageUrl(tabobj, "google.com/search"));
    global.actions.push(
        {
            "keyword": keyword,
            "current_url": await browser_utils.getCurrentURLOfPage(Page),
            "current_ip": await browser_utils.getProxyIpAddress(),
            "code": "google_homepage",
            "message": "Opened Google search page."
        }
    );


    // c) Type the letters into the search box + hit ENTER
    console.log('typing in', keyword);
    for (let letter of String(keyword)) {
        await Input.dispatchKeyEvent({ type: 'char', text: letter });
        await R.delay(200);
    }
    browser_utils.pressEnter(Input);
    await Page.loadEventFired();
    global.actions.push(
        {
            "keyword": keyword,
            "current_url": await browser_utils.getCurrentURLOfPage(Page),
            "current_ip": await browser_utils.getProxyIpAddress(),
            "code": "serps_page",
            "message": "Opened SERPs."
        }
    );

    // d) Check if RECAPTCHA is hit!
    await google_actions.resolveCaptchaOnPageIfDiscovered(client);
    console.log("after resolveCaptchaOnPageIfDiscovered")

    // Stage 2 - Click on Organic Result within first n pages
    if (organic_target){
        console.log("Organic target:", organic_target);
        var organic_domains_to_click_on = [organic_target];
        var html = await page_source.getPageSource();
        var organic_results = google_desktop.extractOrganicResults2(html);
        console.log('organic_results:', organic_results);
        await google_actions.executeClickOnOrganicDomains(client, Runtime, organic_domains_to_click_on, job, organic_results);

        if (job.fields.organic_target_wait_seconds){
            let sleep_length = job.fields.organic_target_wait_seconds * 1000;
            console.log('Sleeping for', sleep_length/1000, 'seconds',);
            await R.delay(sleep_length);
        }
        await google_actions.clickInternalLink(client, Runtime, job);
    }

    if (shouldCloseClient) {
        client.close();
    }

    if (session_id) {
        await redis_client.set(session_id, JSON.stringify(global.actions));
    }
    return organic_results;
};
const CDP = require('chrome-remote-interface');
const coordinates = require('./cdp/coords');
const page_source = require('./cdp/page_source');
const utils = require('./utils');
const browser_utils = require('./cdp/browser_utils');
const proxy_utils = require('./cdp/proxy_utils');
const google_actions = require('./cdp/google_actions');
const google_desktop = require('./extractors/google_desktop');
const R = require("rambdax");
var assert = require('assert');
const fs = require('fs');
const fetch = require('cross-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
const url = require('url');


// Brand Defense Strategy
// Search for the brand keyword, click on a competitor ad, wait for 30-60 seconds, then click back and click on a different competitor, wait for 30-60 seconds
// Open question: does it actually charge the competitor for the ad? Need to run a test. Easy/quick Experiment idea we can run on our own LinkGraph keyword: https://www.loom.com/share/58fd5b7ef3384abf8e8e45789ca5ec64
// inputs: keyword, num_competitors,

// CTR Enhancement Strategy
// Search for a keyword, click on your site, wait for 30-60 seconds, then click again
// inputs: keyword, optional domain, URL, or SERP Position to click on
const INPUT_SELECTOR = "input[name='q']";
const TEXTAREA_SELECTOR = "textarea[type='search'][name='q']";

var keyword_serp_html = {};
var is_recaptcha_hit = false;


// https://www.inc.com/profile/linkgraph
// https://clutch.co/profile/linkgraph


exports.navigateToDummy = async function (){
        // Stage 1 - Perform Google Search
    // a) Get Chrome Setup
    var client = await browser_utils.startChrome();
    var {Network, Page, Runtime, Input, DOM} = client;
    await Network.enable();
    await Page.enable();
    await DOM.enable();

    // await browser_utils.closeInitialWarningWindow(client);
    // return;


    // b) Go to first page of Google.com
    var url = 'https://www.youtube.com';
    let tabobj = await browser_utils.loadPageInTab(url, client);
    await tabobj.loadEventFired();
    await R.delay(2000);
    //assert(browser_utils.validatePageUrl(tabobj, "bing.com"));

};



function requestInterceptor(request, type) {
    // let bannedResourceTypes = ["image", "font", "other", "media"]

    // let url = request.url
    // if (url.startsWith("data:image")) return "direct"
    // if (url.includes("gstatic")) return "direct"

    // if (request.method == "GET") {
    //     let isDocument = type == "document" || type == "script" || type == "manifest" || type == "stylesheet"

    //     if (bannedResourceTypes.includes(type)) return "direct"
    //     if (url.includes("fonts.")) return "direct"

    //     if (isDocument && type == "document") return "proxy"
    //     if (isDocument) return "direct"
    // }

    return "proxy"
}

const requestPausedHandler = session => async ({ requestId, request, resourceType, responseHeaders, responseStatusCode}) => {
    /**
     * Request interception:
     * Important: Proxy settings are activated on browser-level.
     * Fulfills requests that need to be sent directly (i.e. without proxy) by modifying their headers to eliminate proxy settings from there.
     * Continue with the requests in browser as is, that need to be sent with the proxy. Additionally, set `interceptResponse` so that we have
     * the ability to measure the bandwidth used behind the proxy.
     **/
    let action = requestInterceptor(request, resourceType.toLowerCase())
    if (action == 'abort') {
        try {
            await session.Fetch.failRequest({requestId: requestId, errorReason: 'Aborted'})
        } catch(error) {
            console.log("Error during abort request interception: ")
        }
    } else if(action == 'proxy') {
        // Continue request behind the proxy
        let proxyUrl = global.proxyUrl;
        try {
            const response = await fetch(request.url,  {method: request.method, headers: request.headers, body: request.postData, agent: new HttpsProxyAgent(proxyUrl)});
            const headers = Object.keys(response.headers).map(key => ({name: key, value: response.headers[key]}));
            const body = await response.text()
            await session.Fetch.fulfillRequest({
                requestId: requestId,
                responseCode: response.status,
                responseHeaders: headers,
                body: Buffer.from(body).toString('base64')
            })
        } catch(error) {
            console.log("Error during proxy request interception: ", error.message.slice(0, 100))
        }
    } else {
        try {
            await session.Fetch.continueRequest({requestId: requestId});
        } catch (error) {
            console.log("Error during direct request interception: ", error.message.slice(0, 100))
        }
    }
}


exports.strategy_google = async function (job, clientInput = null, shouldCloseClient = true) {

    // Initiate and start Redis client
    let redis_client = await browser_utils.get_redis_client(process.env.CELERY_BROKER_URL)

    console.log('strategy_google received job:', job);

    var keyword = job.fields.keyword;
    var top_ads = job.fields.top_ads;
    var paid_blocklist = job.fields.paid_blocklist;
    var organic_target = job.fields.organic_target;
    var target_actions = job.fields.actions;
    var job_id = String(job.fields.job_id);
    var num = job.fields.num;
    var max_organic_serp_position_click_limit = job.fields.max_organic_serp_position_click_limit;
    var location = job.fields.location;

    // List of actions that occurred during this strategy that we will be logging
    global.actions = [];

    global.keyword = keyword;

    const client = await CDP({port: '9222'});
    const {Network, Page, Runtime, Input, DOM, Fetch} = client;
    await Network.enable();
    await Runtime.enable();
    await Page.enable();
    await DOM.enable();

    let random_user_agent = browser_utils.getRandomUserAgent()
    global.random_user_agent = random_user_agent
    global.actions.push(
        {
            "keyword": job.fields.keyword,
            "code": "user_agent",
            "random_user_agent": random_user_agent
        }
    );
    await Network.setUserAgentOverride({'userAgent': random_user_agent});

    await Network.setCacheDisabled({cacheDisabled: true});

    let browserscan_url = 'https://www.browserscan.net/en'
    await browser_utils.loadPageInTab(browserscan_url, client);
    await Page.loadEventFired()

    await utils.sleep(20000);

    var filename = keyword;
    var screenshot_data = await browser_utils.saveScreenshot(Page, `${filename}.png`);
    job.fields.fingerprint = screenshot_data;


    // b) Go to first page of Google.com
    let url = 'https://google.com';
    if (num) {
      url = `https://google.com?num=${num}`;
    }
    if (location) {
        let uule = utils.generateUule(location)
        if (url.includes('?')) {
            url = `${url}&uule=${uule}`
        } else {
            url = `${url}?uule=${uule}`
        }
    }
    console.log(`Final url to open in tab: ${url}`)
    let tabobj = await browser_utils.loadPageInTab(url, client);
    // await Network.loadingFinished();
    await utils.sleep(3000)

    // d) Check if RECAPTCHA is hit!
    let innerHTMLSelector = "document.documentElement.innerHTML";
    let innerHTMLResult = await Runtime.evaluate({expression: innerHTMLSelector});
    if (innerHTMLResult.result.value) {
        let recaptcha_check_result = browser_utils.checkIfHTMLContainsRecaptcha(innerHTMLResult.result.value);
        if (recaptcha_check_result) {
            console.log(`Encountered captcha with proxy: ${global.proxyUrl} and ip: ${global.ip}, attempting to replace the IP`)
            global.actions.push(
                {
                    "keyword": keyword,
                    "current_url": process.env.HTTPS_PROXY,
                    "current_ip": global.ip,
                    "code": "recaptcha",
                    "tag": process.env.TAG,
                    "random_user_agent": random_user_agent
                }
            );
            if (job_id) {
                await redis_client.set(job_id, JSON.stringify(global.actions));
            }

            // Rotate IP Address
            const success = await proxy_utils.rotateIPAddress();
            throw new browser_utils.RecaptchaEncountered(`Recaptcha encountered for proxy ${global.proxyUrl} and ip: ${global.ip}`, success);
        }
    }

    // Validate search page url
    assert(browser_utils.validatePageUrl(tabobj, "google.com/search"));
    global.actions.push(
        {
            "keyword": keyword,
            "current_url": await browser_utils.getCurrentURLOfPage(Page),
            "current_ip": global.ip,
            "code": "google_homepage",
            "message": "Opened Google search page.",
            "tag": process.env.TAG,
            "random_user_agent": random_user_agent
        }
    );

    /*
     * Enter keyword into the search input and wait until we get to SERPs page.
     */
    var filename = keyword;
    var screenshot_data = await browser_utils.saveScreenshotLowWidth(Page, `${filename}.png`);
    job.fields.screenshot_data = screenshot_data;

    // Determine Input selector
    const inputSelector = await browser_utils.retrieveExistingSelector(client, [
        INPUT_SELECTOR, TEXTAREA_SELECTOR
    ]);
    await browser_utils.enterTextIntoField(client, inputSelector, keyword)
    // await Network.loadingFinished();
    await utils.sleep(10000);

    let pageUrl = await browser_utils.getCurrentURLOfPage(Page)
    await utils.sleep(1000);
    let shouldNavigateAgain = false;
    if (!pageUrl.includes(`num=${num}`) && num) {
       console.log("Adding the num parameter!")
       pageUrl = pageUrl.concat(`&num=${num}`)
       shouldNavigateAgain = true

    }
    if (!pageUrl.includes(`uule=`) && location) {
       console.log("Adding the location parameter!")
       pageUrl = pageUrl.concat(`&uule=${utils.generateUule(location)}`)
       shouldNavigateAgain = true
    }
    if (shouldNavigateAgain) {
        await Page.navigate({url: pageUrl});
        await utils.sleep(10000);
    }
    
    global.actions.push(
        {
            "keyword": keyword,
            "current_url": await browser_utils.getCurrentURLOfPage(Page),
            "current_ip": global.ip,
            "proxy_url": await global.proxyUrl,
            "code": "serps_page",
            "message": "Opened SERPs.",
            "random_user_agent": random_user_agent
        }
    );

    screenshot_data = await browser_utils.saveScreenshotLowWidth(Page, `${filename}.png`);
    job.fields.screenshot_data = screenshot_data;

    // d) Check if RECAPTCHA is hit!
    innerHTMLSelector = "document.documentElement.innerHTML";
    innerHTMLResult = await Runtime.evaluate({expression: innerHTMLSelector});
    if (innerHTMLResult.result.value) {
        recaptcha_check_result = browser_utils.checkIfHTMLContainsRecaptcha(innerHTMLResult.result.value);
        if (recaptcha_check_result) {
            console.log(`Encountered captcha with proxy: ${global.proxyUrl}`)
            global.actions.push(
                {
                    "keyword": keyword,
                    "current_url": process.env.HTTPS_PROXY,
                    "current_ip": global.ip,
                    "code": "recaptcha",
                    "tag": process.env.TAG,
                    "random_user_agent": random_user_agent
                }
            );
            if (job_id) {
                await redis_client.set(job_id, JSON.stringify(global.actions));
            }

            // Rotate IP Address
            const success = await proxy_utils.rotateIPAddress();
            throw new browser_utils.RecaptchaEncountered(`Recaptcha encountered for proxy ${global.proxyUrl} and ip: ${global.ip}`, success);
        }
    }

    // Save SERPs page screenshot
    screenshot_data = await browser_utils.saveScreenshot(Page, `${filename}.png`);
    job.fields.screenshot_data = screenshot_data;
    let html_content = await browser_utils.createAndReadFileAsBase64(`${filename}.text`, innerHTMLResult.result.value)
    job.fields.html_content = html_content;

    // Stage 2 - SERP Page
    // 1) Click on Top Paid Ads per Job Instructions
    if (top_ads && target_actions.includes('paid_click')){
        //[...Array(5).keys()];
        //  => [0, 1, 2, 3, 4]
        // Convert to lowercase and strip whitespace
        await browser_utils.retrieveExistingSelector(client, google_actions.organic_serp_selectors);
        var cleaned_blocklist = paid_blocklist.map(function(item) {
            return item.toLowerCase().trim();
        });
        var ad_positions_to_click_on = [...Array(top_ads).keys()];

        var html = await page_source.getPageSource();
        var paid_results = google_desktop.extractPaidResults(html);
        console.log('Total Ads: ', paid_results.length);
        global.actions.push(
            {
                "keyword": keyword,
                "ads": paid_results,
                "current_ip": global.ip,
                "current_url": await browser_utils.getCurrentURLOfPage(Page),
                "code": "ads",
                "message": "List of Ads"
             }
        );

        var ad_positions_from_blocklist = [];
        console.log("here is the paid blocklist", cleaned_blocklist)
        for (let i of ad_positions_to_click_on) {
            let result = paid_results[i];
            if (!result) {
                // if there's no result, we shouldn't be trying to click on the result at this adwords position
                ad_positions_from_blocklist.push(i);
                continue;
            }
            else if (result['displayedUrl']) {
                for (const blocked_domain of cleaned_blocklist) {
                    if (result['displayedUrl'].includes(blocked_domain)) {
                        ad_positions_from_blocklist.push(i);
                        break; // No need to continue checking if we found a match
                    }
                }
            }
            else if (result['innerText']) {
                for (const blocked_domain of cleaned_blocklist) {
                    if (result['innerText'].includes(blocked_domain)) {
                        ad_positions_from_blocklist.push(i);
                        break; // No need to continue checking if we found a match
                    }
                }
            } else {
                // if inner text is missing do not take the risk of clicking block list
                ad_positions_from_blocklist.push(i);
            }
        }
        var ad_positions_to_click_on_filtered = ad_positions_to_click_on.filter(n => !ad_positions_from_blocklist.includes(n));
        console.log('ad_positions_to_click_on_filtered:', ad_positions_to_click_on_filtered);
        await google_actions.executeClickOnAdResults(client, Runtime, ad_positions_to_click_on_filtered);
    }

    // #2 Click on Domains in Top Paid Ads
    // , 'semrush.com'
    // var ad_domains_to_click_on = ['linkgraph.io'];
    // google_actions.executeClickOnAdDomain(client, Runtime, ad_domains_to_click_on);

    // #3 Click on Top SERP Positions
    // var organic_serp_positions_to_click_on = [ ];
    // await google_actions.executeClickOnOrganicResults(client, Runtime, organic_serp_positions_to_click_on);

    // #4 Click on Organic Result with Domain per Job Instructions
    if (organic_target && target_actions.includes('organic_search')){
        await browser_utils.retrieveExistingSelector(client, google_actions.organic_serp_selectors);
        console.log("Organic target:", organic_target);
        var organic_domains_to_click_on = [organic_target];
        var html = await page_source.getPageSource();
        var organic_results = google_desktop.extractOrganicResults2(html);
        var organic_results_for_position = google_desktop.extractOrganicResultsForPosition(html);
        console.log('organic_results:', organic_results);

        // Perform pogo click action
        await utils.sleep(2000)
        if (job.fields.should_pogo_click) {
        var pogo_click = await google_actions.performPogoClick(client, Runtime, organic_results_for_position, organic_domains_to_click_on)

        if (pogo_click) {
            global.actions.push(
                {
                    "keyword": job.fields.keyword,
                    "current_ip": global.ip,
                    "current_url": pogo_click,
                    "did_click": true,
                    "code": "pogo_click",
                    "sleep_interval": job.fields.organic_target_wait_seconds * 1000,
                    "message": "Perform pogo click.",
                    "random_user_agent": random_user_agent
                });
        }
    }
        await browser_utils.retrieveExistingSelector(client, google_actions.organic_serp_selectors);

        var target_domain_opened = await google_actions.executeClickOnOrganicDomains(client, Runtime, organic_domains_to_click_on, job, organic_results, organic_results_for_position);

        if (target_domain_opened) {
            let sleep_length = job.fields.organic_target_wait_seconds * 1000;
            console.log('Sleeping for', sleep_length/1000, 'seconds',);
            await R.delay(sleep_length);
            global.actions.push(
                {
                    "keyword": job.fields.keyword,
                    "current_ip": global.ip,
                    "current_url": await browser_utils.getCurrentURLOfPage(Page),
                    "did_click": target_domain_opened,
                    "code": "organic_click",
                    "sleep_interval": job.fields.organic_target_wait_seconds * 1000,
                    "message": "Opened Organic result.",
                    "position": await google_actions.getPositionOfDomainInSERPs(organic_results_for_position, organic_target),
                    "random_user_agent": random_user_agent
                }
            );
            await google_actions.clickInternalLink(client, Runtime, job);
        }
    }

    if (shouldCloseClient) {
        client.close();
    }

    if (job_id) {
        await redis_client.set(job_id, JSON.stringify(global.actions));
    }
    return organic_results;
};
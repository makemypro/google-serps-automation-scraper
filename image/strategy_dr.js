const CDP = require('chrome-remote-interface');
const utils = require('./utils');
const browser_utils = require('./cdp/browser_utils');
const proxy_utils = require('./cdp/proxy_utils');
const google_actions = require('./cdp/google_actions');
const R = require("rambdax");


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



exports.strategy_google = async function (job, clientInput = null, shouldCloseClient = true) {

    // Initiate and start Redis client
    let redis_client = await browser_utils.get_redis_client(process.env.CELERY_BROKER_URL)

    console.log('strategy_google received job:', job);

    var direct_url = job.fields.direct_url;
    var target_domain = job.fields.target_domain;
    var job_id = String(job.fields.job_id);

    // List of actions that occurred during this strategy that we will be logging
    global.actions = [];

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
            "direct_url": job.fields.direct_url,
            "code": "user_agent",
            "random_user_agent": random_user_agent
        }
    );
    await Network.setUserAgentOverride({'userAgent': random_user_agent});

    await Network.setCacheDisabled({cacheDisabled: true});

    console.log(`Final url to open in tab: ${direct_url}`)
    let tabobj = await browser_utils.loadPageInTab(direct_url, client);
    await Page.loadEventFired()
    await utils.sleep(10000)

    // d) Check if RECAPTCHA is hit!
    let innerHTMLSelector = "document.documentElement.innerHTML";
    let innerHTMLResult = await Runtime.evaluate({expression: innerHTMLSelector});
    if (innerHTMLResult.result.value) {
        let recaptcha_check_result = browser_utils.checkIfHTMLContainsRecaptcha(innerHTMLResult.result.value);
        if (recaptcha_check_result) {
            console.log(`Encountered captcha with proxy: ${global.proxyUrl} and ip: ${global.ip}, attempting to replace the IP`)
            global.actions.push(
                {
                    "direct_url": direct_url,
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

    /*
     * Enter direct_url into the search input and wait until we get to page.
     */
    var filename = job.fields.job_id;
    var screenshot_data = await browser_utils.saveScreenshotLowWidth(Page, `${filename}.png`);
    job.fields.screenshot_data = screenshot_data;
    await utils.sleep(5000);
    
    global.actions.push(
        {
            "direct_url": direct_url,
            "current_url": await browser_utils.getCurrentURLOfPage(Page),
            "current_ip": global.ip,
            "proxy_url": await global.proxyUrl,
            "code": "serps_page",
            "message": "Opened target url.",
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
                    "direct_url": direct_url,
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


    // #4 Click on Organic Result with Domain per Job Instructions
    let sleep_length = job.fields.organic_target_wait_seconds * 1000;
    console.log('Sleeping for', sleep_length/1000, 'seconds');

    // Check if cookies box showing
    let is_accept = await Runtime.evaluate({expression: `document.querySelector('a[data-cli_action="accept_all"]');`})
    if (is_accept.result) {
        await Runtime.evaluate({expression: `document.querySelector('a[data-cli_action="accept_all"]').click();`})
        await utils.sleep(2000);
    }

    await google_actions.clickBacklink(client, Runtime, job);
    await R.delay(sleep_length);
    global.actions.push(
        {
            "direct_url": job.fields.direct_url,
            "current_ip": global.ip,
            "current_url": await browser_utils.getCurrentURLOfPage(Page),
            "code": "organic_click",
            "sleep_interval": job.fields.organic_target_wait_seconds * 1000,
            "message": "Opened Organic result.",
            "random_user_agent": random_user_agent
        }
    );

    if (shouldCloseClient) {
        client.close();
    }

    if (job_id) {
        await redis_client.set(job_id, JSON.stringify(global.actions));
    }
    return true;
};
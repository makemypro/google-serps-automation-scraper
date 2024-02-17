const utils = require('./utils');
const browser_utils = require('./cdp/browser_utils');

const YT_URL = 'https://youtube.com/';
const SKIP_ADS_BTN_SELECTOR = 'div.ytp-ad-text.ytp-ad-skip-button-text';
const ADS_OVERLAY_SELECTOR = 'div.video-ads.ytp-ad-module > div.ytp-ad-player-overlay';
const VIDEO_BLOCK_SELECTOR = 'video.video-stream.html5-main-video';

// Youtube Video Watch
// Go to Youtube link and watch for 30 seconds.
exports.strategy_youtube = async function (job) {
    console.log('strategy_youtube received job:', job);

    let client = await browser_utils.startChrome();
    let {Network, Page, DOM, Runtime} = client;
    await Promise.all([Page.enable(), Network.enable(), DOM.enable()]);

    // Get a random desktop user agent
    let random_user_agent = browser_utils.getRandomUserAgent()
    await Network.setUserAgentOverride({'userAgent': random_user_agent});
    console.log('chosen user agent ->', random_user_agent);
    
    // let tabObj = await browser_utils.loadPageInTab(YT_URL, client);
    // await tabObj.loadEventFired();
    // await utils.sleep(1000);

    // Load the video;
    let youtube_target = job.fields.youtube_target;
    console.log('youtube_target:', youtube_target);
    await browser_utils.loadPageInTab(youtube_target, client);
    // let page = await browser_utils.loadPageInTab(youtube_target, client);
    // await page.loadEventFired();
    await Network.loadingFinished();
    await utils.sleep(1000);

    // Wait for the video element to render;
    while (!await browser_utils.elementExists(VIDEO_BLOCK_SELECTOR)){
        await utils.sleep(300);
    };
    // Wait for the video element to load fully(start playing);
    while (!await browser_utils.isVideoLoaded(VIDEO_BLOCK_SELECTOR)){
        await utils.sleep(300);
    }

    // Check if there is ads - if we find ads overlay, wait until the skip button shows and click it;
    while (await browser_utils.elementExists(ADS_OVERLAY_SELECTOR)){
        console.log('FOUND AIDS');
        await utils.sleep(800);
        let coords = await browser_utils.getCoordsofEl(SKIP_ADS_BTN_SELECTOR);
        if (coords !== null && coords.top !== 0 && coords.left !== 0) {
            console.log('FOUND AIDS CURE!');
            await browser_utils.clickAtPosition(
                client,
                ...utils.randomCoordsFromIntervals([coords.left, coords.right], [coords.top , coords.bottom]),
                'left'
            );
        };
    };
    // Watch for ~30s and close the client;
    let views = await Runtime.evaluate({expression: "document.getElementsByClassName('bold style-scope yt-formatted-string')[0].innerText;"});
    await utils.sleep(utils.randomIntFromInterval(30000, 34000));
    await Network.clearBrowserCache();
    await Network.clearBrowserCookies();
    await client.close();
    return new Promise((resolve, reject) => {
        resolve(views)
    })
};

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
    var url = 'https://www.google.com';
    let tabobj = await browser_utils.loadPageInTab(url, client);
    await tabobj.loadEventFired();
    await R.delay(2000);
    //assert(browser_utils.validatePageUrl(tabobj, "bing.com"));

};

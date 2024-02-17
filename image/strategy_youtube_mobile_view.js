const utils = require('./utils');
const browser_utils = require('./cdp/browser_utils');
const CDP = require('chrome-remote-interface');
const logs_utils = require("./cdp/logs_util");

const YT_DOMAIN = 'youtube.com';
const SKIP_ADS_BTN_SELECTOR = 'div.ytp-ad-text.ytp-ad-skip-button-text';
const ADS_OVERLAY_SELECTOR = 'div.video-ads.ytp-ad-module > div.ytp-ad-player-overlay';
const VIDEO_BLOCK_SELECTOR = 'video.video-stream.html5-main-video';
const VIDEO_PLAY_PROGRESS_SELECTOR = 'div.ytp-play-progress.ytp-swatch-background-color'
const REJECT_COOKIES_BUTTON = '#content > div.body.style-scope.ytd-consent-bump-v2-lightbox > div.eom-buttons.style-scope.ytd-consent-bump-v2-lightbox > div:nth-child(1) > ytd-button-renderer:nth-child(1) > yt-button-shape > button > yt-touch-feedback-shape > div > div.yt-spec-touch-feedback-shape__fill'
const YT_PLAY_BUTTON_SELECTOR = '.ytp-large-play-button'

async function getViewsOnVideoMobileView(tab) {
    const client = await CDP({port: '9222'});
    await client.Runtime.enable()
    await client.Runtime.evaluate({expression: "document.querySelector('span .yt-core-attributed-string').click();"});
    await utils.sleep(1000)
    let views_element = await client.Runtime.evaluate({expression: "document.querySelector('ytm-factoid-renderer:nth-child(2) > div > span.factoid-value > span').innerHTML;"});
    let element_value = views_element.result.value;
    let views = null
    if (element_value) {
        views = browser_utils.convertToInteger(views_element.result.value.toLowerCase().replace('views', ''))
    }
    return new Promise((resolve, reject) => {
        console.log("Got '", views, "' views for video: ", tab.url);
        resolve(views)
    })
}

async function detectModalAndRejectCookies() {
    /*
    Detect and skips the YT reject cookies modal if appears.
    */
    const client = await CDP({port: '9222'});
    return new Promise(async (resolve, reject) => {
        await client.Runtime.enable()
        if (browser_utils.elementExists(REJECT_COOKIES_BUTTON)) {
            await client.Runtime.evaluate({expression: `document.querySelector(${REJECT_COOKIES_BUTTON}).click();`});
        }
        resolve();
    });
};

async function waitUntilVideoLoads(tab) {
    /*
    Wait for up to 60 seconds for a video element to appear
    on a page and video to be loaded and playing before reloading the page.
    Keep on checking whether the video is there for every 3 seconds.
    */
    return new Promise(async (resolve, reject) => {
        let retry = 0
        const max_retries = 30
        const wait_between_retries = 1000

        const client = await CDP({port: '9222'});
        await client.Page.enable();
        await client.Page.enable();
        while (true) {
            await detectModalAndRejectCookies()
            if (await browser_utils.elementExists(YT_PLAY_BUTTON_SELECTOR)) {
                try {
                    let coords = await browser_utils.getCoords(YT_PLAY_BUTTON_SELECTOR)
                    await browser_utils.clickAtPosition(client, x=coords.x, y=coords.y);
                } catch(error) {}
            }
            const videoElExists = await browser_utils.elementExists(VIDEO_BLOCK_SELECTOR);
            if (videoElExists) {
                const isVideoLoaded = await browser_utils.isVideoLoaded(VIDEO_BLOCK_SELECTOR);
                if (isVideoLoaded) {
                    console.log("Waited for ", retry * wait_between_retries / 1000, " seconds for the video: ", tab.url);
                    break;
                }
            }

            if (retry > max_retries){
                console.log("Waited for ", max_retries * wait_between_retries / 1000, " seconds. Reloading the page: ", tab.url);
                await client.Page.reload();
                retry = 0;
            }
            // wait for 3 seconds before retrying
            await utils.sleep(wait_between_retries);
            retry++;
        };
        resolve();
    });
}

async function detectAndSkipAd(tab) {
    /*
    Detect and skips the YT Ad.
    Check if there is ads - if we find ads overlay, wait until the skip button shows and click it.
    */
    const client = await CDP({port: '9222'});
    return new Promise(async (resolve, reject) => {
        await utils.sleep(1000);
        while (await browser_utils.elementExists(ADS_OVERLAY_SELECTOR)) {
            console.log("Detected Ad for video: ", tab.url);
            let coords = await browser_utils.getCoordsofEl(SKIP_ADS_BTN_SELECTOR);
            if (coords !== null && coords.top !== 0 && coords.left !== 0) {
                console.log('Skipping Ad for video: ', tab.url);
                await browser_utils.clickAtPosition(
                    client,
                    ...utils.randomCoordsFromIntervals([coords.left, coords.right], [coords.top , coords.bottom]),
                    'left'
                );
            } else {
                console.log("Couldn't find skip Ad button coordinates, retrying..");
                await utils.sleep(1000);
            }
        }
        resolve();
    });
};

async function setVideoQuality144pMobileView(tab) {
    /*
    Set video quality to 144p
    */
    client = await CDP({port: '9222'});
    await client.Runtime.enable();
    let runtime = client.Runtime;
    return new Promise(async(resolve, reject) => {
        await runtime.evaluate({expression: `document.querySelector('.mobile-topbar-header-content.non-search-mode >button.yt-spec-button-shape-next').click()`});
        await utils.sleep(1000);
        await runtime.evaluate({expression: `document.querySelector('.bottom-sheet-menu-item > ytm-menu-item > button').click()`});
        await utils.sleep(1000);
        let coords = await browser_utils.getCoords('.player-quality-settings > select')
        await browser_utils.clickAtPosition(client, x=coords.x, y=coords.y);
        await utils.sleep(1000);
        console.log("The quality has been set to 144p for video: ", tab.url);
        resolve()
    });
};

// Youtube Video Watch
// Go to Youtube link and watch for 30 seconds.
async function playVideosInCurrentTabs(current_ip, session_id) {
    let actions = []
    let startTime = null;
    let initialDelay = null;
    const client = await CDP({port: '9222'});
    return new Promise(async (resolve, reject) => {
        let {Network, Page, DOM, Runtime} = client;
        await Promise.all([Page.enable(), Network.enable(), DOM.enable(), Runtime.enable()]);

        // Extract tabs running YT videos.
        const { targetInfos } = await client.Target.getTargets();
        const tabs = targetInfos.filter((target) => target.url.includes('youtube.com/watch?v=') && target.type == 'page');
        console.log(`Found ${tabs.length} chrome tabs running YT videos.`)
        for (let tab of tabs) {
            try {
                startTime = new Date().getTime();
                await client.Target.activateTarget({ targetId: tab.targetId});
                await utils.sleep(1000);

                await waitUntilVideoLoads(tab);
                await detectAndSkipAd(tab);
                /*
                Record initial delay now since Ad has been skipped and
                the video is playing.
                */
                initialDelay = (new Date().getTime() - startTime) / 1000
                console.log(`Initial delay for ${tab.url} is ${initialDelay} seconds.`)
                actions.push({
                    'youtube_target': tab.url,
                    'ip': current_ip,
                    'views': await getViewsOnVideoMobileView(tab),
                    'total_time_took_to_play_video': initialDelay,
                    'tag': process.env.TAG
                })
            } catch(error) {
                console.log('ChromeWindow Error:', error)
                continue;
            }
        }
        startTime = new Date().getTime();
        for (let action of actions) {
            await logs_utils.add_job_logs('YOUTUBE_VIEW', JSON.stringify({'job': action}), session_id);
        }
        let timeSpentInLogging = new Date().getTime() - startTime
        console.log(`Logging took ${timeSpentInLogging / 1000} seconds for the batch of ${tabs.length} videos.`);
        await utils.sleep(40000 - timeSpentInLogging);
        console.log(`${tabs.length} videos were at least running for ${initialDelay = (new Date().getTime() - startTime) / 1000}`)
        resolve(actions)
    });
}

exports.strategy_youtube = async function (jobs, current_ip, session_id) {
    // Starting chrome
    let initialTime = new Date().getTime();
    let startTime = new Date().getTime();
    await browser_utils.launchChrome();
    browser_utils.run_shell_command("python3 ./behavior/start_browser.py");

    let client = await CDP({port: '9222'});
    let {Network, Target} = client;
    await Promise.all([Network.enable()]);

    console.log(`Starting chrome took ${(new Date().getTime() - startTime) / 1000} seconds.`);

    // Get a random desktop user agent
    startTime = new Date().getTime();
    let random_user_agent = browser_utils.getRandomUserAgent(type='mobile')
    await Network.setUserAgentOverride({'userAgent': random_user_agent});
    console.log(`Choosing UserAgent took ${(new Date().getTime() - startTime) / 1000} seconds.`);

    // Load videos into new tabs
    startTime = new Date().getTime();
    for (let job of jobs){
        let youtube_target = job.fields.youtube_target;
        console.log('Opening the video in new tab: ', youtube_target);
        let targetInfo = await Target.createTarget({ url: 'about:blank'});
        const session = await CDP({port: '9222', target: targetInfo.targetId})
        await session.Network.enable()
        await session.Network.setUserAgentOverride({'userAgent': random_user_agent});
        await session.Emulation.setDeviceMetricsOverride({
            mobile: true,
            width: 600,
            height: 472,
            deviceScaleFactor: 2,
            screenOrientation: {
            angle: 0,
            type: 'portraitPrimary',
            },
        });
        await browser_utils.loadPageInTab(youtube_target, session);
    }
    console.log(`Opening tabs took ${(new Date().getTime() - startTime) / 1000} seconds.`);

    // Try to watch videos for ~30s and close the client
    const actions = await playVideosInCurrentTabs(current_ip, session_id);

    // Prepare for new session
    startTime = new Date().getTime();
    client = await CDP({port: '9222'});
    await client.Network.enable()
    await client.Network.clearBrowserCache();
    await client.Network.clearBrowserCookies();
    try {
       await browser_utils.closeChromeWindows()
    } catch(error) {
        console.log('closeChromeWindows Error:', error)
    }
    console.log(`Closing chrome took ${(new Date().getTime() - startTime) / 1000} seconds.`);
    return new Promise(async (resolve, reject) => {
        await client.close();
        totalDelay = (new Date().getTime() - initialTime) / 1000;
        console.log(`Total time took to complete ${jobs.length} videos job: ${totalDelay}`)
        resolve(actions)
    });
};


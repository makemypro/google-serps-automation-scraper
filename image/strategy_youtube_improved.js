const utils = require('./utils');
const browser_utils = require('./cdp/browser_utils');
const CDP = require('chrome-remote-interface');
const logs_utils = require("./cdp/logs_util");
const tunnel = require('tunnel');
const fetch = require('cross-fetch');
const proxyAgent = require('proxy-agent-v2')
const Blob = require('buffer')

const YT_DOMAIN = 'youtube.com';
const SKIP_ADS_BTN_SELECTOR = 'div.ytp-ad-text.ytp-ad-skip-button-text';
const ADS_OVERLAY_SELECTOR = 'div.video-ads.ytp-ad-module > div.ytp-ad-player-overlay';
const VIDEO_BLOCK_SELECTOR = 'video.video-stream.html5-main-video';
const VIDEO_PLAY_PROGRESS_SELECTOR = 'div.ytp-play-progress.ytp-swatch-background-color'
const REJECT_COOKIES_BUTTON = '#content > div.body.style-scope.ytd-consent-bump-v2-lightbox > div.eom-buttons.style-scope.ytd-consent-bump-v2-lightbox > div:nth-child(1) > ytd-button-renderer:nth-child(1) > yt-button-shape > button > yt-touch-feedback-shape > div > div.yt-spec-touch-feedback-shape__fill'

async function getViewsOnVideo(tab) {
    const client = await CDP({port: '9222'});
    await client.Runtime.enable()
    await utils.sleep(1000)
    await client.Runtime.evaluate({expression: "document.getElementsByClassName('bold style-scope yt-formatted-string')[0].click();"});
    await utils.sleep(1000)
    let views_element = await client.Runtime.evaluate({expression: "document.getElementsByClassName('bold style-scope yt-formatted-string')[0].innerText;"});
    let element_value = views_element.result.value;
    let views = null
    if (element_value) {
        if (element_value.value.toLowerCase().includes('k')) {
            views = null
        } else {
            views = browser_utils.convertToInteger(element_value.toLowerCase().replace('views', ''))
        }
    }
    return new Promise((resolve, reject) => {
        console.log("Got '", views, "' views for video: ", tab.url);
        resolve(views)
    })
}

async function requestInterceptor(request, type) {
    let bannedResourceTypes = ["image", "font", "other", "media"]

    let url = request.url

    if (url.startsWith("https://www.youtube.com/s/desktop")) return "direct"
    if (url.startsWith("https://www.youtube.com/watch?")) return "direct"
    if (url.startsWith("data:image")) return "direct"
    if (url.includes("gstatic")) return "direct"

    // block ad related stuff
    if (url.includes("i.ytimg.com")) return "abort"
    if (url.startsWith("chrome-extension://")) return "abort"
    if (url.includes("googlead")) return "abort"
    if (url.includes("pagead/")) return "abort"
    if (url.includes("static.doubleclick.net")) return "abort"

    if (request.method == "GET") {
        let isDocument = type == "document" || type == "script" || type == "manifest" || type == "stylesheet"

        if (bannedResourceTypes.includes(type)) return "abort"
        if (url.includes("fonts.")) return "abort"
        if (url.includes("googleads.g.")) return "abort"
        if (url.includes("accounts.google")) return "abort"
        if (url.includes("pagead/view")) return "abort"

        if (isDocument && type == "document") return "proxy"
        if (isDocument) return "direct"
    }

    return "proxy"
}

async function getVideoPlayTime(tab){
    let play_time = null;
    let client = await CDP({port: '9222'})
    let {Runtime} = client;
    let duration = 0
    await Promise.all([Runtime.enable()]);
    return new Promise(async (resolve, reject) => {
        try {
            play_time = await Runtime.evaluate({expression: `document.querySelector('span .ytp-time-current').innerText;`})
            duration = parseInt(play_time.result.value.split(":")[1])
            await utils.sleep(500)
        } catch(error) {
            duration = 0
            console.log(error)
        }
        resolve(duration)
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
            await utils.sleep(1000);
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
        const wait_between_retries = 3000

        const client = await CDP({port: '9222'});
        await client.Page.enable();
        while (true) {
            await detectModalAndRejectCookies()
            // if (await browser_utils.elementExists(YT_PLAY_BUTTON_SELECTOR)) {
            //     try {
            //         let coords = await browser_utils.getCoords(YT_PLAY_BUTTON_SELECTOR)
            //         await browser_utils.clickAtPosition(client, x=coords.x, y=coords.y);
            //     } catch(error) {}
            // }

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

async function setVideoQuality144p(tab) {
    /*
    Set video quality to 144p
    */
    client = await CDP({port: '9222'});
    await client.Runtime.enable();
    let runtime = client.Runtime;
    return new Promise(async(resolve, reject) => {
        await runtime.evaluate({expression: `document.getElementsByClassName('ytp-settings-button')[0].click()`});
        await utils.sleep(1000);
        await runtime.evaluate({expression: `let menuItem = document.getElementsByClassName('ytp-menuitem-content'); menuItem[menuItem.length-1].click()`});
        await utils.sleep(1000);
        await runtime.evaluate({expression: `let qualityBox = document.getElementById('ytp-id-18'); let qbt = qualityBox.getElementsByClassName('ytp-menuitem-label'); qbt[qbt.length - 2].click()`});
        console.log("The quality has been set to 144p for video: ", tab.url);
        resolve();
    });
};

async function seekVideoRandomly(tab) {
    /*
    Seeks video randomly to improve the activity.
    */
    const client = await CDP({port: '9222'});
    await client.Runtime.enable()
    return new Promise(async(resolve, reject) => {
        console.log("Performing seeks on the video: ", tab.url);
        while (!await browser_utils.elementExists(VIDEO_PLAY_PROGRESS_SELECTOR)) {
            console.log("Couldn't find the play progress bar, retrying in 2 seconds..");
            await utils.sleep(2000);
        }

        let ytPPCoords = await browser_utils.getCoordsofEl(VIDEO_PLAY_PROGRESS_SELECTOR);
        while (ytPPCoords === null) {
            console.log("Couldn't find the play progress bar, retrying in 2 seconds..");
            await utils.sleep(2000);
            ytPPCoords = await browser_utils.getCoordsofEl(VIDEO_PLAY_PROGRESS_SELECTOR);
        }

        seekPosition = browser_utils.randomNumber(50, 130)
        let x = ytPPCoords.left + seekPosition
        await browser_utils.clickAtPosition(client, x=x, y=ytPPCoords.top, 'left');
        console.log("Seeking video at: x=", x);
        await waitUntilVideoLoads(tab)
        resolve();
    });
}

async function waitOnVideoWhileWatching(tab){
    /*
    wait on a vid according to the play bar time and close the tab after watching.
    */
    let tries = 0
    let duration = 0;
    return new Promise(async (resolve, reject) => {
        let coords = await browser_utils.getCoords('div .ytp-settings-button')
        let x_axis = coords.x
        let y_axis = coords.y
        // hover on the vid element to make playbar appear so we can get the live duration of vid
        let client = await CDP({port: '9222'})
        await client.Runtime.enable()
        await client.Page.enable()
        let waitTime = browser_utils.randomNumber(parseInt(process.env.PLAYBACK_TIME), parseInt(process.env.PLAYBACK_TIME)+ 5)
        while (true) {
            x_axis = x_axis - browser_utils.randomNumber(-20, 20)
            await client.Input.dispatchMouseEvent({type: 'mouseMoved', x: x_axis, y: y_axis + 10})
            duration = await getVideoPlayTime(tab)
            tries += 0.2
            console.log("Video Playing time", duration, "seconds.. ", tries);
            if ((duration > waitTime) || (tries > waitTime)) {
                console.log(`${tab.url} was at least played for ${duration} seconds..`)
                await browser_utils.closeTab(tab.targetId)
                break;
            }
        }
        resolve();
    });
}


// Youtube Video Watch
// Go to Youtube link and watch for 30 seconds.
async function playVideosInCurrentTabs(current_ip, session_id) {
    let actions = []
    let startTime = null;
    let initialDelay = null;
    let client = await CDP({port: '9222'});
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
                await setVideoQuality144p(tab);
                /*
                Record initial delay now since Ad has been skipped and
                the video is playing.
                */
                initialDelay = (new Date().getTime() - startTime) / 1000
                console.log(`Initial delay for ${tab.url} is ${initialDelay} seconds.`)
                actions.push({
                    'youtube_target': tab.url,
                    'ip': current_ip,
                    'views': await getViewsOnVideo(tab),
                    'total_time_took_to_play_video': initialDelay,
                    'tag': process.env.TAG
                })
            } catch(error) {
                console.log('ChromeWindow Error:', error)
                continue;
            }
        }
        startTime = new Date().getTime();

        // let timeout = (parseInt(process.env.PLAYBACK_TIME) + 10) * 1000
        // let timeoutPromise = new Promise((resolve) => {
        //     setTimeout(() => resolve('timeout'), timeout);
        // });

        for (let tab of tabs) {

            await waitOnVideoWhileWatching(tab)
        
            // Wait for either the watchVidPromise to resolve or the timeoutPromise to resolve
            // const result = await Promise.race([watchVidPromise, timeoutPromise]);
        
            // if (result === 'timeout') {
            //     console.log(`watchVidPromise was pending for ${timeout/1000} seconds so closing it..`)
            //     await browser_utils.closeTab(tab.targetId)
            //     continue;
            // }
        }
        // Sending logs to QP
        let timeSpentInLogging = new Date().getTime() - startTime
        for (let action of actions) {
            await logs_utils.add_job_logs('YOUTUBE_VIEW', JSON.stringify({'job': action}), session_id);
        }
        console.log(`Logging took ${timeSpentInLogging / 1000} seconds for the batch of ${tabs.length} videos.`);
        console.log(`${tabs.length} videos were at least running for ${initialDelay = (new Date().getTime() - startTime) / 1000}`)
        resolve(actions)
    });
}

const requestPausedHandler = session => async ({ requestId, request, resourceType, responseHeaders, responseStatusCode, redirectedRequestId}) => {
    if (responseStatusCode) {
        /**
         * Response interception:
         * Intercepts the responses where the request was continued with interceptResponse=True. Those
         * are the responses from the requests that need to be behind the proxy and this is place where
         * we are calculating the amount of bytes consumed by each request through the proxy.
         **/
        const { TextEncoder } = require('text-encoding');
        try {
            if (responseHeaders &&  !redirectedRequestId) {
                const encoder = new TextEncoder();
                const resBody = await session.Fetch.getResponseBody({requestId})
                const sizeInBytes = encoder.encode(resBody.body).length;
                // TODO: Make an API call to logs bandwidth at some point.
                // console.log(`[bandwidth] URL: ${request.url.slice(0, 40)}... size: ${sizeInBytes}`)
            }
            await session.Fetch.continueResponse({requestId: requestId})
        } catch(error) {
            console.log("Error during bandwidth calculations: ", request.url, resourceType, responseHeaders, responseStatusCode, redirectedRequestId)
        }
    } else {
        /**
         * Request interception:
         * Important: Proxy settings are activated on browser-level.
         * Fullfils requests that need to be sent directly (i.e. without proxy) by modifying their headers to eliminate proxy settings from there.
         * Continue with the requests in browser as is, that need to be sent with the proxy. Additionally, set `interceptResponse` so that we have
         * the ability to measure the bandwidth used behind the proxy.
         **/
        let action = await requestInterceptor(request, resourceType.toLowerCase())
        if (action == 'abort') {
            try {
                await session.Fetch.failRequest({requestId: requestId, errorReason: 'Aborted'})
            } catch(error) {
                console.log("Error during abort request intercetption: ", error)
            }
        } else if(action == 'direct') {
            try {
                const response = await fetch(request.url,  {method: request.method, headers: request.headers, body: request.postData });
                const headers = Object.keys(response.headers).map(key => ({name: key, value: response.headers[key]}));
                const body = await response.text()
                await session.Fetch.fulfillRequest({
                    requestId: requestId,
                    responseCode: response.status,
                    responseHeaders: headers,
                    body: Buffer.from(body).toString('base64')
                })
            } catch(error) {
                console.log("Error during direct request intercetption: ", error, request.url)
            }
        } else {
            // Continue request behind the proxy
            if (request.url == 'https://youtube.com/') {
                await session.Fetch.continueRequest({requestId: requestId});
            } else {
                await session.Fetch.continueRequest({
                    requestId: requestId,
                    interceptResponse: true
            });
            }
        }
    }
}

exports.strategy_youtube = async function (jobs, current_ip, session_id) {
    // Starting chrome
    let initialTime = new Date().getTime();
    let startTime = new Date().getTime();
    await browser_utils.launchChrome();
    browser_utils.run_shell_command("python3 ./behavior/start_browser.py");

    let client = await CDP({port: '9222'});
    let {Network, Target, Page} = client;
    await Promise.all([Network.enable(), Page.enable()]);

    console.log(`Starting chrome took ${(new Date().getTime() - startTime) / 1000} seconds.`);

    // Get a random desktop user agent
    startTime = new Date().getTime();
    let random_user_agent = browser_utils.getRandomUserAgent()
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
        await session.Runtime.enable()
        await session.Page.enable()
        await session.Fetch.enable({handleAuthRequests: true, RequestPattern: {urlPattern: '*'}})
        await session.Network.setUserAgentOverride({'userAgent': random_user_agent});
        await session.Network.setCacheDisabled({cacheDisabled: true});
        session.Fetch.requestPaused(requestPausedHandler(session));
        await browser_utils.loadPageInTab(youtube_target, session);

    }
    console.log(`Opening tabs took ${(new Date().getTime() - startTime) / 1000} seconds.`);
    
    // Try to watch videos for ~30s and close the client
    await playVideosInCurrentTabs(current_ip, session_id);
    // Prepare for new session
    startTime = new Date().getTime();
    await Network.clearBrowserCache();
    await Network.clearBrowserCookies();
    // try {
    //     await browser_utils.closeChromeWindows(client)
    // } catch(error) {
    //     console.log(`Closing chrome Error`, error);
    // }
    // console.log(`Closing chrome took ${(new Date().getTime() - startTime) / 1000} seconds.`);
    return new Promise(async (resolve, reject) => {
        totalDelay = (new Date().getTime() - initialTime) / 1000;
        console.log(`Total time took to complete ${jobs.length} videos job: ${totalDelay}`)
        resolve()
    });
};

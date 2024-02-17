const strategy_google = require("../strategy_google.js");
const ss_model = require("../search_session");
const browser_utils = require("../cdp/browser_utils");
const logs_utils = require("../cdp/logs_util");
const celery = require('celery-node');
const CDP = require('chrome-remote-interface');
const utils = require("../utils.js");
const dotenv = require('dotenv');


let lastActivity = Date.now();
let currentPageUrl = '';

// Background watcher function
async function startBackgroundURLWatcher(client) {
    console.log('[startBackgroundURLWatcher] Starting background watcher...');
    setInterval(async () => {
        try {
            const { Page } = client;
            await Page.enable()
            const newPageUrl = await browser_utils.getCurrentURLOfPage(Page);

            // Check if the page URL has changed
            if (newPageUrl !== currentPageUrl) {
                currentPageUrl = newPageUrl;
                lastActivity = Date.now();
            } else {
                // If the page hasn't changed for more than 60 seconds, reload the page
                if (Date.now() - lastActivity > 120000) {
                    console.log('Page inactive for 120 seconds, exiting...');
                    // await Page.reload();
//                    lastActivity = Date.now();
                      process.exit();
                }
            }
        } catch (error) {
            console.error('Error in background watcher:', error);
            // await client.Page.enable()
            // await client.Page.reload();
            process.exit();
        }
    }, 3000); // Check every three seconds
}

const run = async function() {
    let error_actions = null;
    let has_captcha_encountered = false;
    try {
        startTime = new Date().getTime();
        browser_utils.run_shell_command("python3 ./behavior/browser_start_proxy_already_active.py");
        console.log(`Connecting to proxy took ${(new Date().getTime() - startTime) / 1000} seconds.`);
        const client = await CDP({port: '9222'});
    //    startBackgroundURLWatcher(client);
        let {Network, Page, DOM, Emulation, Browser} = client;
        await Promise.all([Page.enable(), Network.enable(), DOM.enable()]);

        // Initialize the Redis client and start QP session logs
        let redis_client = await browser_utils.get_redis_client(process.env.CELERY_BROKER_URL)

        let job_count = 0;
        let current_ip = null
        global.proxyUrl = process.env.HTTP_PROXY
        current_ip = await browser_utils.getProxyIpAddress()
        global.ip = current_ip
        while (job_count < 1) {
            let bd_job = await logs_utils.get_job()
            let job = ss_model.newSearchSession({
                job_id: bd_job.id,
                keyword: bd_job.keyword,
                top_ads: bd_job.number_of_ads_to_click,
                paid_blocklist: bd_job.adwords_domain_blocklist,
                actions: bd_job.actions,
                organic_target: bd_job.organic_target_domain,
                organic_max_page: 1,
                num: bd_job.max_organic_page_results,
                max_organic_serp_position_click_limit: bd_job.max_organic_serp_position_click_limit,
                organic_target_wait_seconds: utils.randomIntFromInterval(70, 90),
                chance_to_open_competitor: 0.3,
                should_pogo_click: bd_job.should_enable_pogo,
                location: bd_job.location
            })
            try {
                if (job.fields.keyword) {
                    job_count++;
                    await strategy_google.strategy_google(job, null, true);
                }

                console.log('job_count:', job_count);
                await Network.clearBrowserCache();
                await Network.clearBrowserCookies();

            } catch (error) {
                console.error('An error occurred:', error);
                error_actions = [
                    {
                        "keyword": job.fields.keyword,
                        "current_url": await browser_utils.getCurrentURLOfPage(Page),
                        "current_ip": current_ip,
                        "code": "error",
                        "message": error.message,
                        "tag": process.env.TAG,
                        "random_user_agent": global.random_user_agent
                    }
                ]

                // Push IP rotated action if it was rotated successfully on captcha encounter.
                has_captcha_encountered = error instanceof browser_utils.RecaptchaEncountered;
                if (has_captcha_encountered && error.hasIPRotated) {
                    // Update to newly assigned IP address
                    const currentIP = await browser_utils.getProxyIpAddress();
                    // Record log about IP being rotated.
                    error_actions.push(
                        {
                            "keyword": keyword,
                            "current_url": process.env.HTTPS_PROXY,
                            "current_ip": currentIP,
                            "code": "ip_rotated",
                            "tag": process.env.TAG,
                            "random_user_agent": global.random_user_agent
                        }
                    );
                }

                await Network.clearBrowserCache();
                await Network.clearBrowserCookies();
            }
            let actions = await redis_client.get(String(job.fields.job_id));
            if (error_actions) {
                if (!Array.isArray(actions)) {
                    actions = [];
                }
                actions = actions.concat(error_actions);
                await logs_utils.mark_job_as_failed(actions, job.fields.job_id, job.fields.screenshot_data, job.fields.html_content, job.fields.fingerprint);
                if (has_captcha_encountered) {
                    break;
                }
            } else {
                await logs_utils.mark_job_as_completed(actions, job.fields.job_id, job.fields.screenshot_data, job.fields.html_content, job.fields.fingerprint);
            }
        }
        await Browser.close()
    } catch (error) {
        console.log(error)
    }
};

if (require.main === module) {

    // If the module is being run directly, call the run() function.
    run().then(() => {
        process.exit();
    })
}

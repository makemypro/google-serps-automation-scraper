const strategy_google = require("../strategy_dr.js");
const ss_model = require("../search_session");
const browser_utils = require("../cdp/browser_utils");
const logs_utils = require("../cdp/logs_util");
const celery = require('celery-node');
const CDP = require('chrome-remote-interface');
const utils = require("../utils.js");
const dotenv = require('dotenv');
const { none, concat } = require("rambdax");


const run = async function() {
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
        while (job_count < 2) {
            let backlink_job = await logs_utils.get_backlink_job()
            let job = ss_model.newBacklinkSession({
                job_id: backlink_job.id,
                organic_target_wait_seconds: utils.randomIntFromInterval(120, 140),
                direct_url: backlink_job.direct_url,
                target_domain: backlink_job.target_domain

            })

            var error_action = null;

            try {
                if (job.fields.direct_url) {
                    await strategy_google.strategy_google(job, null, true);
                    job_count++;
                }

                console.log('job_count:', job_count);
                await Network.clearBrowserCache();
                await Network.clearBrowserCookies();

            } catch (error) {
                console.error('An error occurred:', error);
                error_action = {
                    "direct_url": job.fields.direct_url,
                    "current_url": await browser_utils.getCurrentURLOfPage(Page),
                    "current_ip": current_ip,
                    "code": "error",
                    "message": error.message,
                    "tag": process.env.TAG,
                    "random_user_agent": global.random_user_agent
                }
            }
            let actions = await redis_client.get(String(job.fields.job_id));
            if (error_action) {
                if (!Array.isArray(actions)) {
                    actions = [];
                }
              actions.push(error_action);
              await logs_utils.mark_backlink_job_as_failed(actions, job.fields.job_id, job.fields.screenshot_data, job.fields.html_content);
            } else {
                await logs_utils.mark_backlink_job_as_completed(actions, job.fields.job_id, job.fields.screenshot_data, job.fields.html_content);
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

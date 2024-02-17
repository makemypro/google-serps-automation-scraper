const strategy_youtube = require("../strategy_youtube_improved.js");
const ss_model = require("../search_session");
const utils = require("../utils.js");
const http = require('http');
const browser_utils = require("../cdp/browser_utils");
const logs_utils = require("../cdp/logs_util");
const celery = require('celery-node');


const getVideoBatches = function(videos) {
    const batches = [];
    let length = videos.length;
    let batchSize = parseInt(process.env.YT_VIDS_PER_TAB)
    for (let i = 0; i < length; i += batchSize) {
        let videosBatch = videos.slice(i, i + batchSize);
        console.log(videosBatch)
        batches.push(videosBatch.map(ytUrl => (
            ss_model.newSessionObj(ss_model.YoutubeSession, {"youtube_target": ytUrl})
        )));
    }
    return batches
}

const run = async function(jobs = jobs) {
    // 1) DONE - test that paid blocklist does prevent clicking on domain
    // 2) DONE - verify page action successful
    // 3) go to second page of Google
    // 4) DONE - log actions taken

    let cycle_ip_after_num_jobs = 6;
    let startTime = new Date().getTime();
    let job_count = 0;
    let celery_broker_url = process.env.CELERY_BROKER_URL

    browser_utils.run_shell_command("python3 ./behavior/open_a_new_browser_and_connect_proxy.py");
    console.log(`Connecting to proxy took ${(new Date().getTime() - startTime) / 1000} seconds.`);

    startTime = new Date().getTime();
    let current_ip = await browser_utils.getProxyIpAddress();
    console.log(`Obtaining IP address took ${(new Date().getTime() - startTime) / 1000} seconds.`);

    const session_id = await logs_utils.add_session_logs('STRATEGY_YOUTUBE')
    let batches = getVideoBatches(jobs);
    for (let videosBatch of batches) {
        try {
            // Starting YT strategy for a videos batch
            startTime = new Date().getTime();
            await strategy_youtube.strategy_youtube(videosBatch, current_ip, session_id);
            console.log(`[batch#${job_count}] YT strategy took ${(new Date().getTime() - startTime) / 1000} seconds for the batch of ${videosBatch.length} videos. `);
            job_count++;
        } catch (error) {
            console.error('An error occurred:', error);
        }

    };

    // start a new job
    const client = celery.createClient(celery_broker_url, celery_broker_url);
    console.log('Client Successfully connected with ', celery_broker_url);

    const task = client.createTask("app.tasks.add_job");
    console.log('Successfully created a task object');

    const result = await task.applyAsync([process.env.JOB_ID, process.env.JOB_NAME]);
    console.log('Task invoked for task ID: ', result.taskId);

    await utils.sleep(5000);
    return new Promise((resolve, reject) => {
        resolve(`Process completed with job ID: ${process.env.JOB_ID}`);
    })

};

if (require.main === module) {
    // If the module is being run directly, call the run() function.
    let jobs = JSON.parse(process.env.INPUT);
    run(jobs=eval(jobs)).then((res) => {
        console.log(res)
        process.exit();
    });

}
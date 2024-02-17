const strategy_youtube = require("../strategy_youtube_improved.js");
const ss_model = require("../search_session");
var http = require('http');
const browser_utils = require("../cdp/browser_utils");
const logs_utils = require("../cdp/logs_util");

var jobs = [
        'https://www.youtube.com/watch?v=36N0WGKyDYI', "https://www.youtube.com/watch?v=L08xD0RNQaA",
        "https://www.youtube.com/watch?v=Kuf1imRKAC8", "https://www.youtube.com/watch?v=7POg_so8qSI",
        "https://www.youtube.com/watch?v=v98YXLq5S5A", "https://www.youtube.com/watch?v=ig-2DgJwHWA",
        "https://www.youtube.com/watch?v=bz0oqHqydzc", "https://www.youtube.com/watch?v=MsjfFFZSEww",
        "https://www.youtube.com/watch?v=-z0L76v5LDc", "https://www.youtube.com/watch?v=RiARiu62BX4",
        "https://www.youtube.com/watch?v=zzIQq3ivisw", "https://www.youtube.com/watch?v=QUapmUwVn-Y",
        "https://www.youtube.com/watch?v=l14u2A3pbbk", "https://www.youtube.com/watch?v=ESuq8LN5jFs",
        "https://www.youtube.com/watch?v=3eeOJpNquas", "https://www.youtube.com/watch?v=AfMdcMlMz_Y",
        "https://www.youtube.com/watch?v=DF34Rgoghss", "https://www.youtube.com/watch?v=zGjeH0eHRGY",
        "https://www.youtube.com/watch?v=O1dKaFIVlmU", "https://www.youtube.com/watch?v=aCL9SmapEps",
        "https://www.youtube.com/watch?v=F3bod8qnqFw", "https://www.youtube.com/watch?v=lIYYhrFIlo0",
        "https://www.youtube.com/watch?v=xp1Np9CHgaM", "https://www.youtube.com/watch?v=piXFmmp_jEU",
        "https://www.youtube.com/watch?v=vLdM3-c7vXQ", "https://www.youtube.com/watch?v=M0BxqvsOMgE",
        "https://www.youtube.com/watch?v=TtHfbqT4sq0", "https://www.youtube.com/watch?v=ifxdxLOwH8o",
        "https://www.youtube.com/watch?v=dhOtf3380oE", "https://www.youtube.com/watch?v=S6AIcb35Ab4",
        "https://www.youtube.com/watch?v=-bCCKbrns30", "https://www.youtube.com/watch?v=JC4vhPfBX5E",
        "https://www.youtube.com/watch?v=0RuMrR8qOfc", "https://www.youtube.com/watch?v=cxGGO62Om6Y",
        "https://www.youtube.com/watch?v=RA74qbmLsrI", "https://www.youtube.com/watch?v=sxgMzxkV5O8",
        "https://www.youtube.com/watch?v=aZ_mmwPV60Y", "https://www.youtube.com/watch?v=RJrX7AH3HjY",
        "https://www.youtube.com/watch?v=mnyqMiSaek4", "https://www.youtube.com/watch?v=8e61kY_TLdo",
        "https://www.youtube.com/watch?v=C495N3aS5kw", "https://www.youtube.com/watch?v=24sPSEdh-V4",
        "https://www.youtube.com/watch?v=SYWM6xPk5VI", "https://www.youtube.com/watch?v=CEABTEQwvDk",
        "https://www.youtube.com/watch?v=Xk1iekFYl2s", "https://www.youtube.com/watch?v=S7pW6BTQ8M4",
        "https://www.youtube.com/watch?v=3ZcQdbi8qxs", "https://www.youtube.com/watch?v=4aD3vaLDcY8"
];

const getVideoBatches = function(videos) {
    const batches = [];
    let length = videos.length;
    let batchSize = 3
    for (let i = 0; i < length; i += batchSize) {
        let videosBatch = videos.slice(i, i + batchSize);
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

    browser_utils.run_shell_command("python3 ./behavior/open_a_new_browser_and_connect_proxy.py");
    console.log(`Connecting to proxy took ${(new Date().getTime() - startTime) / 1000} seconds.`);

    startTime = new Date().getTime();
    let current_ip = await browser_utils.getProxyIpAddress();
    console.log(`Obtaining IP address took ${(new Date().getTime() - startTime) / 1000} seconds.`);

    const session_id = await logs_utils.add_session_logs('STRATEGY_YOUTUBE')
    while (true) {
        let batches = getVideoBatches(jobs);
        for (let videosBatch of batches) {
            try {
                // Starting YT strategy for a videos batch
                startTime = new Date().getTime();
                const actions = await strategy_youtube.strategy_youtube(videosBatch, current_ip, session_id);
                console.log(`[batch#${job_count}] YT strategy took ${(new Date().getTime() - startTime) / 1000} seconds for the batch of ${videosBatch.length} videos. `);
                job_count++;

                // Try rotating IP address on every `cycle_ip_after_num_jobs` jobs
                if (job_count >= cycle_ip_after_num_jobs) {
                    startTime = new Date().getTime();
                    console.log('Try to cycle IP address. Previous IP:', current_ip);
                    if (!await browser_utils.cycleIp()) {
                        // Only wait and get your IP if its really rotated.
                        current_ip = await browser_utils.getProxyIpAddress();
                        console.log('New IP Address:', current_ip);
                    }
                    job_count = 0;
                    console.log(`Attempt to rotate IP took ${(new Date().getTime() - startTime) / 1000} seconds.`);
                }
            } catch (error) {
                console.error('An error occurred:', error);
            }
            
        };
    }
};

if (require.main === module) {
    // If the module is being run directly, call the run() function.
    run(jobs=jobs);
}
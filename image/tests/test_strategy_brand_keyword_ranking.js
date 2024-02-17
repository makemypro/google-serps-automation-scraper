const strategy_brand_keyword_ranking = require("../strategy_brand_keyword_ranking.js");
const ss_model = require("../search_session");
var http = require('http');
var ip = require('ip');
const R = require("rambdax");
const axios = require('axios');
const execSync = require("child_process").execSync;
const browser_utils = require("../cdp/browser_utils");
var cmd = require('node-cmd');
const logs_utils = require("../cdp/logs_util");
const utils = require("../utils");
const request = require('request');


var brand_keywords = [
    'backlink checker',
    'linkgraph backlink checker',
    'best backlink analysis checker',
    'free seo audit',
    'linkgraph free seo audit',
    'best free seo site audit'
]

var jobs = brand_keywords.map(kw => {
  return ss_model.newSearchSession({
    keyword: kw,
    organic_target: "linkgraph.com",
    organic_target_wait_seconds: utils.randomIntFromInterval(30, 60),
    organic_max_page: 10,
    chance_to_open_competitor: 0.3
  });
});


async function cycle_ip(){
    url = 'https://dashboard.iproyal.com/api/4g-mobile-proxies/rotate-ip/jgRA81sSKc';
    return new Promise((resolve, reject) => {
        request.get(url, function (error, httpResponse, body) {
          if (error) throw new Error(error);
          console.log("Get Body Response", body)
          resolve(true)
        });
    });
};

function run_shell_command(command){
    const result = execSync(command);
    // convert and show the output.
    console.log(result.toString("utf8"));
}


const run = async function(jobs = jobs) {
    let redis_client = await browser_utils.get_redis_client()

    let cycle_ip_after_num_jobs = 6;
    var job_count = 0;
    var session_id = await logs_utils.add_session_logs('STRATEGY_BRAND_KEYWORD_RANKING');

    let client = await browser_utils.startChrome();
    let {Network, Page, DOM, Runtime} = client;
    await Promise.all([Page.enable(), Network.enable(), DOM.enable()]);

    while (true) {
        for (let job of jobs) {
            var error_action = null;
            try {
                let beforeJobIP = await browser_utils.getProxyIpAddress();
                let result = await strategy_brand_keyword_ranking.strategy_brand_keyword_ranking(job, null, true, session_id);
                console.log(session_id);
                job_count++;
                console.log('job_count:', job_count);


                // If IP was cycled by some other session, just clear the cache and cookies
                let afterJobIP = await browser_utils.getProxyIpAddress();
                if (beforeJobIP !== afterJobIP) {
                    await Network.clearBrowserCache();
                    await Network.clearBrowserCookies();
                    continue;
                }

                if (job_count >= cycle_ip_after_num_jobs) {
                    console.log('Cycle IP triggered');
                    console.log('Cycling IP...Previous IP:', afterJobIP);
                    await cycle_ip();
                    await R.delay(60000);
                    current_ip = await browser_utils.getProxyIpAddress();
                    console.log('New IP:', current_ip);
                    job_count = 0;

                    await Network.clearBrowserCache();
                    await Network.clearBrowserCookies();
                }
            } catch (error) {
                console.error('An error occurred:', error);
                error_action = {
                    "keyword": job.fields.keyword,
                    "current_url": await browser_utils.getCurrentURLOfPage(Page),
                    "current_ip": await browser_utils.getProxyIpAddress(),
                    "code": "error",
                    "message": error
                }
            }
            let actions = await redis_client.get(session_id);
            if (error_action) {
                actions.push(error_action);
            }
            await logs_utils.add_job_logs('JUST_SEARCH', actions, session_id);
        }
    }
};

if (require.main === module) {
  // If the module is being run directly, call the run() function.
  run(jobs=jobs);
}
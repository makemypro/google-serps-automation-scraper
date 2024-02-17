const strategy_google = require("../strategy_google.js");
const ss_model = require("../search_session");
var http = require('http');
var ip = require('ip');
const R = require("rambdax");
const axios = require('axios');
const execSync = require("child_process").execSync;
const browser_utils = require("../cdp/browser_utils");
var cmd = require('node-cmd');


var jobs = [
    ss_model.newSearchSession({
    "keyword": "link building agency",
    "top_ads": 3,
    "paid_blocklist": "linkgraph.io",
    "organic_target": "linkgraph.io",
        "organic_target_wait_seconds": 60,
        "organic_max_page": 2,
    }),
    ss_model.newSearchSession({
    "keyword": "linkgraph",
    "top_ads": 3,
    "paid_blocklist": "linkgraph.io",
    "organic_target": "linkgraph.io",
        "organic_target_wait_seconds": 60,
        "organic_max_page": 2,
    }),
    ss_model.newSearchSession({
    "keyword": "free seo audit",
    "top_ads": 3,
    "paid_blocklist": "linkgraph.io",
    "organic_target": "linkgraph.io",
        "organic_target_wait_seconds": 60,
        "organic_max_page": 2,
    }),
    ss_model.newSearchSession({
    "keyword": "link building services",
    "top_ads": 3,
    "paid_blocklist": "linkgraph.io",
    "organic_target": "linkgraph.io",
        "organic_target_wait_seconds": 60,
        "organic_max_page": 2,
    })
    ];


function get_current_ip(){
    console.log('Getting IP address....');
    var ip_address = ip.address(); // my ip address
    console.log('Current IP address:', ip_address);
    return ip_address;
};

function cycle_ip(modem_index){
    let proxy_ip = "192.168.1.107";
    let url = 'http://' + proxy_ip + '/api/rotate?index=' + modem_index;
    console.log('Cycling IP... Hitting url', url);
    var token = "7e900b9e6e0d93df5fc975009937d0f1f92d5658";

    axios.get(url, {headers: {Authorization:  'Token ' + token}}).then(
        res => {
                console.log(`statusCode: ${res.status}`);
                console.log(res);
            })
            .catch(error => {
                console.error(error);
            });
};

function run_shell_command(command){
    const result = execSync(command);
    // convert and show the output.
    console.log(result.toString("utf8"));
}

async function cycle_browsers(){
    await strategy_google.navigateToDummy();
    run_shell_command('wmctrl -c "Youtube"');
    run_shell_command("python3 ../behavior/browser_start_proxy_already_active.py");
}


const run = async function(jobs = jobs) {
    // 1) DONE - test that paid blocklist does prevent clicking on domain
    // 2) DONE - verify page action successful
    // 3) go to second page of Google
    // 4) DONE - log actions taken

    // let current_ip = get_current_ip();
    let modem_index = 42;

    let max_target_domain_count = 3;
    let cycle_ip_after_num_jobs = 3;
    var job_count = 0;

    let new_ip = null;
    var current_ip = get_current_ip();

    for (let job of jobs){
        let result = await strategy_google.strategy_google(job);

        job_count++;
        console.log('job_count:', job_count);
    }

    if (job_count >= cycle_ip_after_num_jobs){
        console.log('Cycling IP...Previous IP:', current_ip);

        await strategy_google.navigateToDummy();
        cycle_ip(modem_index);
        await R.delay(60000);
        run_shell_command('wmctrl -c "Youtube"');
        await R.delay(1000);
        // cycle_browsers();
        run_shell_command("python3 ../behavior/browser_start_proxy_already_active.py");

        console.log('will sleep for 60 seconds...');

        current_ip = get_current_ip();
        console.log('New IP:', current_ip);
        job_count = 0;
    }
};

if (require.main === module) {
  // If the module is being run directly, call the run() function.
  run(jobs=jobs);
}

// 172.58.78.129
// 172.58.78.187
//75.56
//75.107
//78.187

//
// const run2 = async ()  => {
//         let modem_index = 42;
//             await strategy_google.navigateToDummy();
//             cycle_ip(modem_index);
//             //await browser_utils.closeChromeWindow();
//             cycle_browsers();
//
//             console.log('will sleep for a while seconds...');
//             await R.delay(20000);
//             var current_ip = get_current_ip();
//             console.log('New IP:', current_ip);
// };
// run2();
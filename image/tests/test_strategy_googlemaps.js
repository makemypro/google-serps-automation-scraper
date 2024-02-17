const strategy = require("../strategy_googlemaps.js");
const ss_model = require("../search_session");
const browser_utils = require("../cdp/browser_utils");
const logs_utils = require("../cdp/logs_util");
const CDP = require('chrome-remote-interface');


function get_data_from_map(googleMapsUrl){
        try {
        // Regular expression pattern to extract latitude, longitude, and place name
        var pattern = /@([-+]?\d+\.\d+),([-+]?\d+\.\d+),/;
        var place_id_pattern = /!1s([^!]+)/
    
        // Use regex to extract latitude and longitude
        var match = googleMapsUrl.match(pattern);
    
        if (match) {
          var latLong = [match[1], match[2]];
    
        } else {
          console.log("Latitude and longitude not found in the URL.");
        }
    
        // Extract the place name from the URL
        var placeName = googleMapsUrl.split('/').pop().split('@')[0].replace(/\+/g, ' ');
        var place_id = place_id_pattern.exec(placeName);
        console.log("Place coords:", latLong);
        console.log("Place ID:", place_id);
    
        return [latLong, place_id[0]]
        }
        catch (error) {
        console.log("Error to get the coordinates and place id", error);
        return false
        }
    }

const run = async function() {
    // 1) DONE - test that paid blocklist does prevent clicking on domain
    // 2) DONE - verify page action successful
    // 3) go to second page of Google
    // 4) DONE - log actions taken

    // let current_ip = get_current_ip();
    // let modem_index = 42;

    // let max_target_domain_count = 3;
    try {
        var actions = []
        startTime = new Date().getTime();
        browser_utils.run_shell_command("python3 ./behavior/browser_start_proxy_already_active.py");
        console.log(`Connecting to proxy took ${(new Date().getTime() - startTime) / 1000} seconds.`);

        const client = await CDP({port: '9222'});
        let {Network, Page, DOM, Emulation, Browser} = client;
        await Promise.all([Page.enable(), Network.enable(), DOM.enable()]);

        // Initialize the Redis client and start QP session logs
        let redis_client = await browser_utils.get_redis_client(process.env.CELERY_BROKER_URL)
        let current_ip = null
        global.proxyUrl = process.env.HTTP_PROXY
        var job_count = 0;
        current_ip = await browser_utils.getProxyIpAddress()
        global.ip = current_ip

        while (job_count < 1) {
            let ppc_job = await logs_utils.get_gmb_job()
            console.log("Job count", ppc_job);
            let job =  ss_model.newSessionObj(ss_model.GoogleMapsSession, {
                keyword: ppc_job.keyword,
                coords: ppc_job.coords,
                target_id: ppc_job.place_id,
                actions: ppc_job.actions,
                job_id: ppc_job.id,
                zoom: ppc_job.zoom
            })
            if (!ppc_job.keyword) {
                await Browser.close();
                return
            }
            var error_action = null;
            try {
                await strategy.strategy_googlemaps(job);
                job_count++;

                console.log('job_count:', job_count);

            } catch (error) {
                console.error('An error occurred:', error);
                error_action = {
                    "keyword": job.fields.keyword,
                    "current_url": await browser_utils.getCurrentURLOfPage(Page),
                    "current_ip": current_ip,
                    "code": "error",
                    "message": error.message,
                    "tag": process.env.TAG
                }
            }
           let actions = await redis_client.get(String(job.fields.job_id));
            if (error_action) {
                if (!Array.isArray(actions)) {
                    actions = [];
                    }
                actions.push(error_action);
                await logs_utils.mark_gmb_job_as_failed(actions, job.fields.job_id, job.fields.screenshot_data, job.fields.html_content);
                }
           await logs_utils.mark_gmb_job_as_completed(actions, job.fields.job_id, job.fields.screenshot_data, job.fields.html_content);
           await Browser.close();
           }
    } catch (error) {
        console.log("error", error);
    }
};

if (require.main === module) {
  // If the module is being run directly, call the run() function.
  run().then(() => {
    process.exit();
})
}
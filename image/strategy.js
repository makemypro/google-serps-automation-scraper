const utils = require('./utils');
const CDP = require('chrome-remote-interface');
const chromeLauncher = require('chrome-launcher');
const coordinates = require('./cdp/coords');
const fs = require('fs');
const strategy_google = require('./strategy_google');
const strategy_youtube = require('./strategy_youtube');
const strategy_googlemaps = require('./strategy_googlemaps');
const redis = require('redis');
//const strategy_view_website = require('./strategy_view_website');

var PPC_CLICKS = "PPC_CLICKS";
var JUST_SEARCH = "JUST_SEARCH";
var VIEW_WEBSITE = "VIEW_WEBSITE";
var ORGANIC_CLICKS = "ORGANIC_CLICKS";
var YOUTUBE_VIEW = "YOUTUBE_VIEW";
var BRAND_DEFENSE = "BRAND_DEFENSE";
var GOOGLEMAPS = "GOOGLEMAPS";

var STRATEGY_GOOGLE = "STRATEGY_GOOGLE";
var STRATEGY_YOUTUBE = "STRATEGY_YOUTUBE";
var STRATEGY_GOOGLEMAPS = "STRATEGY_GOOGLEMAPS";
//var STRATEGY_VIEW_WEBSITE = "STRATEGY_VIEW_WEBSITE";

var type_to_strategy = {};
type_to_strategy[PPC_CLICKS] = STRATEGY_GOOGLE;
type_to_strategy[JUST_SEARCH] = STRATEGY_GOOGLE;
//type_to_strategy[VIEW_WEBSITE] = STRATEGY_VIEW_WEBSITE;
type_to_strategy[ORGANIC_CLICKS] = STRATEGY_GOOGLE;
type_to_strategy[YOUTUBE_VIEW] = STRATEGY_YOUTUBE;
type_to_strategy[BRAND_DEFENSE] = STRATEGY_GOOGLE;
type_to_strategy[GOOGLEMAPS] = STRATEGY_GOOGLEMAPS;


// Initiate and start Redis client
const redisClient = redis.createClient({
    socket: {
        host: 'redis',
        port: '6379'
    },
    password: 'eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81'
});
redisClient.on('error', (err) => {
  console.error(err);
});


var surf_session = [
//    {type: PPC_CLICKS},
    {type: JUST_SEARCH},
//    {type: VIEW_WEBSITE},
//    {type: ORGANIC_CLICKS},
//    {type: YOUTUBE_VIEW},
//    {type: BRAND_DEFENSE},
];


var jobs_by_type = {};
function load_jobs_from_jsondata(){
    let rawdata = fs.readFileSync('jsondata.json');
    let jobs = JSON.parse(rawdata);
    for (let job of jobs){
        console.log("loading job - job type:", job["type"]);
        if (jobs_by_type[job["type"]]){
            jobs_by_type[job["type"]].push(job);
        } else {
            jobs_by_type[job["type"]] = [job];
        }
    }
    console.log("jobs:", jobs);
    console.log("jobs_by_type:", jobs_by_type);
}



function get_strategy_for_type(type){
    var strategy_to_method = {};
    strategy_to_method[STRATEGY_GOOGLE] = strategy_google.strategy_google;
//    strategy_to_method[STRATEGY_VIEW_WEBSITE] = strategy_view_website.strategy_view_website;
    strategy_to_method[STRATEGY_YOUTUBE] = strategy_youtube.strategy_youtube;
    strategy_to_method[STRATEGY_GOOGLEMAPS] = strategy_googlemaps.strategy_googlemaps;
    // console.log("type:", type);
    // console.log("type_to_strategy:", type_to_strategy);
    // console.log("type_to_strategy[type]",type_to_strategy[type]);
    return strategy_to_method[type_to_strategy[type]];
}

function get_available_job_of_strategy_type(type){
    // Randomly selects an available job for the strategy type
    var available_jobs = jobs_by_type[type];
    if (!available_jobs){
        console.warn("No available jobs for type: ", type);
    } else {
        console.log("found ", available_jobs.length, "available_jobs");
    }
    return available_jobs;
}


exports.run_instructions = async function(redisClient){
    load_jobs_from_jsondata();

    for (let instruction of surf_session){
        var instruction_type = instruction["type"];
        var strategy_function = get_strategy_for_type(instruction_type);
        var jobs = get_available_job_of_strategy_type(instruction_type);
        for (let job of jobs){
            console.log('job', job)
            var result = await strategy_function(job);
            await cache_result(job.fields.keyword, result);
        }
    }
};

(async () => {
    try {
        await exports.run_instructions(redisClient);
        redisClient.quit();
    } catch (e) {
        // Deal with the fact the chain failed
    }
    // `text` is not available here
})();

async function cache_result(key, data) {
  try {
    const jsonData = JSON.parse(JSON.stringify(data));
    const result = await redisClient.set(key, JSON.stringify(jsonData));
    console.log('Cached result for key', key);
  } catch (error) {
    console.error('Error caching result', error);
  }
}



// What things do we want to click on in the page?
// Google Search Library
// 1) Paid Results by Domain, Position, Multiple Results in same session
// 2) Organic results by Domain, URL, Position,  Results in same session

// Youtube Library
// 1) Youtube Video Play Button
// 2)

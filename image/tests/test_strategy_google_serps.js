const strategy_google_serps = require("../strategy_google_serps.js");
const ss_model = require("../search_session");
var http = require('http');
var ip = require('ip');
const R = require("rambdax");
const axios = require('axios');
const execSync = require("child_process").execSync;
const browser_utils = require("../cdp/browser_utils");
var cmd = require('node-cmd');
const redis = require('redis');
const parse_html = require('./parse_html');
const logs_utils = require("../cdp/logs_util");


var jobs = [
    'seo tool', 'tool seo', 'free seo tool', 'seo small tool', 'small seo tool', 'free tool for seo', 'seo tool for free',
    'small tool seo', 'best seo tool', 'best tool for seo', 'seo best tool', 'seo ranking tool', 'seo tool best', 'seo keywords tool',
    'seo rank tool', 'keyword research seo tool', 'keyword research tool for seo', 'keyword research tool in seo', 'keyword tool for seo',
    'keyword tool seo', 'seo keyword research tool', 'seo keyword tool', 'seo keywords research tool', 'seo ranker tool', 'seo tool for keyword research',
    'seo tool keywords', 'google seo tool', 'keyword research tool seo', 'online seo tool', 'seo online tool', 'seo rank checker tool', 'seo rank checking tool',
    'seo tool online', 'seo tool rank checker', 'competitive seo analysis tool', 'google tool for seo', 'google tool seo', 'seo audit tool', 'seo competitive analysis tool',
    'seo competitor analysis tool', 'seo competitors analysis tool', 'seo google tool', 'seo ranking checker tool', 'seo software tool', 'seo tool report', 'seo tool software',
    'tool for seo audit', 'best free seo tool', 'best seo tool free', 'competitive analysis seo tool', 'ranking tool seo', 'seo analysis tool', 'seo analytics tool',
    'seo analyzer tool', 'seo auditing tool', 'seo monitor tool', 'seo optimization tool', 'seo optimize tool', 'seo optimizer tool', 'seo reports tool', 'seo tool analysis',
    'seo tool analyzer', 'seo tool for website', 'seo tool for youtube', 'seo tool rank', 'seo tool youtube', 'seo tracking tool', 'seo website tool', 'seo youtube tool',
    'tool seo youtube', 'website seo tool', 'youtube seo tool', 'competitor analysis seo tool', 'competitor analysis tool seo', 'free seo keyword tool', 'seo agency tool',
    'seo rank tracker tool', 'seo rank tracking tool', 'seo review tool', 'seo tool reviews', 'seo tool website', 'tool for seo analysis', 'top seo tool',
    'what are seo tool', 'what is a seo tool', 'what is an seo tool', 'what is seo tool', 'enterprise seo tool', 'free keyword tool for seo', 'free keyword tool seo',
    'free seo keywords tool', 'keyword tool seo free', 'local seo tool', 'seo check tool', 'seo checker tool', 'seo checking tool', 'seo checkup tool',
    'seo free keyword tool', 'seo keyword tool free', 'seo keywords tool free', 'seo management tool', 'seo report tool', 'seo reporting tool',
    'seo tool check', 'seo tool check up', 'seo tool checker', 'seo tool checkup', 'seo tool for agencies', 'seo tool review', 'web seo tool',
    'best seo report tool', 'best seo reporting tool', 'etsy seo tool', 'free keyword research tool for seo', 'free online seo tool', 'free seo audit tool',
    'free seo keyword research tool', 'free seo tool online', 'group buy seo tool', 'keyword analysis tool for seo', 'keyword ranking seo tool', 'keyword seo tool',
    'moz seo tool', 'on page seo tool', 'online seo tool free', 'onpage seo tool', 'seo audit free tool', 'seo audit tool free', 'seo enterprise tool', 'seo etsy tool', 'seo group buy tool',
    'seo keyword analysis tool', 'seo keyword research free tool', 'seo keyword research tool free', 'seo keyword tracker tool', 'seo keyword tracking tool',
    'seo manager tool', 'seo research tool', 'seo search tool', 'seo tool free online', 'seo tool group buy', 'seo tool online free', 'white label seo tool',
    'backlink seo tool', 'backlink tool seo', 'best seo audit tool', 'free seo auditing tool', 'google seo tool free', 'keywords for seo tool', 'pro seo tool',
    'seo backlink tool', 'seo backlinks tool', 'seo keyword rank tool', 'seo keyword ranking tool', 'seo keywords ranking tool', 'seo marketing tool', 'seo on page tool',
    'seo tool chrome', 'seo tool for chrome', 'serp seo tool', 'serps seo tool', 'website analysis tool seo', 'website seo analysis tool', 'website seo analyzer tool',
    'agency seo tool', 'automated seo tool', 'automatic seo tool', 'backlinks seo tool', 'free google seo tool', 'free seo analysis tool', 'free seo google tool', 'free seo online tool',
    'free seo rank tool', 'free seo ranking tool', 'free website seo tool', 'keyword search tool seo', 'keywords seo tool', 'marketing seo tool', 'moz tool for seo', 'plagiarism seo tool',
    'plagiarism tool seo', 'rank tracker seo tool', 'seo analysis free tool', 'seo analysis tool for website', 'seo analysis tool free', 'seo analyzer free tool', 'seo analyzer tool free',
    'seo automation tool', 'seo keyword search tool', 'seo keywords search tool', 'seo monitoring tool', 'seo plagiarism tool', 'seo rank tool free', 'seo ranking tool free', 'seo serp tool',
    'seo tool analysis free', 'seo tool backlink', 'seo tool backlinks', 'seo tool for plagiarism', 'seo tool for website analysis', 'seo tool google', 'seo tool plagiarism', 'seo tool web',
    'seo tool website analysis', 'seo website analysis tool', 'technical seo tool', 'website analysis seo tool', 'website analysis tool for seo', 'website analyzer tool seo', 'ahrefs seo tool',
    'amazon seo tool', 'backlink checker seo tool', 'best keyword tool for seo', 'best local seo tool', 'best seo keyword tool', 'cheap seo tool', 'cheapest seo tool', 'dao tao seo tool', 'excel seo tool',
    'free seo analyzer tool', 'free seo tool download', 'google analytics seo tool', 'google keyword tool for seo', 'google keyword tool seo', 'google keywords tool for seo', 'google seo keyword tool',
    'google seo keywords tool', 'href seo tool', 'keyword suggestion tool for seo', 'seo backlink checker tool', 'seo checker free tool', 'seo checker tool free', 'seo competitor analysis tool free', 'seo forecasting tool',
    'seo free analysis tool', 'seo google keyword tool', 'seo keyword rank checker tool', 'seo keyword ranking checker tool', 'seo keyword suggestion tool', 'seo keyword tool google', 'seo keywords tool google',
    'seo link building tool', 'seo measurement tool', 'seo page rank tool', 'seo page ranking tool', 'seo test tool', 'seo testing tool', 'seo tool backlink checker',
    'seo tool download free', 'seo tool excel', 'seo tool for plagiarism check', 'seo tool free download', 'seo tool google analytics', 'seo tool kits',
    'seo tool list', 'seo tool meaning', 'seo tool moz', 'seo tool rank tracker', 'seo website audit tool', 'simple seo tool', 'website seo audit tool',
    'best free seo analysis tool', 'best seo analysis tool free', 'best seo keywords tool', 'best seo ranking tool', 'competitive seo tool', 'free seo check tool',
    'free seo checker tool', 'google seo ranking tool', 'online seo analyzer tool', 'page rank seo tool', 'professional seo tool', 'seo analysis online tool',
    'seo audit report tool', 'seo check tool free', 'seo competitor tool', 'seo competitors tool', 'seo firefox tool', 'seo keywords suggestion tool', 'seo online tool analysis',
    'seo pagerank tool', 'seo report generator tool', 'seo site tool', 'seo tool comparison', 'seo tool for firefox', 'seo tool free trial', 'seo tool mac', 'site seo tool',
    'technical seo audit tool', 'technical seo auditing tool', 'ahref seo tool', 'ai seo tool', 'best seo analysis tool', 'best seo analyzer tool',
    'best seo keyword research tool', 'best seo tool for small business', 'best tool for seo analysis', 'content seo tool', 'free seo report tool', 'free seo reporting tool',
    'mac seo tool', 'semrush seo tool', 'seo analysis tool online', 'seo analyzer tool online', 'seo comparison tool', 'seo excel tool', 'seo links tool', 'seo measure tool',
    'seo online analysis tool', 'seo optimizer tool free', 'seo plagiarism checker tool', 'seo report tool free', 'seo site audit tool', 'seo suggestion tool', 'seo technical audit tool',
    'seo tool for excel', 'seo tool for mac', 'seo tool for plagiarism checking', 'seo tool plagiarism check', 'seo tool plagiarism checker', 'seo tool semrush', 'seo tool wordpress',
    'white label seo analysis tool', 'white label seo audit tool', 'white label seo reporting tool', 'advanced seo tool', 'affordable seo tool', 'best keyword research tool for seo',
    'best online seo tool', 'best seo online tool', 'best seo tool for wordpress', 'best seo tool wordpress', 'best wordpress seo tool', 'blogger seo tool', 'chrome seo tool',
    'download seo tool', 'free seo keyword search tool', 'free seo research tool', 'moz free seo tool', 'onpage seo analysis tool', 'open source seo tool', 'paid seo tool',
    'seo benchmarking tool', 'seo blog tool', 'seo content analysis tool', 'seo content tool', 'seo content writing tool', 'seo onpage analysis tool', 'seo optimization tool free',
    'seo paid tool', 'seo ranking tool google', 'seo reporting tool for seo companies', 'seo reporting tool free', 'seo tool api', 'seo tool for blogger', 'seo tool for wordpress',
    'seo tool position checker', 'seo writing tool', 'the best seo tool', 'wix seo tool', 'all seo tool', 'best paid seo tool', 'best seo competitor analysis tool',
    'blackhat seo tool', 'firefox seo tool', 'free seo optimization tool', 'free seo tool for website', 'on page seo analysis tool', 'online seo analysis tool',
    'online seo keyword tool', 'online seo report tool', 'online seo reporting tool', 'rank checker seo tool', 'seo api tool', 'seo benchmark tool', 'seo book tool',
    'seo checking tool online', 'seo content optimization tool', 'seo crawl tool', 'seo crawler tool', 'seo keyword difficulty tool', 'seo keyword search tool free',
    'seo keywords tool online', 'seo link tool', 'seo optimization online tool', 'seo page analysis tool', 'seo page analyzer tool', 'seo position tool', 'seo spider tool', 'seo suggestions tool',
    'seo tool book', 'seo tool download', 'seo tool open source', 'seo tool spider', 'serp seo ranking tool', 'spider seo tool', 'best enterprise seo tool', 'blog seo tool',
    'ecommerce seo tool', 'free etsy seo tool', 'free keyword seo tool', 'free online seo analysis tool', 'free seo checkup tool', 'free seo search tool', 'free seo website analysis tool',
    'free website analysis tool seo', 'free website seo analysis tool', 'google ranking seo tool', 'google rankings seo tool', 'keyword density seo tool', 'keyword density tool seo',
    'keyword seo tool free', 'off page seo tool', 'on page seo check tool', 'on page seo checker tool', 'on page seo checking tool', 'onpage seo checker tool', 'plagiarism checker seo tool',
    'sem seo tool', 'seo audit tool online', 'seo chat tool', 'seo checker online tool', 'seo checker tool online', 'seo group tool', 'seo keyword checker tool', 'seo keyword position tool',
    'seo ninja tool', 'seo onpage checker tool', 'seo optimization tool online', 'seo page checker tool', 'seo sem tool', 'seo smart tool', 'seo tool agency', 'seo tool buy', 'seo tool center',
    'seo tool centre', 'seo tool check website', 'seo tool online check', 'seo tool to check website', 'seo tool website check', 'seo website checker tool', 'smart seo tool', 'tool check seo website',
    'tool seo book', 'website seo check tool', 'website seo checker tool', 'what is the best seo tool', 'auto seo tool', 'best free seo audit tool', 'best seo tool for agencies', 'buy seo tool',
    'crack seo tool', 'ebay seo tool', 'etsy seo keywords tool', 'free download seo tool', 'free keyword analysis tool seo', 'free seo competitor analysis tool',
    'free seo software tool', 'free seo tool for website analysis', 'keyword planner tool for seo', 'keyword planner tool seo', 'keyword tool seo book',
    'local seo audit tool', 'majestic seo tool', 'my seo tool', 'new seo tool', 'ninja seo tool', 'online seo check tool', 'online seo ranking tool',
    'pinterest seo tool', 'ranking checker tool for seo', 'raven seo tool', 'seo analysis tool online free', 'seo book keyword tool', 'seo evaluation tool',
    'seo keyword planner tool', 'seo keyword tool online', 'seo majestic tool', 'seo open source tool', 'seo project management tool', 'seo research tool free',
    'seo tool blog', 'seo tool group', 'seo tool link checker', 'seo tool professional', 'seo tool white label', 'seo webmaster tool', 'seo website check tool',
    'small seo plagiarism checker tool', 'small seo tool plagiarism checker', 'topic seo tool', 'website seo analysis tool free', 'youtube seo tool free',
    'ahrefs seo audit tool', 'alexa seo tool', 'all in one seo tool', 'best etsy seo tool', 'best seo tool for keyword ranking reports', 'complete seo tool',
    'conductor seo tool', 'free keyword search tool for seo', 'free local seo tool', 'free seo analytics tool', 'free seo ranking checker tool',
    'free seo tool for youtube', 'google webmaster tool seo', 'instagram seo tool', 'moz seo audit tool', 'seo ai tool', 'seo analysis website free tool',
    'seo metrics tool', 'seo moz keyword tool', 'seo ranking tool online', 'seo reporting tool online', 'seo scanning tool', 'seo score tool', 'seo scoring tool',
    'seo site analysis tool', 'seo small tool plagiarism', 'seo snippet tool', 'seo tool alexa', 'seo tool for managing clients', 'seo tool keyword density',
    'seo tool keyword generator', 'seo tool keyword ranking', 'seo tool vps', 'seo traffic tool', 'seo website analysis tool for free', 'site seo analysis tool',
    'small seo tool plagiarism', 'tool seo free', 'top 10 seo tool', 'ultimate seo tool', 'website seo analysis free tool', 'adobe seo tool', 'ahrefs seo keyword tool',
    'analytics seo tool', 'article rewriter seo tool', 'best free seo keyword tool', 'best seo optimization tool', 'best seo research tool', 'best seo tool 2019',
    'best seo tool for ecommerce', 'best seo tool for youtube', 'free domain seo analysis tool', 'free keyword suggestion tool for seo', 'free seo analysis tool online',
    'free seo keyword difficulty tool', 'free seo rank checker tool', 'free white label seo audit tool', 'google seo analysis tool', 'google seo keyword ranking tool',
    'how to use seo tool', 'moz free domain seo analysis tool', 'onpage seo tool online', 'paraphrasing tool seo', 'plagiarism checker small seo tool',
    'seo analyse tool', 'seo content audit tool', 'seo copywriting tool', 'seo diagnostic tool', 'seo improvement tool', 'seo keyword mapping tool',
    'seo keyword suggestion tool free', 'seo lead generation tool', 'seo master tool', 'seo on page audit tool', 'seo onpage audit tool', 'seo page audit tool',
    'seo preview tool', 'seo seo software tool', 'seo site check tool', 'seo small tool plagiarism checker', 'seo spy tool', 'seo tool check page rank',
    'seo tool chrome extension', 'seo tool hero', 'seo tool hubspot', 'seo tool köln', 'seo tool plugin', 'seo tool serp', 'seo word search tool', 'surfer seo tool',
    'alexa seo audit tool', 'amazon seo keyword tool', 'b2b seo tool', 'best all in one seo tool', 'best free website seo analysis tool', 'best seo analytics tool',
    'best seo tool for shopify', 'domain seo analysis tool', 'easy seo tool', 'etsy seo tool free', 'facebook seo tool', 'founds seo audit tool', 'free on page seo tool',
    'free onpage seo tool', 'free seo tool software', 'free seo website tool', 'free seo writing tool', 'free youtube seo tool', 'godaddy seo tool',
    'google seo keyword search tool', 'google seo test tool', 'google seo testing tool', 'google trends seo tool', 'gsa seo tool', 'hoth seo tool',
    'iis seo tool', 'image seo tool', 'local seo ranking tool', 'long tail seo tool', 'on page seo optimization tool', 'semantic seo tool', 'seo assessment tool',
    'seo backlink checker tool free', 'seo competitor analysis tool software', 'seo difficulty tool', 'seo grading tool', 'seo insights tool', 'seo keywords free tool',
    'seo optimisation tool', 'seo paraphrasing tool', 'seo ranking free tool', 'seo recommendations tool', 'seo rewrite tool', 'seo rewriter tool', 'seo scan tool',
    'seo seo ranking tool', 'seo site audit tool free', 'seo site checker tool', 'seo site checkup tool', 'seo title tool', 'seo tool 2015', 'seo tool app',
    'seo tool extension', 'seo tool hq', 'seo tool keyword density checker', 'seo tool paraphrasing', 'seo tool position', 'seo tool rewriter', 'seo tool test',
    'seo tool uk', 'seo tool yoast', 'seo website ranking tool', 'seo writing assistant tool', 'seo yoast tool', 'seoptimer seo crawl tool', 'serperator seo tool',
    'tool seo gratis', 'tool seo keyword', 'website seo ranking tool', 'which is best free seo tool', 'word seo tool', 'yandex seo keyword ranking tool', 'yoast seo tool',
    'yt seo tool', '1 seo tool', 'a href seo tool', 'add seo site tool', 'adwords keyword tool seo', 'adwords seo tool', 'alexa tool for seo', 'all in one seo audit tool',
    'all in one seo tool with competitor analysis', 'all in one seo tool with keyword monitoring', 'analysis seo tool', 'analytice seo tool', 'answer the public seo tool',
    'appsumo seo tool', 'audit seo tool', 'awr seo tool', 'barracuda seo tool', 'best black hat seo tool', 'best free seo checker tool', 'best free seo reporting tool',
    'best free seo tool for wordpress', 'best online seo analysis tool', 'best seo audit tool 2020', 'best seo automation tool', 'best seo backlink tool',
    'best seo checker tool', 'best seo keyword search tool', 'best seo site audit tool', 'best seo spider tool', 'best seo tool 2018', 'best seo tool for blogger',
    'best seo tool shopify', 'best tool for seo audit', 'best tool for youtube seo', 'best tool seo', 'best website seo analysis tool', 'best youtube seo tool', 'black hat seo tool',
    'blumentals rapid seo tool', 'bright local seo tool', 'build seo tool', 'cognitive seo keyword tool', 'cora seo tool', 'crawler seo tool', 'ebay seo keywords tool',
    'fiverr seo tool', 'found seo audit tool', 'foxy seo tool', 'frase seo tool', 'free on page seo analysis tool', 'free online seo audit tool', 'free seo assessment tool',
    'free seo audit report tool', 'free seo audit tool online', 'free seo comparison tool', 'free seo crawler tool', 'free seo grader tool', 'free seo monitoring tool',
    'free seo review tool', 'free seo score tool', 'free seo site analysis tool', 'free seo site audit tool', 'free seo site checkup tool', 'free seo spider tool', 'free seo test tool',
    'free seo testing tool', 'free seo tool for blogger', 'free seo tool for wordpress', 'free seo tool google', 'free seo tracking tool', 'free seo traffic tool',
    'free seo website audit tool', 'free tool for seo analysis', 'free tool for seo audit', 'free website seo evaluation tool', 'frog seo tool', 'good seo tool', 'google adwords keyword tool for seo',
    'google adwords seo tool', 'google chrome seo tool', 'google search console seo audit tool', 'google search console seo tool', 'google seo analyzer tool',
    'google seo audit tool', 'google seo keyword research tool', 'google seo search tool', 'google seo website health check tool', 'google suggest seo tool',
    'google trends seo checker tool', 'group seo tool', 'group seo tool buy', 'how to use seo tool semrush', 'is google analytics an seo tool', 'iweb seo tool',
    'jet seo tool', 'keyword research tool for seo free', 'keyword search seo tool', 'keyword search tool for seo', 'keyword suggestion tool de smal seo tools',
    'keyword suggestion tool for seo ppc', 'keywords suggestion tool de small seo tools', 'laravel seo tool', 'lighthouse seo tool', 'magento seo tool', 'moz pro seo tool',
    'mozilla seo tool', 'netpeak agency seo tool', 'online seo testing tool', 'onsite seo tool', 'panguin seo tool', 'paraphrase tool seo', 'paraphrasing seo tool', 'portent seo tool',
    'ranking seo tool', 'ranktools seo tool', 'real seo reporting tool', 'reliable seo audit tool', 'rewrite seo tool', 'schema seo tool', 'se seo tool', 'semrush seo audit tool',
    'seo audit and reporting tool', 'seo audit tool free online', 'seo book keyword suggestion tool', 'seo content analysis tool free', 'seo duplicate content tool',
    'seo ebay tool', 'seo etsy tool free', 'seo evaluation tool free', 'seo frog spider tool', 'seo generator tool free', 'seo google adwords keyword tool',
    'seo health check tool', 'seo indexer tool', 'seo keyword analyzer tool', 'seo keyword competition tool', 'seo keyword difficulty check tool',
    'seo keyword difficulty checker tool', 'seo keyword finder tool free', 'seo keyword free tool', 'seo keyword online tool', 'seo keyword volume tool',
    'seo link analysis tool', 'seo magic tool', 'seo magnifier paraphrasing tool', 'seo meta description tool', 'seo neil patel tool', 'seo niche finder tool',
    'seo notifications ranking tool', 'seo on page optimization tool', 'seo online optimization tool', 'seo optimizer free tool', 'seo plan tool', 'seo pro tool',
    'seo proposal tool', 'seo quake tool', 'seo readability tool', 'seo rewriting tool', 'seo site analyzer tool', 'seo site audit free tool', 'seo site checkup free tool',
    'seo site checkup sitemap tool', 'seo site rating tool', 'seo spider tool online', 'seo submission tool', 'seo test tool google', 'seo title optimization tool',
    'seo tool 2019', 'seo tool density', 'seo tool duplicate content', 'seo tool for keyword ranking', 'seo tool for my website', 'seo tool kostenlos', 'seo tool lab',
    'seo tool nulled', 'seo tool package', 'seo tool php script', 'seo tool screaming frog', 'seo tool site', 'seo tool torrent', 'seo tools centre paraphrasing tool',
    'seo track keyword tool', 'seo website comparison tool', 'seo word ranking tool', 'seo word tool', 'seo workers analysis tool', 'side by side seo comparison tool',
    'site seo audit tool', 'small seo tool ranking checker', 'software seo tool', 'solid seo tool', 'stat seo tool', 'tag seo keyword tool', 'tool seo video youtube',
    'tool seo web', 'tool to check seo ranking', 'twitter seo tool', 'varvy seo tool', 'website review seo tool', 'website seo evaluation tool', 'website seo review tool',
    'what is the best keyword research tool for seo', 'what is webmaster tool in seo', 'which is the best free seo tool', 'which seo tool is best', 'wildshark seo spider tool download',
    'wordpress seo audit tool', 'xenu seo tool', 'yoast seo online tool', 'youtube keyword research tool for video seo', 'youtube seo keyword tool', 'youtube seo optimization tool'
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
    await strategy_google_serps.navigateToDummy();
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
    let rotate_ip = false;

    var job_count = 0;
    var session_id = await logs_utils.add_session_logs('GOOGLE')
    console.log("session id", session_id)
    let new_ip = null;
    var current_ip = get_current_ip();
    let redis_serps_count_key = 'serps_count_key'
    let redis_client = await browser_utils.get_redis_client()
    let is_redis_serps_count_key = await redis_client.get(redis_serps_count_key);
    if (!is_redis_serps_count_key) {
        await redis_client.set(redis_serps_count_key, 0);
    }
    for (let kw of jobs){
        const currentDate = new Date().toLocaleDateString();
        key = `${currentDate}_${kw}`
        is_keyword_exist = await redis_client.get(key)
        if (!is_keyword_exist){
        let job = ss_model.newSearchSession({"keyword": kw,})
        let result = await strategy_google_serps.strategy_google_serps(job);
        job_count++;
        console.log('job_count:', job_count);
        if (result){
            serp_data = await parse_html.parse_html(result)
            console.log(`storing the data into redis against keyword \n${kw}:`, serp_data)
            var actions = {
                'keyword': kw,
                'serps_count': serp_data.length
            }
            await logs_utils.add_job_logs('JUST_SEARCH', actions, session_id)
            await redis_client.set(key, JSON.stringify(serp_data))
            let serps_count = await redis_client.get(redis_serps_count_key)
            serps_count = serps_count + 1;
            await redis_client.set(kw, serps_count)
            }
        }
    }

    if (job_count >= cycle_ip_after_num_jobs && rotate_ip){
        console.log('Cycling IP...Previous IP:', current_ip);

        await strategy_google_serps.navigateToDummy();
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
  run(jobs=jobs);
}
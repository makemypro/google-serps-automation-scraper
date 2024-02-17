const browser_utils = require("../cdp/browser_utils");
const strategy_google = require("../strategy_google.js");
const ss_model = require("../search_session");
const utils = require('../utils');
const page_source = require('../cdp/page_source');
const google_desktop = require('../extractors/google_desktop');


describe('Page navigation', () => {
  let client;
  let Runtime;


  beforeAll(async () => {
    client = await browser_utils.startChrome();
    const {Network, Page, Runtime, Input, DOM} = client;
    await Network.enable();
    await Page.enable();
    await DOM.enable();
  })

  afterAll(async () => {
    await client.close();
  })

  test('Navigating to a page should load the correct URL', async () => {
    // 1) Open Google in a new tab
    var url = 'https://www.google.com/?num=100';
    var tab = await browser_utils.loadPageInTab(url, client);

    // 2) Get current tab URL
    var tabURLCmd = `window.location.href`;
    var tabURL = await client.Runtime.evaluate({expression: tabURLCmd});

    // 3) Compare if opened URL is equal to the expected URL
    expect(tabURL.result.value).toBe(url);
  })


  test('Paid clicking', async () => {
    // This test should confirm strategy_google.js behaviour:
    //   1. search for `seo agency` keyword
    //   2. open two of the ads found

    // 0) Define a job to be search for. We search for seo agency and open organic results
    const top_ads = 2;
    var job = ss_model.newSearchSession({
      "keyword": "seo agency",
      "top_ads": top_ads,
      "paid_blocklist": "linkgraph.com",
      "organic_target": "linkgraph.com",
      "organic_target_wait_seconds": 0,
      "organic_max_page": 1,
    })
    // 1) Define code to get current tab's URL
    var tabURLCmd = `window.location.href`;

    // 2) Initiate Google search strategy
    let result = strategy_google.strategy_google(job, client, false);
    await utils.sleep(8000);

    // 3) Fetch all ads
    var html = await page_source.getPageSource();
    var paid_results = google_desktop.extractPaidResults(html);
    console.log('Test paid results:', paid_results)

    // 4) Check if we've opend top_ads number of ads
    let limit = top_ads > paid_results.length ? paid_results.length : top_ads;
    for (let i = 1; i < limit; i++) {
      await utils.sleep(15000);
      var tabURLResult = await client.Runtime.evaluate({expression: tabURLCmd});
      expect(tabURLResult.result.value).toContain(paid_results[i].url);
    }
  },
  200000);


  test('Organic clicking', async () => {
    // This test should confirm strategy_google.js behaviour:
    //   1. search for `linkgraph` keyword
    //   2. open linkgraph.com result within SERPs
    //   3. wait for 60 seconds
    //   4. open internal link on linkgraph.com page
    //   5. wait for 60 seconds

    // 0) Define a job to be search for. We search for linkgraph and open that organic result
    var job = ss_model.newSearchSession({
      "keyword": "linkgraph",
      "top_ads": 0,
      "paid_blocklist": "linkgraph.com",
      "organic_target": "linkgraph.com",
      "organic_target_wait_seconds": 60,
      "organic_max_page": 1,
    })
    // 1) Define code to get current tab's URL
    var tabURLCmd = `window.location.href`;

    // 2) Initiate Google organic search strategy
    let result = strategy_google.strategy_google(job, client, false);

    // 3) After ~5 seconds we should be on Google.com page looking at SERPs
    await utils.sleep(5000);
    var tabURLResult = await client.Runtime.evaluate({expression: tabURLCmd});
    expect(tabURLResult.result.value).toContain('google.com');

    // 4) After ~10 seconds we should be on organic result -> linkgraph.com
    await utils.sleep(10000);
    var tabURLResult = await client.Runtime.evaluate({expression: tabURLCmd});
    expect(tabURLResult.result.value).toContain('linkgraph.com');

    // 5) After ~50 seconds we should still be on the same organic result
    await utils.sleep(50000);
    var tabURLResult = await client.Runtime.evaluate({expression: tabURLCmd});
    expect(tabURLResult.result.value).toContain('linkgraph.com');

    // 6) After ~20 seconds we should be on another linkgraph.com internal page
    await utils.sleep(20000);
    var tabInternalURLResult = await client.Runtime.evaluate({expression: tabURLCmd});
    expect(tabInternalURLResult.result.value).toContain('linkgraph.com');
    // 6.1) Check if current URL is not the same as previous URL
    expect(tabURLResult.result.value).not.toBe(tabInternalURLResult.result.value);

    // 7) After ~40 seconds we should still be on the same page
    await utils.sleep(40000);
    var tabURLResult = await client.Runtime.evaluate({expression: tabURLCmd});
    expect(tabInternalURLResult.result.value).toBe(tabURLResult.result.value);
    },
    200000);
})

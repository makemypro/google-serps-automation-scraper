const CDP = require('chrome-remote-interface');
const page_source = require('./cdp/page_source');
const utils = require('./utils');
const browser_utils = require('./cdp/browser_utils');
const google_desktop = require('./extractors/google_desktop');
const { reject } = require('rambdax');

const BOTTOM_SEARCH_RESULTS_BAR_HEIGHT = 28;
const GOOGLE_MAPS_URL_PREFIX = 'https://www.google.com/maps/@';
const SEARCHBOX_SELECTOR = '#searchboxinput';
const SEARCHBOX2_SELECTOR = "div[jsaction*='searchbox_button.textarea']>div"
const SEARCH_RESULT_SELECTOR = 'a.hfpxzc';
const SEARCH_RESULT_DETAIL_SELECTOR = 'div.bJzME.Hu9e2e.tTVLSc';
const SEARCH_RESULT_DETAIL_SELECTOR2 = 'div.XltNde.tTVLSc'
const DETAIL_WEBSITE_LINK_SELECTOR = "a[data-item-id='authority']";
const DETAIL_PHONE_SELECTOR = "button[data-item-id*='phone:tel:']";
const DETAIL_OVERVIEW_SELECTOR = "button[data-tab-index='0'] > div";
const DETAIL_REVIEW_SELECTOR = "button[data-tab-index='1'] > div";
const DETAIL_ABOUT_SELECTOR = "button[data-tab-index='2']";
const DETAIL_ADDRESS_SELECTOR = "button[data-item-id*='address']";
const DETAIL_HOURS_SELECTOR = "div[jsaction*='pane.openhours.']";
const DETAIL_HOURS_SELECTOR2 = "button[data-item-id='oh']";
const DETAIL_HOURS_SELECTOR3 = "button[aria-label*='Open']";
const DETAIL_HOURS_SELECTOR4 = "img[aria-label*='Hours']";

const DIRECTION_SELECTOR = "button[data-value='Directions']";
const SEARCH_BOX_ICON_SELECTOR = "button[id='searchbox-searchbutton']"
const ZOOM_SELECTOR = "div[id='zoom']"


const DETAILS_SELECTOR_LIST = [ DETAIL_WEBSITE_LINK_SELECTOR, DETAIL_PHONE_SELECTOR,
                                DETAIL_REVIEW_SELECTOR, DETAIL_ADDRESS_SELECTOR,
                                DETAIL_HOURS_SELECTOR, DETAIL_ABOUT_SELECTOR
                            ]

const CLICK_ACTION_CHOICE = {
            'call': DETAIL_PHONE_SELECTOR,
            'website': DETAIL_WEBSITE_LINK_SELECTOR,
            'directions': DIRECTION_SELECTOR,
            'random': getRandomStringFromArray(DETAILS_SELECTOR_LIST)
}


function RecaptchaEncountered (message) {
    this.message = message;
    this.name = 'RecaptchaEncountered';
};
RecaptchaEncountered.prototype = new Error();


async function findBusiness(client, place_id, coords) {
    const scroll_step = 100;
//    await browser_utils.scrollMouseBy(client, coords.left + 20, coords.bottom + 50, 0, scroll_step);
    await utils.sleep(utils.randomIntFromInterval(1000, 3000));

    // Check HTML for the target_title;
    let html = await page_source.getPageSource();

    // target_title = target_title.toLowerCase().trim();
    const positions = google_desktop.extractGBPosition(html, place_id);
    if (typeof positions !== 'undefined' && positions.length > 0) {
        return positions;
    }
    return [[null, null]]
}

exports.strategy_googlemaps = async function (job) {

    console.log('strategy_googlemaps received job:', job);

    let redis_client = await browser_utils.get_redis_client(process.env.CELERY_BROKER_URL)

    var keyword = job.fields.keyword;
    var target_actions = job.fields.actions[0];
    var job_id = String(job.fields.job_id);
    var target_id = job.fields.target_id;
    var coords = job.fields.coords
    var is_direct_business = false;

    global.actions = [];
    global.keyword = keyword;

    let client = await browser_utils.startChrome();
    let {Network, Page, Input, DOM, Runtime} = client;
    await Promise.all([Page.enable(), Network.enable(), DOM.enable(), Runtime.enable()]);


    // Get a random desktop user agent
    let random_user_agent = browser_utils.getRandomUserAgent()
    await Network.setUserAgentOverride({'userAgent': random_user_agent});
    console.log('chosen user agent ->', random_user_agent);

    // Form the URL with location coordinates;
    let url = GOOGLE_MAPS_URL_PREFIX + coords[0] + ',' + coords[1] + ',17z?entry=ttu';
    console.log("Page Url: " + url);

    // Load the URL in the current tab;
    await browser_utils.loadPageInTab(url, client);
    global.actions.push(
        {
            "keyword": keyword,
            "current_url": url,
            "current_ip": global.ip,
            "coordinates": coords,
            "code": "google_map",
            "message": "Opened Google Business page.",
        }
    );

    // await tabObj.loadEventFired();
    await Network.loadingFinished();
    await utils.sleep(5000);

    var filename = job.fields.keyword;
    var screenshot_data = await browser_utils.saveScreenshotLowWidth(Page, `${filename}.png`);
    job.fields.screenshot_data = screenshot_data;

    // d) Check if RECAPTCHA is hit!
    let innerHTMLSelector = "document.documentElement.innerHTML";
    let innerHTMLResult = await Runtime.evaluate({expression: innerHTMLSelector});
    if (innerHTMLResult.result.value) {
        let recaptcha_check_result = browser_utils.checkIfHTMLContainsRecaptcha(innerHTMLResult.result.value);
        if (recaptcha_check_result) {
            console.log(`Encountered captcha with proxy: ${global.proxyUrl} and ip: ${global.ip}, attempting to replace the IP`)
            global.actions.push(
                {
                    "keyword": keyword,
                    "current_url": process.env.HTTPS_PROXY,
                    "current_ip": global.ip,
                    "code": "recaptcha",
                    "tag": process.env.TAG.at,
                    "random_user_agent": random_user_agent
                }
            );
            if (job_id) {
                await redis_client.set(job_id, JSON.stringify(global.actions));
            }
            throw new RecaptchaEncountered(`Recaptcha encountered for proxy ${global.proxyUrl} and ip: ${global.ip}`)
        }
    }

    var screenshot_data = await browser_utils.saveScreenshotLowWidth(Page, `${filename}.png`);
    job.fields.screenshot_data = screenshot_data;

    // Store the page html
    let html_content = await browser_utils.createAndReadFileAsBase64(`${filename}.text`, innerHTMLResult.result.value)
    job.fields.html_content = html_content;

    // Wait until the search box exist
    await browser_utils.retrieveExistingSelector(client, [SEARCHBOX_SELECTOR]);

    // Search the Business by entering the keyword
    await browser_utils.enterTextIntoField(client, SEARCHBOX_SELECTOR, keyword)
    await utils.sleep(15000);

    // Check if business page direct open
    let business_url = await browser_utils.getCurrentURLOfPage(Page);

    if (business_url.includes(target_id)) {
        is_direct_business = true;
    }
    console.log("Direct business url: " + is_direct_business);

    // Check if zoom selector is loaded
    while (!await browser_utils.elementExists(ZOOM_SELECTOR)){
        await utils.sleep(1000);
    };

    // Set the zoom value
    if (job.fields.zoom) {

        let mapUrl = await browser_utils.getCurrentURLOfPage(Page);
        let zoomValue = await browser_utils.setZoomValue(client, mapUrl, job);
        await utils.sleep(2000);

        // Click on search icon to update the search results
        let search_icon = await browser_utils.getCoordsofEl(SEARCH_BOX_ICON_SELECTOR);
        await browser_utils.clickAtPosition(client, search_icon.left, search_icon.top, 'left');
        await Network.loadingFinished();
        await utils.sleep(10000);

        global.actions.push(
                {
                    "keyword": keyword,
                    "current_url": await browser_utils.getCurrentURLOfPage(Page),
                    "current_ip": global.ip,
                    "code": "zoom_value",
                    "message": "setting up the zoom value.",
                    "zoom_value": zoomValue,
                    "tag": process.env.TAG.at,
                    "random_user_agent": random_user_agent
                }
            );
        }
     var business_search_results;
    if (is_direct_business) {
        business_search_position = [1, keyword]
        global.actions.push(
            {
                "keyword": keyword,
                "business_name": business_search_position[1],
                "position": business_search_position[0],
                "current_url": await browser_utils.getCurrentURLOfPage(Page),
                "coordinates": coords,
                "current_ip": global.ip,
                "code": "google_map",
                "message": "Search the business.",
                "tag": process.env.TAG
            }
        );
        }

    else {
        let searchbox = await browser_utils.getCoordsofEl(SEARCHBOX_SELECTOR);

        // Scroll down until we find the business by it's title;
        let tries = 0;
        while (tries < 5) {
            business_search_results = await findBusiness(client, target_id, searchbox);
            if (business_search_results[0][1]) {
                break;
            }
            tries += 1;
        }

       // Take the first position we found;
        var business_search_position = business_search_results[0];
        console.log('business_search_position: ', business_search_position);
        await utils.sleep(2000);

        global.actions.push(
            {
                "keyword": keyword,
                "business_name": business_search_position[1],
                "position": business_search_position[0],
                "current_url": await browser_utils.getCurrentURLOfPage(Page),
                "coordinates": coords,
                "current_ip": global.ip,
                "code": "google_map",
                "message": "Search the business.",
                "tag": process.env.TAG
            }
        );

        screenshot_data = await browser_utils.saveScreenshot(Page, `${filename}.png`);
        job.fields.screenshot_data = screenshot_data;

        // Find coordinates of the business box and scroll it in view;
        let business_coords = await browser_utils.getCoordsofEl(`a[href*='${job.fields.target_id}']`);
        let search_results_menu = await browser_utils.getCoordsofEl("div.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd");
        if (!business_coords) {
            if (job_id) {
                await redis_client.set(job_id, JSON.stringify(global.actions));
            }
            return
        }
        let left_to_scroll = business_coords.bottom - search_results_menu.bottom + BOTTOM_SEARCH_RESULTS_BAR_HEIGHT;

        // console.log('left_to_scroll = ', left_to_scroll);
        if (left_to_scroll > 0) {
            await browser_utils.scrollMouseBy(client, searchbox.left + 20, searchbox.top + 50, 0, left_to_scroll);
            await utils.sleep(500);
        };
    }


    // if (website_link !== null) {
    if (false) {
        // If we found the website link directly in the search results, click on it;
        // console.log('Found website link');
        let link_box_selector = `a[href='${website_link.attr("href")}']`
        let link_box = await browser_utils.getCoordsofEl(link_box_selector);
        await utils.sleep(2000);
        await browser_utils.clickAtPosition(client, link_box.left, link_box.top, 'left');
        await utils.sleep(2000);
    } else {

        // If the website link isn't in the search results, click on the business box and find it;
        // Click on the business in the search results;
        if (!is_direct_business) {
        let business_search_result_box = await browser_utils.getCoordsofEl(`a[href*='${job.fields.target_id}']`);
        await browser_utils.clickAtPosition(client, business_search_result_box.left, business_search_result_box.top, 'left');
        await utils.sleep(1200);

        // Wait until the detail window pops up;
        while (!await browser_utils.elementExists(SEARCH_RESULT_DETAIL_SELECTOR)) {
            await utils.sleep(200);
        };
        global.actions.push({
            "keyword": keyword,
            "current_url": await browser_utils.getCurrentURLOfPage(Page),
            "current_ip": global.ip,
            "coordinates": coords,
            "code": "find_business",
            "message": "Open the target google business.",
            "tag": process.env.TAG
        });
    }
        await utils.sleep(5000);
        // Get the total reviews of business
        var reviewScore = await browser_utils.getReviewScore(client)
        console.log("reviewScore", reviewScore)
        global.actions.push(
        {
            "code": "business_feedback",
            "reviews": reviewScore["reviews"],
            "rating": reviewScore["rating"]
        }
    );
        await utils.sleep(2000)


        let business_detail_div = await browser_utils.getCoordsofEl(SEARCH_RESULT_DETAIL_SELECTOR);
        console.log("Business Detail Selector", business_detail_div)
        if (business_detail_div == null) {
            console.log("Direct Business page exist")
             business_detail_div = await browser_utils.getCoordsofEl(SEARCH_RESULT_DETAIL_SELECTOR2);
        }
        // Move mouse to the business box;
        let x = utils.randomIntFromInterval(business_detail_div.left, business_detail_div.right);
        let y = utils.randomIntFromInterval(business_detail_div.top, business_detail_div.bottom);
        await browser_utils.moveMouseTo(
            client,
            x, y
        );
        await utils.sleep(100);

        const detail_selector = CLICK_ACTION_CHOICE[`${target_actions}`];
        console.log("Performing target action", detail_selector);

        await utils.sleep(2000);

        if (await browser_utils.elementExists(detail_selector)) {

            // If website link exists, scroll to it and click on it;
            let link_box = await browser_utils.getCoordsofEl(detail_selector);
            left_to_scroll = link_box.bottom - business_detail_div.bottom;
            if (left_to_scroll > 0) {
                await browser_utils.scrollMouseBy(client, x, y, 0, left_to_scroll);
                await utils.sleep(200);
                link_box.top = link_box.top - left_to_scroll;
                link_box.bottom = link_box.bottom - left_to_scroll;
            };
            await utils.sleep(200);

            if (detail_selector == DETAIL_WEBSITE_LINK_SELECTOR){
                let tabs = await CDP.List();
                let tabs_len = tabs.length;

            while (tabs.length == tabs_len) {
                console.log(`clicking at website link "${target_actions}"`)

                await browser_utils.clickAtPosition(
                    client,
                    ...utils.randomCoordsFromIntervals([link_box.left + 100, link_box.right - 200], [link_box.top , link_box.bottom]),
                    'left'
                );
                global.actions.push({
                    "keyword": keyword,
                    'business_name': business_search_position[1],
                    'position': business_search_position[0],
                    "current_url": await browser_utils.getCurrentURLOfPage(Page),
                    "coordinates": coords,
                    "current_ip": global.ip,
                    "code": "clicked action",
                    "perform_action": target_actions,
                    "did_click": true,
                    "message": "Clicked on desired actions."
            }
    );
                tabs = await CDP.List();
                await utils.sleep(200);
        };

             // Wait until new tab is fully loaded
//             await Network.loadingFinished();
             await utils.sleep(10000);

             if (tabs.length > 1) {
                await utils.sleep(200);
                console.log('Closing the new tab!');
                await client.send('Target.closeTarget', { targetId: tabs[0].id});
                }
            }
            else {
                console.log(`clicking at "${target_actions}"`)
                await browser_utils.clickAtPosition(
                    client,
                    ...utils.randomCoordsFromIntervals([link_box.left + 100, link_box.right - 200], [link_box.top , link_box.bottom]),
                    'left'
                    );
                global.actions.push({
                "keyword": keyword,
                'business_name': business_search_position[1],
                'position': business_search_position[0],
                "current_url": await browser_utils.getCurrentURLOfPage(Page),
                "coordinates": coords,
                "current_ip": global.ip,
                "code": "clicked action",
                "desired_action": target_actions,
                "perform_action": detail_selector,
                "message": "Clicked on desired actions.",
        });
        }

            await utils.sleep(2000);
            tabs = await CDP.List();
            if (tabs.length > 1 && detail_selector == DETAIL_WEBSITE_LINK_SELECTOR) {
                await utils.sleep(200);
                console.log('Closing the new tab!');
                await client.send('Target.closeTarget', { targetId: tabs[0].id});
                }

            await utils.sleep(2000)

            await GMBStaticActions(client, DETAIL_OVERVIEW_SELECTOR);
            await utils.sleep(2000)

            // Retrieve the overview selector
            let detailHoursSelector = await browser_utils.retrieveExistingSelector(client, [
            DETAIL_HOURS_SELECTOR, DETAIL_HOURS_SELECTOR2,
            DETAIL_HOURS_SELECTOR3, DETAIL_HOURS_SELECTOR4
            ]);

            // Static Actions
            // click on open hours section
            let did_click = await GMBStaticActions(client, detailHoursSelector);

            global.actions.push(
                {
                    "code": "static_action_1",
                    "current_ip": global.ip,
                    "perform_action": "hours select",
                    "did_click": did_click,
                    "message": "Clicked on static actions."
                }
            );

            // click on Review button
            await utils.sleep(2000);
            did_click = await GMBStaticActions(client, DETAIL_REVIEW_SELECTOR);
            global.actions.push(
                {
                    "code": "static_action_2",
                    "current_ip": global.ip,
                    "perform_action": "detail select",
                    "did_click": did_click,
                    "message": "Clicked on static actions."
                }
            );

            await utils.sleep(2000);

            // Take the screen shot after the click actions have finished
            screenshot_data = await browser_utils.saveScreenshot(Page, `${filename}.png`);
            job.fields.screenshot_data = screenshot_data;
        } else {
                console.log('Did not find any links to click!');
            }
    };

    await Network.clearBrowserCache();
    await Network.clearBrowserCookies();
    await client.close();

    if (job_id) {
        await redis_client.set(job_id, JSON.stringify(global.actions));
    }
    console.log("End Logs", actions)
};

function getRandomStringFromArray(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

GMBStaticActions = async function(client, selector = DETAIL_ADDRESS_SELECTOR) {
    try {
      let selector_ch = await browser_utils.getCoordsofEl(selector);
      console.log("Static Selector coordinates:", selector_ch);
      await utils.sleep(2000);
      await browser_utils.clickAtPosition(
        client,
        ...utils.randomCoordsFromIntervals(
          [selector_ch.left + 100, selector_ch.right - 200],
          [selector_ch.top, selector_ch.bottom]
        ),
        'left'
      );
      await utils.sleep(1000);
  
      // If everything succeeded, return true to indicate success.
      return true;
    } catch (error) {

      // If any error occurred during the action, log the error and return false to indicate failure.
      console.error("Error in GMStaticActions:", error);
      return { error: error.message };
    }
};

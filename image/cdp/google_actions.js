const coordinates = require("../cdp/coords");
const browser_utils = require("../cdp/browser_utils");
const utils = require("../utils");
const page_source = require("../cdp/page_source");
const google_desktop = require("../extractors/google_desktop");
const actionLogger = require("../action_logger");
const CDP = require('chrome-remote-interface');

const INFOBAR_HEIGHT = 36;
const FRAME_HEIGHT = 22;
const organic_serp_selector = '.yuRUbf > a';
const organic_serp_selectors = ['.yuRUbf > a', '.yuRUbf > div > a', '.Gx5Zad > div > a', '.yuRUbf > div > span > a'];
const paid_serp_selector = '.sVXRqc';
const paid_serp_selectors = ['.sVXRqc', '.uEierd'] ;
        //  > .LC20lb
exports.paid_serp_selectors = paid_serp_selectors
exports.organic_serp_selectors = organic_serp_selectors

exports.clickOnSERPAtPosition = async function (client, Runtime, serp_position){
    console.log('inside clickOnSERPAtPosition');
    await browser_utils.scrollIntoView(Runtime, organic_serp_selector, serp_position);
    await utils.sleep(2000);
    console.log('going to getCoordsMulti for organicSERPAtPosition', serp_position);
    let coords = await coordinates.getCoordsMulti(organic_serp_selector, serp_position);
    if (!coords){
        console.warn("No Coords for serp_position:", serp_position);
    } else {
        // If you think the y-coordinate delta is wrong, it's probably because you have a horizontal box at the top of your screen.
        // You're welcome XO Manick
        browser_utils.clickAtPosition(client, coords.x + 5, coords.y - INFOBAR_HEIGHT - FRAME_HEIGHT, 'left');
        await utils.sleep(5000);
    }
};

exports.getPositionOfDomainInSERPs = function(results, domain){
    var position = -1;
    var match_found = false;
    for (let result of results){
        position += 1;
//        console.log("domain: ", domain, "| serp url:", result.url, "| serp_position:", position);
        if (result.url.includes(domain)){
            console.log("match!");
            match_found = true;
            break;
        } else {
//            console.log("no match.");
        }
    }
    if (match_found){
        return position;
    }
    return null;
};

function DomainNotInOrganicResultsException (message) {
  this.message = message;
  this.name = 'DomainNotInOrganicResultsException';
};
DomainNotInOrganicResultsException.prototype = new Error();


exports.clickOnOrganicResultForDomain = async function(client, Runtime, domain, num){
    var {Page} = client;

    let initial_url = await browser_utils.getCurrentURLOfPage(Page);

    var html = await page_source.getPageSource();
    var organic_results = google_desktop.extractOrganicResults2(html);
    var position = exports.getPositionOfDomainInSERPs(organic_results, domain);
    if (position === null){
        console.log('domain', domain, 'is not ranking in organic results!');
        let message = `${domain} is not ranking in ${organic_results.count} search results...`;
        return new Promise((resolve, reject) => {
            console.log(message)
            resolve(false);
        })
        // throw new DomainNotInOrganicResultsException(message);
    }
    // var {Runtime} = client;

    console.log('clickOnOrganicResultForDomain - getPositionOfDomainInSERPs:', position);

    let selector = `a[href*='${domain}']`;
    let elementIsView = await exports.isElementsInViewport(selector)
    await utils.sleep(2000);
    let count=0

    // Using false here means that target domain is not visible to current screen so we can scroll it
    // The purpose of using this condition is to avoid the scrolling in case of if the target domain not exist in entire DOM
    while (elementIsView === false) {
        await browser_utils.scrollBy(Runtime, 200)
        await utils.sleep(2000);
        elementIsView = await exports.isElementsInViewport(selector)
        count++;
        if (count > 90) {break;}
    }

    console.log('getCoordsMulti for organic serp selector at', position);
    for (let i = 0; i < organic_serp_selectors.length;  i++) {
        serp_selector = organic_serp_selectors[i];
//        let shouldScroll = await exports.shouldScrollForElement(client, serp_selector, position)
//        if (shouldScroll){
//            await browser_utils.scrollIntoView(Runtime, serp_selector, position);
//            await utils.sleep(1000);
//        }
        var did_click = await exports.clickCorodinatesAtPositionIfExists(client, serp_selector, position, num);
        if (did_click) {
            console.log("did clik with selector: " + serp_selector, did_click)
            break
        }
    }
    await utils.sleep(2000);
    await browser_utils.scrollRandomly(Runtime, 10);

    let new_url = await browser_utils.getCurrentURLOfPage(Page);

    if (did_click) {
        return new Promise((resolve, reject) => {
            resolve(true);
        })
    } else {
        console.log(`Wasnt able to successfully click on organic result at position ${position} `)
        return new Promise((resolve, reject) => {
            resolve(false);
        })
    }
};

exports.clickNextPage = async function(client, Runtime) {
    let selector = "#pnnext";
//    await browser_utils.scrollIntoView(Runtime, "footcnt", 0);
    await browser_utils.scrollToBottom(Runtime);
    await utils.sleep(3000);

    // Try Next page selector
    let next_page_coords = await coordinates.getCoordsMulti(selector, 0);
    let more_results_coords = await coordinates.getMoreResultsCoords()

    let coords = next_page_coords || more_results_coords;

    if (!coords) {
        console.warn("No Next Button or More Results Button on the Page!");
        return new Promise((resolve, reject) => {
            resolve(true);
        })
    } else {
        // If you think the y-coordinate delta is wrong, it's probably because you have a horizontal box at the top of your screen.
        // You're welcome XO Manick
        browser_utils.clickAtPosition(client, coords.x + 5, coords.y, 'left');
        await utils.sleep(5000);
        return new Promise((resolve, reject) => {
            resolve(true);
        })
    }
};


exports.clickYoutubeSkipAd = async function(client, Runtime){
    // Doesn't work yet
    let selector = '.ytp-ad-skip-button'
    await browser_utils.scrollIntoView(Runtime, selector, 0);
    await utils.sleep(1000);
    var coords = await coordinates.getCoordsMulti(selector, 0);
    if (!coords){
        console.warn("No Skip Ad Button on Page!");
        return false;
    } else {
        // If you think the y-coordinate delta is wrong, it's probably because you have a horizontal box at the top of your screen.
        // You're welcome XO Manick
        browser_utils.clickAtPosition(client, coords.x + 5, coords.y - INFOBAR_HEIGHT - FRAME_HEIGHT, 'left');
        await utils.sleep(5000);
        return true;
    }
}

exports.clickCorodinatesAtPositionIfExists = async function(client, selector, position, num){
    var coords = await coordinates.getCoordsMulti(selector, position);
    if (!coords) {
        console.warn("No Coords for serp_position:", position);
        return false;
    } else {
        // If you think the y-coordinate delta is wrong, it's probably because you have a horizontal box at the top of your screen.
        // You're welcome XO Manick
        if (num) {
            await exports.clickAtPosition(selector, position);
            return true;
        }
        await browser_utils.clickAtPosition(client, coords.x + 5, coords.y, 'left');
        await utils.sleep(5000);
        return true;
    }
};


exports.shouldScrollForElement = async function(client, selector, position){
    var coords = await coordinates.getCoordsMulti(selector, position);
    if (!coords) {
        console.warn("No Coords for serp_position:", position);
        return false;
    } else {
        await utils.sleep(5000);
        return true;
    }
};

exports.clickOnAdAtPosition = async function (client, Runtime, position){
    for (let i = 0; i < paid_serp_selectors.length;  i++) {
        let paid_serps_selector = paid_serp_selectors[i];
        await browser_utils.scrollIntoView(Runtime, paid_serps_selector, position);
        await utils.sleep(1000);
        let did_click = await exports.clickCorodinatesAtPositionIfExists(client, paid_serps_selector, position);
        if (did_click) {
            console.log("did clik with selector: ", paid_serps_selector, did_click)
            return did_click;
       }
    }
};

exports.clickOnPaidResultForDomain = async function(client, Runtime, domain){
    var html = await page_source.getPageSource();
    var paid_results = google_desktop.extractPaidResults(html);
    console.log('paid_results:', paid_results);

    var position = exports.getPositionOfDomainInSERPs(paid_results, domain);

    // console.log('paid_results:', paid_results);
    // var {Runtime} = client;

    var coords = await coordinates.getCoordsMulti(paid_serp_selector, position);
    await browser_utils.scrollIntoView(Runtime, paid_serp_selector, position);
    await utils.sleep(1000);
    var did_click = await exports.clickCorodinatesAtPositionIfExists(client, paid_serp_selector, position);
    return did_click;
};


exports.resolveCaptchaOnPageIfDiscovered = async function(client) {
    var is_recaptcha_hit = await browser_utils.pollIfRecaptchaIsHit();
    console.log('resolveCaptchaOnPageIfDiscovered Hit! Sleeping for 2 second');
    return new Promise((resolve, reject) => {
        resolve(is_recaptcha_hit);
    })
};


// Helper Methods!
exports.executeClickOnOrganicResults = async function(client, Runtime, organic_serp_positions_to_click_on){
        var {Page} = client;
        let initial_url = await browser_utils.getCurrentURLOfPage(Page);

        for (var position of organic_serp_positions_to_click_on) {
            console.log('Position', position);
            var did_click = await exports.clickOnSERPAtPosition(client, Runtime, position);
            let new_url = await browser_utils.getCurrentURLOfPage(Page);

            actionLogger.actionLogger("organic_click", initial_url=initial_url, new_url=new_url, did_click);
            if (did_click){
                console.log('Organic result clicked!');
                browser_utils.pressBackButton(client);
                await utils.sleep(2000);
            } else {
                console.warn('Failed to click on Organic result :(!');
            }
        }
};

exports.executeClickOnOrganicDomains = async function(client, Runtime, domains_to_click_on, job, organic_results, organic_results_for_position=null, num=null){
        var {Page} = client;
        await Page.disable();
        await Page.enable();
        await utils.sleep(1000);
        let initial_url = await browser_utils.getCurrentURLOfPage(Page);
        let new_url = null;
        let tries = 0
        if (organic_results_for_position && job.fields.max_organic_serp_position_click_limit) {
            let check_position = await exports.getPositionOfDomainInSERPs(organic_results_for_position, job.fields.organic_target)
            if (check_position !== null) {
                if (check_position > job.fields.max_organic_serp_position_click_limit) {
                    console.log(`do not click as the position is ${check_position} and job.fields.max_organic_serp_position_click_limit is ${job.fields.max_organic_serp_position_click_limit}`)
                    return new Promise((resolve, reject) => {
                    resolve(false);
                })
                }
            }
        }
        for (var domain of domains_to_click_on) {
            console.log('domain:', domain);
            var did_click = await exports.clickOnOrganicResultForDomain(client, Runtime, domain, num);
            
            new_url = await browser_utils.getCurrentURLOfPage(Page);
            actionLogger.actionLogger("organic_click", initial_url=initial_url, new_url=new_url, did_click);
            if (did_click){
                console.log('Organic result clicked!');
                while(new_url.includes('google.com/search')){
                    // sleep for 10 seconds before the url changes
                    console.log("Tab URL is not changed: ", new_url)
                    await utils.sleep(10000);
                    new_url = await browser_utils.getCurrentURLOfPage(Page);
                    tries++;
                    if (tries > 5) {
                        break
                    }
                }
                return new Promise((resolve, reject) => {
                    resolve(true);
                })
                // browser_utils.pressBackButton(client);
                // await utils.sleep(2000);
            } else {
                console.warn('Failed to click on Organic result :(!');
                return new Promise((resolve, reject) => {
                    resolve(false);
                })
            }
        }
};


clickRandomSERP = async function(client, Runtime, organic_results){
    try {
        // Scroll mid-page and select a random SERP to click on
        await browser_utils.scrollIntoView(Runtime, "#pnnext", 0);
        const randomIndex = Math.floor(Math.random() * organic_results.length);
        const url = new URL(organic_results[randomIndex].url);
        competitor_domain = url.hostname;

        // Click on a randomly selected domain
        var did_click = await exports.clickOnOrganicResultForDomain(client, Runtime, competitor_domain);

        // Sleep for 10-15 seconds and go back
        sleepInterval = utils.randomIntFromInterval(5000, 10000);
        await utils.sleep(sleepInterval);
        browser_utils.pressBackButton(client);
        await utils.sleep(2000);
    } catch (e) {
        console.log('Did not find provided domain within SERPs');
    }
}


exports.clickInternalLink = async function(client, Runtime, job){
    console.log('[clickInternalLink] Clicking on an internal link on', job.fields.organic_target);
    var {Page} = client;

    // Get all the links on the page
    var html = await page_source.getPageSource();
    var links = google_desktop.extractInternalLinks(html);
    console.log('[clickInternalLink] Links length:', links.length)

    // Shuffle the links array to randomize the order
    links = links.sort(() => Math.random() - 0.5);

    // Loop through the links and click the first one that stays on the same domain
    let currentUrl = await browser_utils.getCurrentURLOfPage(Page);
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        console.log('[clickInternalLink] Checking link', link)
        if (link && !currentUrl.includes(link)) {
            if (link.startsWith("/") && !link.startsWith("//")) {
                linkToVisit = 'http://' + job.fields.organic_target + link;
            } else if (link.startsWith("http://") && link.startsWith("https://")) {
                linkToVisit = link;
            } else {
                continue;
            }
            console.log('[clickInternalLink] Clicking on a link', linkToVisit)
            await browser_utils.loadPageInTab(linkToVisit, client);

            await utils.sleep(2000);
            await browser_utils.scrollRandomly(Runtime, 10);

            sleepInterval = utils.randomIntFromInterval(20000, 50000);
            global.actions.push(
                {
                    "keyword": job.fields.keyword,
                    "current_ip": global.ip,
                    "current_url": await browser_utils.getCurrentURLOfPage(Page),
                    "code": "internal_page_click",
                    "sleep_interval": sleepInterval,
                    "message": "Opened internal page."
                }
            );
            await utils.sleep(sleepInterval);
            return;
        }
    }
};

exports.clickBacklink = async function(client, Runtime, job){
    console.log('[clickInternalLink] Clicking on an internal link on', job.fields.target_domain);
    var {Page} = client;

    // Get all the links on the page
    var html = await page_source.getPageSource();
    var links = google_desktop.extractInternalLinks(html);
    console.log('[clickInternalLink] Links length:', links.length)

    // Shuffle the links array to randomize the order
    links = links.sort(() => Math.random() - 0.5);

    // Loop through the links and click the first one that stays on the same domain
    let currentUrl = await browser_utils.getCurrentURLOfPage(Page);
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        console.log('[clickInternalLink] Checking link', link)
        if (link || !currentUrl.includes(link)) {
            if (link.startsWith("/") && !link.startsWith("//")) {
                linkToVisit = 'http://' + job.fields.target_domain + link;
            } else if (link.startsWith("http://") || link.startsWith("https://")) {
                linkToVisit = link;
            } else {
                continue;
            }
            console.log('[clickInternalLink] Clicking on a link', linkToVisit)
            let link_box_selector = `a[href*="${linkToVisit}"]`
            await Runtime.evaluate({expression: `
            let targetElement = document.querySelector('${link_box_selector}');
            var clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
                });
            targetElement.dispatchEvent(clickEvent);
            `})

            // Wait until page is loaded
            await utils.sleep(15000);
            await browser_utils.scrollRandomly(Runtime, 15);

            sleepInterval = utils.randomIntFromInterval(20000, 50000);
            global.actions.push(
                {
                    "target_domain": job.fields.target_domain,
                    "current_ip": global.ip,
                    "current_url": await browser_utils.getCurrentURLOfPage(Page),
                    "code": "internal_page_click",
                    "sleep_interval": sleepInterval,
                    "message": "Opened internal page."
                }
            );
            await utils.sleep(sleepInterval);
            return;
        }
    }
};


exports.executeClickOnAdResults = async function(client, Runtime, ad_positions_to_click_on){
        var {Page, Network, Input} = client;
        let initial_url = await browser_utils.getCurrentURLOfPage(Page);

        for (var position of ad_positions_to_click_on) {
            console.log('Executing click on Ad Position index:', position);
            var did_click = await exports.clickOnAdAtPosition(client, Runtime, position);

            await utils.sleep(2000);

            let new_url = await browser_utils.getCurrentURLOfPage(Page);
            console.log(`Ad Click: initial_url=${initial_url}, new_url=${new_url}, did_click=${did_click}`);
            let sleepInterval = 0;
            if (did_click) {
                console.log('Ad clicked!');
                await browser_utils.scrollBy(Runtime, 350);
                sleepInterval = utils.randomIntFromInterval(5000, 7000);
                await utils.sleep(sleepInterval);
                browser_utils.pressBackButton(client);
                await utils.sleep(1000);
                browser_utils.pressEnter(client.Input)
                await utils.sleep(5000);
            } else {
                console.warn('Failed to click on Ad result!');
            }

            global.actions.push(
                {
                    "keyword": global.keyword,
                    "current_url": await browser_utils.getCurrentURLOfPage(Page),
                    "did_click": did_click,
                    "current_ip": global.ip,
                    "sleep_interval": sleepInterval,
                    "code": "paid_click",
                    "message": "Clicked on Ad.",
                }
            );
        }
};

exports.executeClickOnAdDomain = async function(client, Runtime, ad_domains_to_click_on){
        for (var domain of ad_domains_to_click_on) {
            console.log('Ad Domain', domain);
            var did_click = await exports.clickOnPaidResultForDomain(client, Runtime, domain);
            if (did_click){
                await browser_utils.scrollBy(Runtime, 300);
                await utils.sleep(2000);
                browser_utils.pressBackButton(client);
                await utils.sleep(2000);
            }
        }
};


exports.performPogoClick = async function(client, Runtime, organic_results, organic_target){
    var {Page, Runtime} = client;
    console.log("organic results for position", organic_results)
    try {
         if (organic_results[0].url.includes(organic_target)){
            console.log("Target domain found in first position, so did not perform the pogo actions")
            return false
         }
        const pageUrl = await browser_utils.getCurrentURLOfPage(Page);
        const url = organic_results[0].url;
        let link_box_selector = `a[href*='${url}']`
        console.log("pogo clicked selector", link_box_selector)

        // check if element visible like humans
        let elementIsView = await exports.isElementInViewport(link_box_selector)
        let count = 0;
        while (!elementIsView) {
            await browser_utils.scrollBy(Runtime, 200)
            await utils.sleep(2000);
            elementIsView = await exports.isElementsInViewport(link_box_selector)
            count++;
        if (count > 5) {break;}
        }

        let link_box = await browser_utils.getCoordsofEl(link_box_selector);
        await utils.sleep(2000);

        console.log("Performing the pogo click action for", url)
        await browser_utils.clickAtPosition(client, link_box.left, link_box.top, 'left');
        await utils.sleep(10000);
        const newPageUrl = await browser_utils.getCurrentURLOfPage(Page);

        // Sleep for 5-10 seconds and go back
        await utils.sleep(5000);
        if(!newPageUrl.includes('google.com')){
            console.log("Pressing back from POGO domain...")
            await browser_utils.pressBackButton(client);
            await utils.sleep(10000);
            return newPageUrl;
        }
        console.log("Does not perform the pogo click for", url)
        return false;

    } catch (e) {
        console.log('Did not find provided domain within SERPs', e);
    }
}

exports.clickAtPosition = async function(selector, position){
    const expression = `
    const element = document.querySelectorAll('${selector}')[${position}];

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
    });
    element.dispatchEvent(clickEvent);
`;
    try {
        const client = await CDP()
        var {Runtime} = client;
        Runtime.enable();
        let did_click = await Runtime.evaluate({expression: expression });
        return did_click.result.value
    }
    catch (err) {
        console.error('Did not click on target domain: ', err);
        return false;
    }
};

// Function to check if serps are visible on screen and can be clickable on
// Ignore the serps if they are not visible or in "People also ask" sections
exports.isElementInViewport = async function (selector) {
    const expression = `
    var elementIsVisibleInViewport = (el, partiallyVisible = true) => {
        const { top, left, bottom, right } = el.getBoundingClientRect();
        const { innerHeight, innerWidth } = window;
        return partiallyVisible
            ? ((top > 0 && top < innerHeight) ||
                (bottom > 0 && bottom < innerHeight)) &&
                ((left > 0 && left < innerWidth) || (right > 0 && right < innerWidth))
            : top >= 0 && left >= 0 && bottom <= innerHeight && right <= innerWidth;
    };
    var element = document.querySelector('${selector.replace(/'/g, "\\'")}');
    if (element) {
        elementIsVisibleInViewport(element);
    }
`;

    let client;
    try {
        client = await CDP();
        const { Runtime } = client;
        await Runtime.enable();

        const result = await Runtime.evaluate({ expression });

        console.log("Element clicked viewport", result);
        return result.result.value;
    } catch (err) {
        console.error('Did not click on target domain: ', err);
        return false;
    } finally {
        if (client) {
            await client.close();
        }
    }
};

// Function to check if serps are visible on screen and can be clickable on
// Ignore the serps if they are not visible or in "People also ask" sections
exports.isElementsInViewport = async function (selector) {
    const expression = `
    var elementIsVisibleInViewport = (el, partiallyVisible = true) => {
        const { top, left, bottom, right } = el.getBoundingClientRect();
        const { innerHeight, innerWidth } = window;
        return partiallyVisible
            ? ((top > 0 && top < innerHeight) ||
                (bottom > 0 && bottom < innerHeight)) &&
                ((left > 0 && left < innerWidth) || (right > 0 && right < innerWidth))
            : top >= 0 && left >= 0 && bottom <= innerHeight && right <= innerWidth;
    };
    var elements = document.querySelectorAll('${selector.replace(/'/g, "\\'")}');
    var checkElementVisibility = (elements) => {
        var is_visible = false;
        for (let element of elements) {
           is_visible = elementIsVisibleInViewport(element);
           if (is_visible) {
            break;
           }
}
        return is_visible
    }
    if (elements.length > 0) {
        checkElementVisibility(elements);
    }
`;

    let client;
    try {
        client = await CDP();
        const { Runtime } = client;
        await Runtime.enable();

        const result = await Runtime.evaluate({ expression });

        console.log("Element clicked viewport", result);
        return result.result.value;
    } catch (err) {
        console.error('Did not click on target domain: ', err);
        return false;
    } finally {
        if (client) {
            await client.close();
        }
    }
};

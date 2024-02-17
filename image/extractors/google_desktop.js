// https://github.com/apify/actor-google-search-scraper/blob/master/src/extractors/desktop.js
// https://github.com/apify/actor-google-search-scraper/blob/master/src/extractors/desktop.js
const cheerio = require('cheerio');
const { ensureItsAbsoluteUrl } = require('./ensure_absolute_url');
const { extractPeopleAlsoAsk, extractDescriptionAndDate } = require('./extractor_tools');
// const coordinates = require('../cdp/coords');

const displayURLElementsSelector = ['.x2VHCd', '.ob9lvb', 'span[role="text"]']
const descriptionElementsSelector = ['.MUxGbd.yDYNvb.lyLwlc > span', '.MUxGbd.yDYNvb.lyLwlc > div']
const searchText = 'People also ask';

// another option with models
// https://github.com/zlurad/serp-parser/blob/master/src/google.ts

exports.extractOrganicResults = (html_str) => {
    const $ = cheerio.load(html_str);
    // Executed on a single organic result (row)
    const parseResult = (el) => {
        // HOTFIX: Google is A/B testing a new dropdown, which causes invalid results.
        // For now, just remove it.
        $(el).find('div.action-menu').remove();

        const siteLinks = [];

        const siteLinksSelOld = 'ul li';
        const siteLinksSel2020 = '.St3GK a';
        const siteLinksSel2021January = 'table';

        if ($(el).parent().parent().siblings(siteLinksSel2021January).length > 0) {
            $(el).parent().parent().siblings(siteLinksSel2021January)
                .find('td .sld')
                .each((i, siteLinkEl) => {
                    siteLinks.push({
                        title: $(siteLinkEl).find('a').text(),
                        url: $(siteLinkEl).find('a').attr('href'),
                        ...extractDescriptionAndDate($(siteLinkEl).find('.s').text()),
                    });
                });
        } else if ($(el).find(siteLinksSel2020).length > 0) {
            $(el).find(siteLinksSel2020).each((i, siteLinkEl) => {
                siteLinks.push({
                    title: $(siteLinkEl).text(),
                    url: $(siteLinkEl).attr('href'),
                    // Seems Google removed decription in the new layout, let's keep it for now though
                    ...extractDescriptionAndDate($(siteLinkEl).parent('div').parent('h3').parent('div')
                        .find('> div')
                        .toArray()
                        .map((d) => $(d).text())
                        .join(' ') || null),
                });
            });
        } else if ($(el).find(siteLinksSelOld).length > 0) {
            $(el).find(siteLinksSelOld).each((_i, siteLinkEl) => {
                siteLinks.push({
                    title: $(siteLinkEl).find('h3').text(),
                    url: $(siteLinkEl).find('h3 a').attr('href'),
                    ...extractDescriptionAndDate($(siteLinkEl).find('div').text()),
                });
            });
        }

        const productInfo = {};
        const productInfoSelOld = '.dhIWPd';
        const productInfoSel2021January = '.fG8Fp';
        const productInfoText = $(el).find(`${productInfoSelOld}, ${productInfoSel2021January}`).text();
        if (productInfoText) {
            const ratingMatch = productInfoText.match(/Rating: ([0-9.]+)/);
            if (ratingMatch) {
                productInfo.rating = Number(ratingMatch[1]);
            }
            const numberOfReviewsMatch = productInfoText.match(/([0-9,]+) reviews/);
            if (numberOfReviewsMatch) {
                productInfo.numberOfReviews = Number(numberOfReviewsMatch[1].replace(/,/g, ''));
            }

            const priceMatch = productInfoText.match(/\$([0-9.,]+)/);
            if (priceMatch) {
                productInfo.price = Number(priceMatch[1].replace(/,/g, ''));
            }
        }
        let personalDescription = null;
        let cleanDescription = null;

        if ($(el).find('[data-content-feature="1"]').children().length === 2) {
            personalDescription = $(el).find('[data-content-feature="1"]').children().eq(0)
                .text()
                .trim();
            cleanDescription = $(el).find('[data-content-feature="1"]').children().eq(1)
                .text()
                .trim();
        }
        const searchResult = {
            title: $(el).find('[data-header-feature="0"] h3').first().text(),
            url: $(el).find('[data-header-feature="0"] a').first().attr('href'),
            displayedUrl: $(el).find('cite').eq(0).text(),
            ...extractDescriptionAndDate($(el).find('[data-content-feature="1"]').text()),
            emphasizedKeywords: $(el).find('.VwiC3b em, .VwiC3b b').map((_i, element) => $(element).text().trim()).toArray(),
            siteLinks,
            productInfo,
        };
        if (personalDescription) {
            const [name] = searchResult.title.split('-').map((field) => field.trim());
            const [location, jobTitle, companyName] = personalDescription.split('·').map((field) => field.trim());
            searchResult.personalInfo = { name, location, jobTitle, companyName, cleanDescription };
        }
        return searchResult;
    };

    // TODO: If you figure out how to reasonably generalize this, you get a medal
    const resultSelectorOld = '.g .rc';
    // We go one deeper to gain accuracy but then we have to go one up for the parsing
    const resultSelector2021January = '.g .tF2Cxc>.yuRUbf';
    const resultSelector2022January = '.g [data-header-feature="0"]';

    let searchResults = [];
    if ($(`${resultSelector2022January}`).length > 0) {
        searchResults = [...$(`${resultSelector2022January}`)].reduce((organicResultsSels, organicResultSel) => {
            // We  fetch the list of sub organic results contained in one organic result section
            // It may be hijacking the siteLinks and flattening them into the organicResultsSels
            const subOrganicResultsSels = $(organicResultSel).map((_i, organicItem) => parseResult($(organicItem).parent())).toArray();
            organicResultsSels.push(...subOrganicResultsSels);
            return organicResultsSels;
        }, []);
    }

    if (searchResults.length === 0) {
        searchResults = $(`${resultSelector2021January}`).map((_i, el) => parseResult($(el).parent())).toArray();
    }

    if (searchResults.length === 0) {
        searchResults = $(`${resultSelectorOld}`).map((_index, el) => parseResult(el)).toArray();
    }

    return searchResults;
};

shouldRemoveEl = (el, text) => {
    // Iterate over the children of the parent element and match exact text
    shouldRemove = false
    if (!el.html()) return
    const $ = cheerio.load(el.html());
    el.find('*').each((index, childElement) => {
        if ($(childElement).text().trim() && !$(childElement).parent().is('a')) {
            shouldRemove = true;
            return
        }
    });
    return shouldRemove
}

function generateSelectors(htmlContent, targetText = 'People also ask') {
    const $ = cheerio.load(htmlContent);
    let result = null;

    function findStructure(element) {
        const structure = [];
        while (element[0] !== $('html')[0]) {
            if (element[0].tagName) {
                structure.push(element[0].tagName);
            }
            element = element.parent();
        }
        structure.reverse();
        return structure.join(' > ');
    }

    function findSelector(element) {
        let selector = element[0].tagName;
        if (element.attr('id')) {
            selector += `#${element.attr('id')}`;
        }
        if (element.attr('class')) {
            selector += '.' + element.attr('class').split(' ').join('.');
        }
        return selector;
    }

    function findDeepestChildWithText(element, text) {
        let selector = null;
        let structure = null;

        element.find('*').each((index, childElement) => {
            if ($(childElement).text().trim() === text) {
                selector = findSelector($(childElement));
                structure = findStructure($(childElement));
            }
        });

        return { selector, structure };
    }

    $(`*`).each((index, element) => {
        if ($(element).text().trim() === targetText) {
            const { selector, structure } = findDeepestChildWithText($(element), targetText);

            if (selector) {
                result = {
                    text: targetText,
                    selector: selector,
                    structure: structure,
                };
                return false; // Break the loop
            }
        }
    });

    return result;
}

function getParentElementForSelector(selector, text, html_str) {
    var $ = cheerio.load(html_str);
    let result = null;
    if (!selector) return null;
    $(selector).each((index, element) => {
        const elementText = $(element).text().trim();
        console.log(elementText)
        if (elementText === text) {
            result = element;
            return false; // Break the loop
        }
    });
    if (result) {
        let stopCondition = 'div.Gx5Zad'
        let parentElement = $(result).parent();
        while (parentElement.length && !parentElement.is(stopCondition)) {
            console.log(parentElement.html()); // Do something with the found parent elements
            parentElement = parentElement.parent();
        }
    }
    return result;
}

exports.extractOrganicResults2 = (html_str) => {
  var $ = cheerio.load(html_str);
  const links = [];
  const titles = [];
  const snippets = [];

  $(".yuRUbf > a").each((i, el) => {
    links[i] = $(el).attr("href");
  });
  $(".yuRUbf > a > h3").each((i, el) => {
    titles[i] = $(el).text();
  });
  $(".IsZvec").each((i, el) => {
    snippets[i] = $(el).text().trim();
  });
  if (!links.length) {
    $(".yuRUbf > div > a").each((i, el) => {
      links[i] = $(el).attr("href");
    });
    $(".yuRUbf > div > a > h3").each((i, el) => {
      titles[i] = $(el).text();
    });
    $(".IsZvec").each((i, el) => {
      snippets[i] = $(el).text().trim();
    });
  }
  if (!links.length) {
    $(".yuRUbf > div > span > a").each((i, el) => {
      links[i] = $(el).attr("href");
    });
    $(".yuRUbf > div > span > a > h3").each((i, el) => {
      titles[i] = $(el).text();
    });
    $(".IsZvec").each((i, el) => {
      snippets[i] = $(el).text().trim();
    });
  }
  // this selector exludes the map section
  if (!links.length) {
    $(".Gx5Zad > div > a").each((i, el) => {
      links[i] = $(el).attr("href");
    });
    $(".Gx5Zad > div> a > h3").each((i, el) => {
      titles[i] = $(el).text();
    });
    $(".Gx5Zad").each((i, el) => {
      snippets[i] = $(el).text().trim();
    });
  }

  const results = [];
  for (let i = 0; i < links.length; i++) {
//   console.log(links[i], ' position: ', i);
    results[i] = {
      url: links[i],
      title: titles[i],
      snippet: snippets[i]
    };
  }
  return results;
};


exports.extractOrganicResultsForPosition = (html_str) => {
  var $ = cheerio.load(html_str);
  // figure out another way, as the classes are similar, no other way found till yet
  const PeopleAlsoAsk = 'People also ask';
  const Businesses = 'Businesses';
  const Places = 'Places';
  const Videos = 'Videos';
  const SeeREsultsAbout = 'See results about';
  const Locations = 'Locations';
  let el = null;

  // Remove some unnecessary div tag in which un related urls exist i.e Maps, Ads with same serps classes
  const targetPAADivV1 = $('div.Gx5Zad:has(span:contains("People also ask"))');
  if (shouldRemoveEl(targetPAADivV1, PeopleAlsoAsk)) {
    targetPAADivV1.remove();
  }
  const targetPlacesDivV1 = $('div.Gx5Zad:has(div:contains("Places"))');
  if (shouldRemoveEl(targetPlacesDivV1, Places)) {
    targetPlacesDivV1.remove();
  }
  const targetVideosDivV1 = $('div.Gx5Zad:has(div:contains("Videos"))');
  if (shouldRemoveEl(targetVideosDivV1, Videos)) {
    targetVideosDivV1.remove();
  }
  const targetBusinessesDivV1 = $('div.Gx5Zad:has(div:contains("Businesses"))');
  if (shouldRemoveEl(targetBusinessesDivV1, Businesses)) {
    targetBusinessesDivV1.remove();
  }
  const targetSeeREsultsAboutDivV1 = $('div.Gx5Zad:has(div:contains("See results about"))');
  if (shouldRemoveEl(targetSeeREsultsAboutDivV1, SeeREsultsAbout)) {
    targetSeeREsultsAboutDivV1.remove();
  }
  const targetLocationsDivV1 = $('div.Gx5Zad:has(div:contains("Locations"))');
  if (shouldRemoveEl(targetLocationsDivV1, Locations)) {
    targetLocationsDivV1.remove();
  }


  // Remove some unnecessary div tag in which un related urls exist i.e Maps, Ads with same serps classes
  const targetPAADivV2 = $('div.MjjYud:has(span:contains("People also ask"))');
  if (shouldRemoveEl(targetPAADivV2, PeopleAlsoAsk)) {
    targetPAADivV2.remove();
  }
  const targetPlacesDivV2 = $('div.MjjYud:has(div:contains("Places"))');
  if (shouldRemoveEl(targetPlacesDivV2, Places)) {
    targetPlacesDivV2.remove();
  }
  const targetVideosDivV2 = $('div.MjjYud:has(div:contains("Videos"))');
  if (shouldRemoveEl(targetVideosDivV2, Videos)) {
    targetVideosDivV2.remove();
  }
  const targetBusinessesDivV2 = $('div.MjjYud:has(div:contains("Businesses"))');
  if (shouldRemoveEl(targetBusinessesDivV2, Businesses)) {
    targetBusinessesDivV2.remove();
  }
  const targetSeeREsultsAboutDivV2 = $('div.MjjYud:has(div:contains("See results about"))');
  if (shouldRemoveEl(targetSeeREsultsAboutDivV2, SeeREsultsAbout)) {
    targetSeeREsultsAboutDivV2.remove();
  }
  const targetLocationsDivV2 = $('div.MjjYud:has(div:contains("Locations"))');
  if (shouldRemoveEl(targetLocationsDivV2, Locations)) {
    targetLocationsDivV2.remove();
  }

  // Remove some unnecessary div tag in which un related urls exist i.e Maps, Ads with same serps classes
  const targetPAADivV3 = $('div.TzHB6b:has(div:contains("People also ask"))');
  if (shouldRemoveEl(targetPAADivV3, PeopleAlsoAsk)) {
    targetPAADivV3.remove();
  }
  const targetPlacesDivV3 = $('div.TzHB6b:has(div:contains("Places"))');
  if (shouldRemoveEl(targetPlacesDivV3, Places)) {
    targetPlacesDivV3.remove();
  }
  const targetVideosDivV3 = $('div.TzHB6b:has(div:contains("Videos"))');
  if (shouldRemoveEl(targetVideosDivV3, Videos)) {
    targetVideosDivV2.remove();
  }
  const targetBusinessesDivV3 = $('div.TzHB6b:has(div:contains("Businesses"))');
  if (shouldRemoveEl(targetBusinessesDivV3, Businesses)) {
    targetBusinessesDivV2.remove();
  }
  const targetSeeREsultsAboutDivV3 = $('div.TzHB6b:has(div:contains("See results about"))');
  if (shouldRemoveEl(targetSeeREsultsAboutDivV3, SeeREsultsAbout)) {
    targetSeeREsultsAboutDivV2.remove();
  }
  const targetLocationsDivV3 = $('div.TzHB6b:has(div:contains("Locations"))');
  if (shouldRemoveEl(targetLocationsDivV3, Locations)) {
    targetLocationsDivV3.remove();
  }

  // Adding new extra classes for the business
  const targetPAADivV4 = $('div.BNeawe:has(span:contains("People also ask"))');
  if (targetPAADivV4.length > 0) {
    targetPAADivV4.closest('div.Gx5Zad.xpd.EtOod.pkphOe').remove();
}

  // if still People also ask section exist
  const targetPAADivV5 = $('div:contains("People also ask")');
  targetPAADivV5.remove()
  $('a').find('img').closest('a').remove();

  // remove any ads with same classes (ads main class is different but for some cases it is begining to be same as serps in child classes)
  $('div.uEierd').remove();

  // load latest html
  $ = cheerio.load($.html())

  const links = [];
  const titles = [];
  const snippets = [];

  $(".yuRUbf > a").each((i, el) => {
    links[i] = $(el).attr("href");
  });
  $(".yuRUbf > a > h3").each((i, el) => {
    titles[i] = $(el).text();
  });
  $(".IsZvec").each((i, el) => {
    snippets[i] = $(el).text().trim();
  });
  if (!links.length) {
    $(".yuRUbf > div > a").each((i, el) => {
      links[i] = $(el).attr("href");
    });
    $(".yuRUbf > div > a > h3").each((i, el) => {
      titles[i] = $(el).text();
    });
    $(".IsZvec").each((i, el) => {
      snippets[i] = $(el).text().trim();
    });
  }
  if (!links.length) {
    $(".yuRUbf > div > span > a").each((i, el) => {
      links[i] = $(el).attr("href");
    });
    $(".yuRUbf > div > span > a > h3").each((i, el) => {
      titles[i] = $(el).text();
    });
    $(".IsZvec").each((i, el) => {
      snippets[i] = $(el).text().trim();
    });
  }
  // this selector exludes the map section
  if (!links.length) {
    $(".Gx5Zad > div > a").each((i, el) => {
      links[i] = $(el).attr("href");
    });
    $(".Gx5Zad > div> a > h3").each((i, el) => {
      titles[i] = $(el).text();
    });
    $(".Gx5Zad").each((i, el) => {
      snippets[i] = $(el).text().trim();
    });
  }

  const results = [];
  for (let i = 0; i < links.length; i++) {
   console.log(links[i], ' position: ', i);
    results[i] = {
      url: links[i],
      title: titles[i],
      snippet: snippets[i]
    };
  }
  return results;
};


exports.extractInternalLinks = (html_str) => {
    const $ = cheerio.load(html_str);
    const links = [];

    $("a").each((i, el) => {
    links[i] = $(el).attr("href");
    });
    return links;
};


class Result {
    fields = {
        domain: null,
        cachedUrl: null,
        similarUrl: null,
        position: null,
        linkType: null,
        sitelinks: null,
        snippet: null,
        title: null,
        url: null,
        featured: null,
    }
}

exports.getOrganic = function(html_str) {
    const $ = cheerio.load(html_str);

    const CONFIG = {
      results:
        '#search #rso > .g div .yuRUbf > a, #search #rso > .g.tF2Cxc .yuRUbf > a, #search #rso > .hlcw0c div .yuRUbf > a, #search #rso .kp-wholepage .g div .yuRUbf > a, #search #rso > div .g.jNVrwc.Y4pkMc div .yuRUbf > a',
    };

    var pos = 0;
    $(CONFIG.results).each((index, element) => {
        pos += 1;
      const position = pos;
      const url = $(element).prop('href');
      const domain = utils.getDomain(url);
      const title = this.elementText(element, 'h3');
      const snippet = this.getSnippet(element);
      const linkType = utils.getLinkType(url);
      const result =  Result({
        domain,
        linkType,
        position,
        snippet,
        title,
        url,
      })
      this.parseSitelinks(element, result);
      this.parseCachedAndSimilarUrls(element, result);
      this.serp.organic.push(result);
    });

}

exports.extractGMResults = (html_str, title) => {
    const $ = cheerio.load(html_str);
    const all = [];
    $("a.hfpxzc").each((idx, element) => {
        // If title matches, push it to arr;
        if ($(element).attr('aria-label').toLowerCase().trim() == title) {
            // Try to find the website link also;
            let website_link = $(element).parent().find('a.lcr4fd');
            console.log("website link!", website_link)
            if (website_link.length == 0) {
                website_link = null
            }
            all.push([idx, website_link]);
        };
    });
    if ($("div.PbZDve").length != 0 && all.length == 0) {
        throw new Error('Reached the end!');
    }
    return all;
}

exports.extractGBPosition = (html_str, substring) => {
    const $ = cheerio.load(html_str);
    const position = [];
    $("a.hfpxzc").each((idx, element) => {
        const href = $(element).attr('href');
        const business_name = $(element).attr('aria-label')
        // Check if the href contains the specified substring
        if (href && href.includes(substring)) {
            // Try to find the website link also;
            position.push([idx+1, business_name]);
        }
    });
    if ($("div.PbZDve").length != 0 && position.length == 0) {
        return position;
    }
    return position;
};


exports.extractPaidResults = (html_str) => {
    const $ = cheerio.load(html_str);
    const ads = [];
    // Keeping the old selector just in case.
    const oldAds = $('.ads-fr');
    const newAds = $('#tads > div');
    const newBottomAds = $('#tadsb > div');
    // Without Sponsored heading, It's like:
    const newAdsLayout = $('.uEierd > div > div > div')

    // Define an array containing the three lists
    const lists = [oldAds, newAds, newBottomAds, newAdsLayout];

    // Define a variable to hold the longest list
    let $ads = lists[0];

    // Loop through the array of lists to find the longest one
    for (let i = 1; i < lists.length; i++) {
        if (lists[i].length > $ads.length) {
            $ads = lists[i];
        }
    }

    $ads.each((_index, el) => {
        const siteLinks = [];
        $(el).find('w-ad-seller-rating').remove();
        $(el).find('a').not('[data-pcu]').not('[ping]')
            .each((_i, siteLinkEl) => {
                siteLinks.push({
                    title: $(siteLinkEl).text(),
                    url: $(siteLinkEl).attr('href'),
                    // Seems Google removed decription in the new layout, let's keep it for now though
                    ...extractDescriptionAndDate(
                        $(siteLinkEl).parent('div').parent('h3').parent('div')
                            .find('> div')
                            .toArray()
                            .map((d) => $(d).text())
                            .join(' ') || null,
                    ),
                });
            });

        const $heading = $(el).find('div[role=heading]');
        const $url = $heading.parent('a');
        const innerText = $(el).parent('div').text();
        const innerHTML = $(el).parent('div').html();

        // Keeping old description selector for now as it might work on different layouts, remove later
        const $newDescription = exports.getElementIfExists($(el), descriptionElementsSelector);
        const $oldDescription = $(el).find('> div > div > div > div > div').eq(1);

        const $description = $newDescription.length > 0 ? $newDescription : $oldDescription;
        if ($url.attr('href')) {
            console.log("here is the el", innerText)
            let displayUrl = exports.getElementIfExists($(el), displayURLElementsSelector)
            console.log("Display URl: " + displayUrl.text())

            ads.push({
                title: $heading.text(),
                url: $url.attr('href'),
                innerText: innerText.toLowerCase(),
                innerHTML: innerHTML,
                // The .eq(2) fixes getting "Ad." instead of the displayed URL.
                displayedUrl: displayUrl.text(),
                ...extractDescriptionAndDate($description.text()),
                emphasizedKeywords: $description.find('em, b').map((_i, element) => $(element).text().trim()).toArray(),
                siteLinks,
            });
        }
    });

    return ads;
};

exports.getElementIfExists = (element, selectors) => {
    for (let selector of selectors)
    {
        if(element.find(selector).length > 0) {
            console.log("Found element against selector " + selector)
            return element.find(selector);
        }
    }
    return "";
};

exports.extractPaidProducts = ($) => {
    const products = [];

    $('.commercial-unit-desktop-rhs .pla-unit').each((_i, el) => {
        const headingEl = $(el).find('[role="heading"]');
        const siblingEls = headingEl.nextAll();
        const displayedUrlEl = siblingEls.last();
        const prices = [];

        siblingEls.each((_index, siblingEl) => {
            if (siblingEl !== displayedUrlEl[0]) prices.push($(siblingEl).text());
        });

        products.push({
            title: headingEl.text(),
            url: headingEl.find('a').attr('href'),
            displayedUrl: displayedUrlEl.find('span').first().text(),
            prices,
        });
    });

    return products;
};

exports.extractTotalResults = ($) => {
    const wholeString = $('#resultStats').text() || $('#result-stats').text();
    // Remove text in brackets, get numbers as an array of strings from text "Přibližný počet výsledků: 6 730 000 000 (0,30 s)"
    const numberStrings = wholeString.split('(').shift().match(/(\d+(\.|,|\s))+/g);
    // Find the number with highest length (to filter page number values)
    const numberString = numberStrings ? numberStrings.sort((a, b) => b.length - a.length).shift().replace(/[^\d]/g, '') : 0;
    return Number(numberString);
};

exports.extractRelatedQueries = ($, hostname) => {
    const related = [];

    // 2021-02-25 - Tiny change #brs -> #bres
    $('#brs a, #bres a').each((_index, el) => {
        related.push({
            title: $(el).text(),
            url: ensureItsAbsoluteUrl($(el).attr('href'), hostname),
        });
    });

    return related;
};

exports.extractPeopleAlsoAsk = ($) => {
    return extractPeopleAlsoAsk($);
};

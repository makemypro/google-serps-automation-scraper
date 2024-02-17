const cheerio = require("cheerio");
const fs = require('fs');
const google_actions = require('../../cdp/google_actions');
const google_desktop = require('../../extractors/google_desktop');
const assert = require('assert');

// position starting from 0
testData = [
    {'filePath': 'thearenagym.html', 'organicTargetDomain': 'thearenagym.com', 'expectedPosition': 2},
    {'filePath': 'buytelephonesystem.html', 'organicTargetDomain': 'buytelephonesystem.com', 'expectedPosition': 1},
    {'filePath': 'actexasllc.html', 'organicTargetDomain': 'actexasllc.com', 'expectedPosition': 0},
    {'filePath': 'prolinkworks.html', 'organicTargetDomain': 'prolinkworks.com', 'expectedPosition': 5},
    {'filePath': 'uc.html', 'organicTargetDomain': 'uc.edu', 'expectedPosition': 8},
    {'filePath': 'sandiegolandscapingturf.html', 'organicTargetDomain': 'sandiegolandscapingturf.com', 'expectedPosition': 0},
    {'filePath': 'doiggs.html', 'organicTargetDomain': 'doiggs.com', 'expectedPosition': 0},
    {'filePath': 'balanceoflifeclinic.html', 'organicTargetDomain': 'balanceoflifeclinic.com', 'expectedPosition': 0},
    {'filePath': 'therapistsincharlotte.html', 'organicTargetDomain': 'therapistsincharlotte.com', 'expectedPosition': 4},
    {'filePath': 'electricgolfcarcompany.html', 'organicTargetDomain': 'electricgolfcarcompany.com', 'expectedPosition': 5},
    {'filePath': 'ecri.html', 'organicTargetDomain': 'ecri.org', 'expectedPosition': 0},
    {'filePath': 'linkedin.html', 'organicTargetDomain': 'linkedin.com', 'expectedPosition': 6},
    {'filePath': 'therapygroupdc.html', 'organicTargetDomain': 'therapygroupdc.com', 'expectedPosition': 0},
    {'filePath': 'bulletproofit.html', 'organicTargetDomain': 'bulletproofit.ca', 'expectedPosition': 6},
    {'filePath': 'linkgraph.html', 'organicTargetDomain': 'linkgraph.com', 'expectedPosition': 1},
    {'filePath': 'curiousants.html', 'organicTargetDomain': 'curiousants.com', 'expectedPosition': 0},
    {'filePath': 'workinnorthernvirginia.html', 'organicTargetDomain': 'workinnorthernvirginia.com', 'expectedPosition': 10},
    {'filePath': 'muscularmovingmen.html', 'organicTargetDomain': 'muscularmovingmen.com', 'expectedPosition': 0},
    {'filePath': 'telstraventures.html', 'organicTargetDomain': 'telstraventures.com', 'expectedPosition': 0},
    {'filePath': 'nad.html', 'organicTargetDomain': 'nad.com', 'expectedPosition': 7},
]

for (var i = 0; i < testData.length; i++) {
    let organicTargetDomain = testData[i].organicTargetDomain;
    let filePath = testData[i].filePath;
    let expectedPosition = testData[i].expectedPosition;
    let html = fs.readFile(filePath, "utf-8", async (err, data) => {
        console.log(`----------------------------------------------${filePath}--------------------------------------------------`)
        const organic_results = google_desktop.extractOrganicResultsForPosition(data);
        const position = await google_actions.getPositionOfDomainInSERPs(organic_results, organicTargetDomain);
        console.log(`SERP Position for ${organicTargetDomain} is ${position + 1} and expected position is ${expectedPosition + 1}`)
        assert.strictEqual(position + 1, expectedPosition + 1, `Position should be ${expectedPosition}`);
     });
}

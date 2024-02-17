const CDP = require('chrome-remote-interface');
const browser_utils = require("../cdp/browser_utils");
const utils = require("../utils");


const run = async function() {
    // 1) DONE - test that paid blocklist does prevent clicking on domain
    // 2) DONE - verify page action successful
    // 3) go to second page of Google
    // 4) DONE - log actions taken

    // let current_ip = get_current_ip();
    var client = await browser_utils.startChrome();
        var {Network, Page, Runtime, Input, DOM, Emulation} = client;
        await Network.enable();
        await Page.enable();
        await DOM.enable();

        let tabobj = await browser_utils.loadPageInTab("https://www.crunchbase.com/organization/zameen-com", client);
        await Network.loadingFinished();
        await utils.sleep(500);

        coords = await browser_utils.getCoords('body');
        console.log("Body Coordinates", coords)
        screenshot = await capture_captcha_screenshot(Page, coords, `tests/test.png`);
        console.log("screen Shot", screenshot)
};

if (require.main === module) {
  run();
}

async function capture_captcha_screenshot(Page, captcha_coords, imagePath='./image.jpeg'){

  // Get the dimensions of the entire page
    const { root: { nodeId } } = await Page.getDocument();
  const { model: { height } } = await Page.getLayoutMetrics();

  // Set the viewport size to match the entire page
  await Page.setViewport({ width: 1200, height: Math.ceil(height) });

  // Create an array to store the screenshot data
  const screenshots = [];

  // Set the initial scroll position
  let scrollY = 0;

  while (scrollY < height) {
    // Scroll the page
    await Page.evaluate(scrollY => window.scrollTo(0, scrollY), scrollY);

    // Capture a screenshot
    const { data } = await Page.captureScreenshot();
    screenshots.push(Buffer.from(data, 'base64'));

    // Increment the scroll position
    scrollY += 1200; // You can adjust the scroll increment as needed
  }

  // Concatenate the screenshots vertically to create a full-page screenshot
  const fullPageScreenshot = Buffer.concat(screenshots);
  // Concatenate the screenshots vertically to create a full-page screenshot
  // Save the full-page screenshot as a file
  fs.writeFileSync('fullpage_screenshot.jpg', fullPageScreenshot);



    return fullPageScreenshot.data

}
const axios = require('axios');
const puppeteer = require('puppeteer-core');

const getPower = async function () {
let config = {
  method: 'get',
  maxBodyLength: Infinity,
  url: 'http://local.adspower.net:50325/api/v1/browser/start?user_id=jc1n3ub&launch_args=["--remote-debugging-port=9222", "-no-sandbox", "--disable-notifications", "--start-maximized", "--no-first-run", "--no-default-browser-check", "--disable-dev-shm-usage", "-incognito"]',
  headers: { }
};
axios.get(config).then(async (res) => {
  console.log(res.data);
  if(res.data.code === 0 && res.data.data.ws && res.data.data.ws.puppeteer) {
    try{
      const browser = await puppeteer.connect(
        {browserWSEndpoint: res.data.data.ws.puppeteer, executablePath: '/usr/bin/google-chrome', defaultViewport:null});
        const page = await browser.newPage();
        await page.goto('https://www.adspower.io');
        await browser.close();
    } catch(err){
        console.log(err.message);
    }
  }
}).catch((err) => {
	console.log(err)
})
}
              
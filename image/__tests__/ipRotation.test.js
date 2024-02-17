const axios = require('axios');


describe('IP Rotation', () => {
  beforeAll(async () => {})
  afterAll(async () => {})

  test('IP Rotation', async () => {
    // 1) Check current IP address
    var checkUrl = 'https://checkip.amazonaws.com';
    var previousIp = axios.get(checkUrl).data;
    // 2) Hit the rotate endpoint to get the new Ip
    axios.get('https://dashboard.iproyal.com/api/4g-mobile-proxies/rotate-ip/yIkjeip6Q8A6')
    // 3) Check current IP address
    var currentIp = axios.get(checkUrl).data;
    // 4) Check if IP got rotatetd
    expect(previousIp).not.toBe(currentIp);
  })
})


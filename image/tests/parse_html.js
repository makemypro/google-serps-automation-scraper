const cheerio = require("cheerio");

async function parse_html(html){
    const $ = cheerio.load(html);
    $('div.cUnQKe').remove();
    const listItems = $("#rso div > div > div > div > div > a");

    const pars_data = [];
    let position = 1;

    listItems.each((index, el) => {
        const scrapItem = { name: '', title: '', url: '', position: 0 };

        let title = $(el).children('h3').text();
        let name = $(el).children('div').children('div').children('span').text();
        let url = $(el).children('div').children('div').children('div').children('cite').text().split('›')[0];

        // Check if any of the required fields are empty
        if (title && name && url) {
        scrapItem.title = title;
        scrapItem.name = name
        scrapItem.url = url
        scrapItem.position = position;
        pars_data.push(scrapItem);
        position++;
        }

});

    return pars_data;
};
exports.parse_html = parse_html;
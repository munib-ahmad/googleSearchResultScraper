const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const csv = require('csv-parser');
const fs = require('fs');


const parseCSV = () => {
  let results = []
  return new Promise( resolve => {
      fs.createReadStream('keywords.csv')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
              resolve(results)
      })
  })
}
 
(async function () {
  const browser = await puppeteer.launch({headless:false});
  const page = await browser.newPage();
  let data = await parseCSV()
  let allLinks = []
  for (let index = 0; index < data.length; index++) {
    await new Promise(async next => {
      console.log(index,data[index].keyword)
      await page.goto(`https://www.google.com/search?q=${data[index].keyword}&num=15`,{waitUntil: 'networkidle2'});
      let results = await page.content()
      const $ = cheerio.load(results)
      let links = []
      $("#rso div > div.r > a").slice(0,10).each( function () {
        var link = $(this).attr('href');
        links.push({keyword:data[index].keyword,"link": link});
      });
      allLinks.push(links);
      next()
    })
  };
  await browser.close();
  let linkJSON = JSON.stringify(allLinks);
  fs.writeFileSync('results.json', linkJSON);
  console.log("Finished")
}());
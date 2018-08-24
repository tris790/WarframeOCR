let fetch = require("isomorphic-fetch");
const fs = require("fs");
const itemNames = require("./db/primepartnames.json");
let sleep = time => new Promise(resolve => setTimeout(() => resolve(), time));

function calcAvg(stats) {
    return stats.reduce((prev, cur) => prev + cur.avg_price, 0) / stats.length;
}

function nameToWfMarketName(name) {
    return name.toLowerCase().replace(/ /g, "_");
}

async function fetchPrices(items) {
    let db = [];
    for (item of items) {
        const name = nameToWfMarketName(item);
        await fetch(`https://api.warframe.market/v1/items/${name}/statistics`)
            .then(res => res.json())
            .then(json => {
                const statsLong = json.payload.statistics["90days"];
                const statsShort = json.payload.statistics["48hours"];

                const avgPriceLong = calcAvg(statsLong);
                const avgPriceShort = calcAvg(statsShort);
                // console.log(name, avgPriceLong, avgPriceShort);
                db.push({ name, avgPriceLong, avgPriceShort });
            })
            .catch(e => console.log(e));
        await sleep(1000);
    }

    const content = JSON.stringify(db);
    fs.writeFile("./db/primepartsprices.json", content, "utf8", function(err) {
        if (err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
}

fetchPrices(itemNames);

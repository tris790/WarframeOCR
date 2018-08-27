let fetch = require("isomorphic-fetch");
const fs = require("fs");
const itemNames = require("./db/myitems.json");
let sleep = time => new Promise(resolve => setTimeout(() => resolve(), time));
let db = [];

function calcAvg(stats) {
    return stats.reduce((prev, cur) => prev + cur.avg_price, 0) / stats.length;
}

function nameToWfMarketName(name) {
    return name
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/ /g, "_");
}

function analysePrices(json, name) {
    const statsLong = json.payload.statistics["90days"];
    const statsShort = json.payload.statistics["48hours"];

    const avgPriceLong = calcAvg(statsLong);
    const avgPriceShort = calcAvg(statsShort);
    // console.log(name, avgPriceLong, avgPriceShort);
    db.push({ name, avgPriceLong, avgPriceShort });
}

async function fetchPrices(items) {
    for (item of items) {
        const name = nameToWfMarketName(item);
        await fetch(`https://api.warframe.market/v1/items/${name}/statistics`)
            .then(res => res.json())
            .then(async json => {
                if (json.payload) {
                    analysePrices(json, name);
                } else {
                    const nameWithoutBlueprint = name.replace("_blueprint", "");
                    await fetch(
                        `https://api.warframe.market/v1/items/${nameWithoutBlueprint}/statistics`
                    )
                        .then(res => res.json())
                        .then(json => {
                            analysePrices(json, name);
                        });
                }
            })
            .catch(e => console.log(name + "=> " + e));
        // await sleep(1000);
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

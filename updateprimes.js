let fetch = require("isomorphic-fetch");
const fs = require("fs");

fetch("https://drops.warframestat.us/data/relics.json")
    .then(x => x.json())
    .then(json => {
        const primeparts = Array.from(
            json.relics
                .reduce((prev, cur) => {
                    prev.push(...cur.rewards);
                    return prev;
                }, [])
                .reduce((prev, cur) => prev.add(cur.itemName), new Set())
        );
        const content = JSON.stringify(primeparts);
        fs.writeFile("./db/primepartnames.json", content, "utf8", function(
            err
        ) {
            if (err) {
                return console.log(err);
            }

            console.log("The file was saved!");
        });
    });

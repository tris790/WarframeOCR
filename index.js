let Tesseract = require("tesseract.js");
let robot = require("robotjs");
let jimp = require("jimp");
let primeDB = require("./db/primepartnames.json");
const fs = require("fs");
const util = require("util");

const INITIAL_OFFSET = { x: 180, y: 280 };
const ITEM_COL_COUNT = 4;
const ITEM_ROW_COUNT = 6;

const TITLE_POS = { x: 276, y: 200, w: 418, h: 78 };

let sleep = time => new Promise(resolve => setTimeout(() => resolve(), time));

let main = async () => {
    let result = [];
    let size = robot.getScreenSize();
    await sleep(1000);
    // Initial position
    robot.moveMouseSmooth(INITIAL_OFFSET.x, INITIAL_OFFSET.y);

    // Loop through items
    console.time("execution");
    let rowIsFullOfItem = true;
    let currentRow = 0;
    for (let scrollCount = 0; rowIsFullOfItem; scrollCount++) {
        for (let y = 0; y < ITEM_COL_COUNT; y++, currentRow++) {
            if (!rowIsFullOfItem) {
                console.log("we are done");
                break;
            }
            for (let x = 0; x < ITEM_ROW_COUNT; x++) {
                let zigZagPos = y % 2 == 0 ? x : ITEM_ROW_COUNT - 1 - x;
                let cursorX = INITIAL_OFFSET.x + zigZagPos * 200;
                let cursorY = INITIAL_OFFSET.y + y * 200;
                robot.moveMouseSmooth(cursorX, cursorY);

                const posOfTitleX = cursorX + 95;
                const posOfTitleY = cursorY - 100;
                await sleep(250);
                let img = robot.screen.capture(
                    posOfTitleX,
                    posOfTitleY,
                    TITLE_POS.w,
                    TITLE_POS.h
                );
                let jImg = await rawToJimp(img);
                let buf = await jImg.getBufferAsync(jimp.MIME_PNG);
                const coordsX_Y = `${currentRow}_${zigZagPos}`;
                //console.log("coords:", coordsX_Y, "mouse", robot.getMousePos());

                jImg.writeAsync(`captures\\${coordsX_Y}.png`);
                await Tesseract.recognize(buf)
                    .then(prediction => {
                        prediction = prediction.text.trim();
                        console.log("prediction", prediction);
                        if (prediction.toLowerCase().includes("prime")) {
                            result.push(prediction);
                        } else {
                            rowIsFullOfItem = false;
                            console.log("row has empty item");
                        }
                    })
                    .catch(e => console.log(e));
            }
        }

        for (let y = 0; y < ITEM_COL_COUNT; y++) {
            robot.scrollMouse(0, -50);
            await sleep(50);
        }
        robot.moveMouseSmooth(INITIAL_OFFSET.x, INITIAL_OFFSET.y);
    }
    let cleanedData = result.map(x => x.replace("\n", " "));
    let finalResult = [];
    //console.log(cleanedData, primeDB);
    for (item of cleanedData) {
        const res = primeDB.find(x =>
            item.toLowerCase().includes(x.toLowerCase())
        );
        console.log(res);
        if (res) finalResult.push(res);
    }
    console.log("done", "(" + finalResult.length + ")");
    const content = JSON.stringify(finalResult);

    const writeFile = util.promisify(fs.writeFile);
    await writeFile("./db/myitems.json", content, "utf8");
    console.timeEnd("execution");
    process.exit();
};
main();

function rawToJimp(img) {
    let jimg = new jimp(img.width, img.height);
    for (let x = 0; x < img.width; x++) {
        for (let y = 0; y < img.height; y++) {
            let index = y * img.byteWidth + x * img.bytesPerPixel;
            let r = img.image[index];
            let g = img.image[index + 1];
            let b = img.image[index + 2];
            let num = r * 256 + g * 256 * 256 + b * 256 * 256 * 256 + 255;
            jimg.setPixelColor(num, x, y);
        }
    }
    return jimg;
}

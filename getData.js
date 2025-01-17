async function getData() { 
    // A function to fetch files from github using the api 

    let url = "https://raw.githubusercontent.com/kevinjycui/bad-apple/refs/heads/master/file-explorer/data.json";
    // let url = "https://raw.githubusercontent.com/skanehira/badapple.vim/refs/heads/master/resources/badapple.txt";
    let res = await fetch(url);
    let data = await res.json();

    return data;
}

function showSong(data) {
    function showFrame() {
        for (let i = 0; i < data[a].length; i++) {
            let line = "";
            for (let j = 0; j < data[a][i].length; j++) {
                line += data[a][i][j];
            }
            console.log(line);
        }
        console.log();
        a++;
    }
    let a = 0;
    setInterval(showFrame, 50);
}

async function start() {
    let data = await getData();
    let fs = require('fs');

    let properData = "let data = [";
    for (let i = 0; i < data.length; i++) {
        if (i > 0) {
            properData += ",";
        }
        let frame = "[";
        for (let j = 0; j < data[i].length; j++) {
            if (j > 0) {
                frame += ",";
            }
            let row = "'";
            for (let k = 0; k < data[i][j].length; k++) {
                row += data[i][j][k].toString();
            }
            row += "'";
            frame += row;
        }
        frame += "]";
        properData += frame;
    }
    properData += "];";

    fs.writeFileSync("data.js", properData);
}
start();
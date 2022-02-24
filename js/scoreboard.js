function httpGet() {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "http://localhost:15486/getScores", false); // false for synchronous request
    xmlHttp.send(null);
    let scores = JSON.parse(xmlHttp.responseText)
    displayLeaderboard(scores)
}

function displayLeaderboard(data) {
    let html = "";
    data = sortLeaderboard(data)
    for (let game of data) {
        html += `
        <tr><td>${game.player}</td>
        <td>${game.score}</td></tr>
    `;
    }
    document.querySelector('#thingy').innerHTML = html;
}

function sortLeaderboard(arr) { // Sort scores in descending order
    arr.sort(function (a, b) {
        return b.score - a.score;
    });
    return arr;
}

httpGet()

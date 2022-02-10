function httpGet() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "http://localhost:15486/getScores", false); // false for synchronous request
    xmlHttp.send(null);
    let scores = JSON.parse(xmlHttp.responseText)
    displayLeaderboard(scores)
}

function displayLeaderboard(data) {
    let html = "";
    for (let game of data) {
        console.log(game)
        html += `
        <tr><td>${game.player}</td>
        <td>${game.score}</td></tr>
    `;
    }
    console.log(html)
    document.querySelector('#thingy').innerHTML = html;
}

httpGet()

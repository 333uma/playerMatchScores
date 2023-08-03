const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    console.log(`Error ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertPlayerObjectToResponseObject = (playerObject) => {
  return {
    playerId: playerObject.player_id,
    playerName: playerObject.player_name,
  };
};

const convertMatchObjectToResponseObject = (matchObject) => {
  return {
    matchId: matchObject.match_id,
    match: matchObject.match,
    year: matchObject.year,
  };
};

//getting players
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details ORDER BY player_id`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerObjectToResponseObject(eachPlayer)
    )
  );
});

//getting player by player_id
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerByIdQuery = `SELECT * FROM player_details WHERE player_id = ${playerId}`;
  const getPlayerById = await db.get(getPlayerByIdQuery);
  response.send({
    playerId: getPlayerById.player_id,
    playerName: getPlayerById.player_name,
  });
});

//updating player by playerId
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerByIdQuery = `UPDATE player_details
                                    SET player_name = '${playerName}'`;
  const updatePlayerById = await db.run(updatePlayerByIdQuery);
  response.send("Player Details Updated");
});

//getting matchDetails by match_id
app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const getMatchByIdQuery = `SELECT * FROM match_details WHERE match_id = ${matchId}`;
  const getMatchById = await db.get(getMatchByIdQuery);
  response.send({
    matchId: getMatchById.match_id,
    match: getMatchById.match,
    year: getMatchById.year,
  });
});

//getting match details of a player by player_id
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesByPlayerIdQuery = `SELECT * FROM match_details NATURAL JOIN player_match_score WHERE player_id = ${playerId}`;
  const matchesArray = await db.all(getMatchesByPlayerIdQuery);
  response.send(
    matchesArray.map((eachMatch) =>
      convertMatchObjectToResponseObject(eachMatch)
    )
  );
});

//getting players details of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playersArray = await db.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerObjectToResponseObject(eachPlayer)
    )
  );
});

//getting player statistics
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getmatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await db.get(getmatchPlayersQuery);
  response.send(playersMatchDetails);
});

module.exports = app;

const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const path = require("path");
const dbpath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const convert_player_dBobj_into_responseObj = (dbobj) => {
  return {
    playerId: dbobj.player_id,
    playerName: dbobj.player_name,
  };
};
const convert_match_dBobj_into_responseObj = (dbobj) => {
  return {
    matchId: dbobj.match_id,
    match: dbobj.match,
    year: dbobj.year,
  };
};
const convert_score_dBobj_into_responseObj = (dbobj) => {
  return {
    playerMatchId: dbobj.player_match_id,
    playerId: dbobj.player_id,
    matchId: dbobj.match_id,
    score: dbobj.score,
    fours: dbobj.fours,
    sixes: dbobj.sixes,
  };
};
const dbserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("App is running good");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
  }
};
dbserver();
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await db.all(getPlayerQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convert_player_dBobj_into_responseObj(eachPlayer)
    )
  );
});
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      *
    FROM 
      player_details 
    WHERE 
      player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convert_player_dBobj_into_responseObj(player));
});
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name ='${playerName}'
  WHERE
    player_id = ${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});
app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const dbquery = `
    select * from match_details where match_id=${matchId};`;
  const dbresponse = await db.get(dbquery);
  response.send(convert_match_dBobj_into_responseObj(dbresponse));
});
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const dbquery = `
    select * from match_details natural join player_match_score
    where player_id=${playerId};`;
  const dbresp = await db.all(dbquery);
  response.send(
    dbresp.map((eachplayer) => convert_match_dBobj_into_responseObj(eachplayer))
  );
});
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const dbquery = `
    select * from 
    player_details natural join player_match_score
    where match_id=${matchId};
    `;
  const dbresp = await db.all(dbquery);
  response.send(
    dbresp.map((eachPlayer) =>
      convert_player_dBobj_into_responseObj(eachPlayer)
    )
  );
});
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const dbquery = `
select player_id as playerId,player_name as playerName,sum(score) as totalScore,
sum(fours) as totalFours,sum(sixes) as totalSixes from
player_match_score natural join player_details
where player_id=${playerId};
`;
  const dbresp = await db.get(dbquery);
  response.send(dbresp);
});
module.exports = app;

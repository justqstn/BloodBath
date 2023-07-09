//let Color = importNamespace('PixelCombats.ScriptingApi.Structures');
//let System = importNamespace('System');

// êîíñòàíòû
let WaitingPlayersTime = 2;
let BuildBaseTime = 2;
let GameModeTime = 2;
let EndOfMatchTime = 20;

// êîíñòàíòû èìåí
let WaitingStateValue = "Waiting";
let BuildModeStateValue = "BuildMode";
let GameStateValue = "Game";
let EndOfMatchStateValue = "EndOfMatch";

// ïîñòîÿííûå ïåðåìåííûå
let mainTimer = Timers.GetContext().Get("Main");
let stateProp = Properties.GetContext().Get("State");
let saved_id = Properties.GetContext().Get("saved");
saved_id.Value = "";

// ïðèìåíÿåì ïàðàìåòðû ñîçäàíèÿ êîìíàòû
Damage.FriendlyFire = GameMode.Parameters.GetBool("FriendlyFire");
Map.Rotation = GameMode.Parameters.GetBool("MapRotation");
BreackGraph.OnlyPlayerBlocksDmg = GameMode.Parameters.GetBool("PartialDesruction");
BreackGraph.WeakBlocks = GameMode.Parameters.GetBool("LoosenBlocks");

// áëîê èãðîêà âñåãäà óñèëåí
BreackGraph.PlayerBlockBoost = true;

// ïàðàìåòðû èãðû
Properties.GetContext().GameModeName.Value = "GameModes/Team Dead Match";
TeamsBalancer.IsAutoBalance = true;
Ui.GetContext().MainTimerId.Value = mainTimer.Id;
// ñîçäàåì êîìàíäû
Teams.Add("Blue", "<i><B><size=38>С</size><size=30>иние</size></B>\nкровавая баня</i>", { b: 0.75 });
Teams.Add("Red", "<i><B><size=38>К</size><size=30>расные</size></B>\nкровавая баня</i>", { r: 0.75 });
let blueTeam = Teams.Get("Blue");
let redTeam = Teams.Get("Red");
blueTeam.Spawns.SpawnPointsGroups.Add(1);
redTeam.Spawns.SpawnPointsGroups.Add(2);
blueTeam.Build.BlocksSet.Value = BuildBlocksSet.Blue;
redTeam.Build.BlocksSet.Value = BuildBlocksSet.Red;

// çàäàåì ìàêñ ñìåðòåé êîìàíä
let maxDeaths = Players.MaxCount * 5;
Teams.Get("Red").Properties.Get("Deaths").Value = maxDeaths;
Teams.Get("Blue").Properties.Get("Deaths").Value = maxDeaths;
// çàäàåì ÷òî âûâîäèòü â ëèäåðáîðäàõ
LeaderBoard.PlayerLeaderBoardValues = [
	{
		Value: "Kills",
		DisplayName: "Statistics/Kills",
		ShortDisplayName: "Statistics/KillsShort"
	},
	{
		Value: "Deaths",
		DisplayName: "Statistics/Deaths",
		ShortDisplayName: "Statistics/DeathsShort"
	},
	{
		Value: "Scores",
		DisplayName: "О",
		ShortDisplayName: "О"
	},
	{
		Value: "KD",
		DisplayName: "K/D",
		ShortDisplayName: "K/D"
	}
];
LeaderBoard.TeamLeaderBoardValue = {
	Value: "Deaths",
	DisplayName: "Statistics\Deaths",
	ShortDisplayName: "Statistics\Deaths"
};
// âåñ êîìàíäû â ëèäåðáîðäå
LeaderBoard.TeamWeightGetter.Set(function(team) {
	return team.Properties.Get("Deaths").Value;
});
// âåñ èãðîêà â ëèäåðáîðäå
LeaderBoard.PlayersWeightGetter.Set(function(player) {
	return player.Properties.Get("Kills").Value;
});

// çàäàåì ÷òî âûâîäèòü ââåðõó
Ui.GetContext().TeamProp1.Value = { Team: "Blue", Prop: "Deaths" };
Ui.GetContext().TeamProp2.Value = { Team: "Red", Prop: "Deaths" };

// ðàçðåøàåì âõîä â êîìàíäû ïî çàïðîñó
const props = ["Kills", "Deaths", "Scores", "KD"];
Teams.OnRequestJoinTeam.Add(function(player,team){
	for (indx in props) {
        player.Properties.Get(props[indx]).Value = Properties.GetContext().Get(props[indx] + player.Id).Value || 0;
		Properties.GetContext().Get(props[indx] + player.Id).Value = null;
		saved_id.Value.replace(player.Id + "/", "");
    }
	team.Add(player);
});
// ñïàâí ïî âõîäó â êîìàíäó
Teams.OnPlayerChangeTeam.Add(function(player){ player.Spawns.Spawn()});

Players.OnPlayerDisconnected.Add(function(player) {
    for (indx in props) {
        Properties.GetContext().Get(props[indx] + player.Id).Value = player.Properties.Get(props[indx]).Value;
	    saved_id.Value += player.Id + "/";
    }
});

// äåëàåì èãðîêîâ íåóÿçâèìûìè ïîñëå ñïàâíà
let immortalityTimerName="immortality";
Spawns.GetContext().OnSpawn.Add(function(player){
	player.Properties.Immortality.Value=true;
	timer=player.Timers.Get(immortalityTimerName).Restart(5);
});
Timers.OnPlayerTimer.Add(function(timer){
    if (timer.Id == "combo") {
        timer.Player.Properties.Get("combo").Value = 0;
    }
	else if (timer.Id == immortalityTimerName) {
        timer.Player.Properties.Immortality.Value=false;
    }
});

// ïîñëå êàæäîé ñìåðòè èãðîêà îòíèìàåì îäíó ñìåðòü â êîìàíäå
Properties.OnPlayerProperty.Add(function(context, value) {
	if (value.Name !== "Deaths") return;
	if (context.Player.Team == null) return;
	context.Player.Team.Properties.Get("Deaths").Value--;
});
// åñëè â êîìàíäå êîëè÷åñòâî ñìåðòåé çàíóëèëîñü òî çàâåðøàåì èãðó
Properties.OnTeamProperty.Add(function(context, value) {
	if (value.Name !== "Deaths") return;
	if (value.Value <= 0) SetEndOfMatchMode();
});

// ñ÷åò÷èê ñïàâíîâ
Spawns.OnSpawn.Add(function(player) {
	++player.Properties.Spawns.Value;
});
// ñ÷åò÷èê ñìåðòåé
Damage.OnDeath.Add(function(player) {
	++player.Properties.Deaths.Value;
  	player.Properties.Get("KD").Value = player.Properties.Deaths.Value > 0 ? Math.round(player.Properties.Kills.Value / player.Properties.Deaths.Value * 100) / 100 : player.Properties.Kills.Value;
});
// ñ÷åò÷èê óáèéñòâ
Damage.OnKill.Add(function(player, killed) {
	if (killed.Team != player.Team) {
        	player.Properties.Get("combo").Value += 1;
		++player.Properties.Kills.Value;
		player.Properties.Get("KD").Value = player.Properties.Deaths.Value > 0 ? Math.round(player.Properties.Kills.Value / player.Properties.Deaths.Value * 100) / 100 : player.Properties.Kills.Value;
        	player.Properties.Scores.Value += 100 * player.Properties.Get("combo").Value;
        	player.Timers.Get("combo").Restart(4);
	}
});

// íàñòðîéêà ïåðåêëþ÷åíèÿ ðåæèìîâ
mainTimer.OnTimer.Add(function() {
	switch (stateProp.Value) {
	case WaitingStateValue:
		SetBuildMode();
		break;
	case BuildModeStateValue:
		SetGameMode();
		break;
	case GameStateValue:
		SetEndOfMatchMode();
		break;
	case EndOfMatchStateValue:
		RestartGame();
		break;
	}
});

// çàäàåì ïåðâîå èãðîâîå ñîñòîÿíèå
SetWaitingMode();

function CalculateBest(name) {
	let enm = Players.GetEnumerator();
    this.id = "";
	this.nickname = "";
	this.score = -1;
    while (enm.moveNext()) {
        if (enm.Current.Properties.Get(name).Value > this.score) {
            this.score = enm.Current.Properties.Get(name).Value
            this.id = enm.Current.Id;
			this.nickname = enm.Current.NickName;
        }
    }
}

// ñîñòîÿíèÿ èãðû
function SetWaitingMode() {
	stateProp.Value = WaitingStateValue;
	Ui.GetContext().Hint.Value = "Hint/WaitingPlayers";
	Spawns.GetContext().enable = false;
	mainTimer.Restart(WaitingPlayersTime);
}

function SetBuildMode() 
{
	stateProp.Value = BuildModeStateValue;
	Ui.GetContext().Hint.Value = "Hint/BuildBase";
	let inventory = Inventory.GetContext();
	inventory.Main.Value = false;
	inventory.Secondary.Value = false;
	inventory.Melee.Value = true;
	inventory.Explosive.Value = false;
	inventory.Build.Value = true;

	mainTimer.Restart(BuildBaseTime);
	Spawns.GetContext().enable = true;
	SpawnTeams();
}
function SetGameMode() 
{
	stateProp.Value = GameStateValue;
	Ui.GetContext().Hint.Value = "Hint/AttackEnemies";

	let inventory = Inventory.GetContext();
	if (GameMode.Parameters.GetBool("OnlyKnives")) {
		inventory.Main.Value = false;
		inventory.Secondary.Value = false;
		inventory.Melee.Value = true;
		inventory.Explosive.Value = false;
		inventory.Build.Value = true;
	} else {
		inventory.Main.Value = true;
		inventory.Secondary.Value = true;
		inventory.Melee.Value = true;
		inventory.Explosive.Value = true;
		inventory.Build.Value = true;
	}
	msg.Show(JSON.stringify(new CalculateBest("Kills")));
	
	mainTimer.Restart(GameModeTime);
	Spawns.GetContext().Despawn();
	SpawnTeams();
}
function SetEndOfMatchMode() {
    try {
        let saved_id_arr = saved_id.Value.split("/");
        for (indx in saved_id_arr) {
            for (i in props) {
                Properties.GetContext().Get(props[i] + saved_id_arr[indx]).Value = null;
            }
        }

        msg.Show(JSON.stringify(new CalculateBest("Kills")));

        //msg.Show("<B>Топ-1 по убийствам:</B> " + top1_kills.nick + "\n<i>Счет: " + top1_kills.val + "</i>\n\n\n<B>Топ-1 по K/D:</B> " + top1_kd.nick + "\n<i>Счет: " + top1_kd.val + "</i>\n\n\n<B>Топ-1 по очкам:</B> " + top1_scores.nick + "\n<i>Счет: " + top1_scores.val);

        stateProp.Value = EndOfMatchStateValue;
        Ui.GetContext().Hint.Value = "Hint/EndOfMatch";

        let spawns = Spawns.GetContext();
        spawns.enable = false;
        spawns.Despawn();
        Game.GameOver(LeaderBoard.GetTeams());
        mainTimer.Restart(EndOfMatchTime);
    } catch(e) { msg.Show(e.name + " " + e.message); }
}
function RestartGame() {
	Game.RestartGame();
}

function SpawnTeams() {
	let e = Teams.GetEnumerator();
	while (e.moveNext()) {
		Spawns.GetContext(e.Current).Spawn();
	}
}

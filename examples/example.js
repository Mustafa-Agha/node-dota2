var steam = require('node-steam'),
  SteamUser = require('node-steam-user'),
  SteamFriends = require('node-steam-friends'),
  fs = require('fs'),
  crypto = require('crypto'),
  dota2 = require('../'),
  steamClient = new steam.SteamClient(),
  steamUser = new SteamUser(steamClient),
  steamFriends = new SteamFriends(steamClient),
  Dota2 = new dota2.Dota2Client(steamClient, true);

// Load config
global.config = require('./config');

/* Steam logic */
var onSteamLogOn = function onSteamLogOn(logonResp) {
    if (logonResp.eresult == steam.EResult.OK) {
      steamFriends.setPersonaState(steam.EPersonaState.Busy); // to display your steamClient's status as "Online"
      steamFriends.setPersonaName(global.config.steam_name); // to change its nickname
      console.log('Logged on.');
      Dota2.launch();

      Dota2.on('ready', function () {
        console.log('Node-dota2 ready.');

        // #5d23d4 INVENTORY
        // Dota2.setItemPositions([[ITEM ID, POSITION]]);
        // Dota2.deleteItem(ITEM ID);

        // #5d23d4 MATCHES
        // Dota2.requestMatchDetails(246546269);
        // Dota2.on('matchDetailsData', function (matchId, matchData) {
        //   console.log(JSON.stringify(matchData, null, 2));
        // });

        // Dota2.requestMatchmakingStats();
        // Dota2.on(
        //   'matchmakingStatsData',
        //   function (searchingPlayersByGroup, disabledGroups, matchmakingStatsResponse) {
        //     console.log(JSON.stringify(matchmakingStatsResponse, null, 2));
        //   }
        // );

        // Dota2.requestMatchDetails(246546269, function (err, body) {
        //   if (err) {
        //     console.error('[EVENT] [READY] [ERROR]', err);
        //     return;
        //   }
        //   console.log(JSON.stringify(body));
        // });

        // #5d23d4 LOBBIES
        const lobbyOptions = {
          game_name: 'test06-node-dota2',
          server_region: dota2.ServerRegion.EUROPE,
          game_mode: dota2.schema.DOTA_GameMode.DOTA_GAMEMODE_AR,
          series_type: 2,
          game_version: 1,
          allow_cheats: false,
          fill_with_bots: false,
          allow_spectating: true,
          pass_key: 'password',
          radiant_series_wins: 0,
          dire_series_wins: 0,
          allchat: true,
        };

        // console.log('lobbyOptions', lobbyOptions);

        // Dota2.createPracticeLobby(lobbyOptions, function (err, body) {
        //   console.log(JSON.stringify(body, null, 2));
        //   Dota2.joinPracticeLobbyTeam(1, 4);
        // });


        // Dota2.inviteToLobby('76561199108619867');

        // Dota2.launchPracticeLobby((err, result) => {
        //   console.log(err, 'launchPracticeLobby result', result);
        // });

        // Dota2.destroyLobby((err, result) => {
        //   console.log(err, 'result', result);
        // });

        Dota2.on('practiceLobbyUpdate', function (lobby) {
          console.log('lobby', lobby);
          
          console.log('match_id', lobby.match_id.toString());

          for (let i = 0; i < lobby.all_members.length; i++) {
            const member = lobby.all_members[i];

            console.log('member_name', member.name, 'id', member.id.toString(), 'slot', member.slot, 'team', member.team);
            console.log('member', member);
          }
        });

        // setTimeout(function () {
        //   Dota2.leavePracticeLobby(function (err, body) {
        //     if (err) {
        //       console.error('[createPracticeLobby] [error]', err);
        //       return;
        //     }

        //     console.log(JSON.stringify(body));
        //   });
        // }, 60000);
      });

      Dota2.on('unready', function onUnready() {
        console.log('Node-dota2 unready.');
      });

      Dota2.on('chatMessage', function (channel, personaName, message) {
        // console.log([channel, personaName, message].join(", "));
      });

      Dota2.on('guildInvite', function (guildId, guildName, inviter) {
        // Dota2.setGuildAccountRole(guildId, 75028261, 3);
      });

      Dota2.on('unhandled', function (kMsg) {
        console.log('UNHANDLED MESSAGE ' + dota2._getMessageName(kMsg));
      });
      // setTimeout(function(){ Dota2.exit(); }, 5000);
    }
  },
  onSteamServers = function onSteamServers(servers) {
    console.log('Received servers.');
    fs.writeFile('servers', JSON.stringify(servers), (err) => {
      if (err) {
        if (this.debug) console.log('Error writing ');
      } else {
        if (this.debug) console.log('');
      }
    });
  },
  onSteamLogOff = function onSteamLogOff(eresult) {
    console.log('Logged off from Steam.');
  },
  onSteamError = function onSteamError(error) {
    console.log('Connection closed by server: ' + error);
  };

steamUser.on('updateMachineAuth', function (sentry, callback) {
  var hashedSentry = crypto.createHash('sha1').update(sentry.bytes).digest();
  fs.writeFileSync('sentry', hashedSentry);
  console.log('sentryfile saved');
  callback({
    sha_file: hashedSentry,
  });
});

// Login, only passing authCode if it exists
var logOnDetails = {
  account_name: global.config.steam_user,
  password: global.config.steam_pass,
};
if (global.config.steam_guard_code) logOnDetails.auth_code = global.config.steam_guard_code;
if (global.config.two_factor_code) logOnDetails.two_factor_code = global.config.two_factor_code;

try {
  var sentry = fs.readFileSync('sentry');
  if (sentry.length) logOnDetails.sha_sentryfile = sentry;
} catch (beef) {
  console.log('Cannae load the sentry. ' + beef);
}

steamClient.connect();
steamClient.on('connected', function () {
  steamUser.logOn(logOnDetails);
});
steamUser.on('loggedOn', onSteamLogOn);
steamUser.on('loggedOff', onSteamLogOff);

steamClient.on('error', onSteamError);
steamClient.on('servers', onSteamServers);

"use strict";

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var os = require('os');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
  
var expansion = false, //AoM or AoT?
    body, //embedded XML data
    playerGods = [], //actual player gods
    playerTeams = [], //actual player teams
    Aomparser = {};

Aomparser.init = function(f, callback) {
    var m = path.extname(f.name);
    expansion = m == '.rcx';
    Aomparser.parse(f.path, function(err, res){
        callback(null, {replay: res.replay, message: res.message});
    });
};

Aomparser.parse = function(filename, callback) {
    fs.open(filename, 'r', function(status, fd) {
        let message;
		if (status) message = status.message;
		var buffer = Buffer.alloc(100);
		let num = fs.readSync(fd, buffer, 0, 4, null);
		
		if(buffer.toString('utf8', 0, num) != 'l33t') message = "Could not open file for reading.";
		num = fs.readSync(fd, buffer, 0, 4, null);
		let size = unpack(buffer);
		let fileSize = fs.statSync(filename).size;
		buffer = Buffer.alloc(fileSize - 8);
		num = fs.readSync(fd, buffer, 0, fileSize - 8, null);
		fs.closeSync(fd);
		var data = zlib.unzipSync(buffer);
		
		if(data.length != size) message = "Length check failed.";
        let seek = expansion == true ? 1470 : 1430;  //5163 //40 //1470 : 1430
        let totalSize = unpack(data.slice(seek - 4, seek ));
        let blockSize = unpack(data.slice(seek , seek + 4));

        if(expansion && blockSize != 1024) {
            seek = 1478;
            totalSize = unpack(data.slice(seek - 4, seek ));
            blockSize = unpack(data.slice(seek , seek + 4));

            if(blockSize != 1024) message = "Can't parse";
        }

        let xml = '';
        seek += 4;
        
        while(totalSize > 0) {
            let toRead = Math.min(totalSize, blockSize);
            let txt = data.toString('utf-8', seek, seek + toRead);
            xml += txt;
            seek += toRead + 4;
            totalSize -= toRead;
        }

        let xmlDom = new JSDOM(xml);
        let document = xmlDom.window.document;
        let res = document.documentElement.innerHTML;
        res = res.replace(new RegExp('&lt;','g'), '<');
        res = res.replace(new RegExp('&gt;', 'g'), '>');
        document.documentElement.innerHTML = res;
        body = document.body;
    	
		totalSize = unpack(data.slice(seek - 4, seek));
		blockSize = unpack(data.slice(seek , seek + 4));
        seek += 4;
        let rms = '';

		while(totalSize > 0) {
			let toRead = Math.min(totalSize, blockSize);
			let txt = data.toString('utf-8', seek, seek + toRead);
			rms += txt;
			seek += toRead + 4;
			totalSize -= toRead;
		}
		
		totalSize = unpack(data.slice(seek - 4, seek));
		
		for (let i = 0; i < totalSize; ++i)
		{
			let playerCiv = unpack(data.slice(seek, seek + 4));
			let playerTeam = unpack(data.slice(seek + 4, seek + 8));
			seek += 8;
        
			playerGods[i] = playerCiv;
			playerTeams[i] = playerTeam;
        }

        let result = build();
        callback(null, {replay: result, message: message});
	});

};

function build() {
    let data = game_settings();
    data.match = buildMatch();
    return data;
}

function game_settings() {
    let set = {
        server: '',
        version: '',
        patch: '',
        winner: 0,
        media: '',
        },
        setting = [ 'GameType', 
                    'Filename', 
                    'CurrentPlayer', 
                    'ScenarioFilename',
                    'FilenameCRC',
                    'GameStartTime',
                    'MapVisibility',
                    'WorldResources',
                    'MapSize',
                    'RestrictPauses',
                    'GameMode',
                    'HandicapMode',
                    'MapSeed',
                    'Difficulty',
                    'NumPlayers' ];
    setting.forEach(el => {
        let s = body.querySelector(el).textContent;
        set[el.toLowerCase()] = isNaN(s) ? s : parseInt(s, 10);
    });
    set.gamemode = getGameModeName(set.gamemode);
    set.mapsize = set.mapsize == 0 ? 'Normal Map' : 'Large Map';
    set.mapvisibility = set.mapvisibility == 0 ? 'Hidden' : 'Revealed';
    return set;
}

function buildMatch() {
    let a = [],
        p = ['Name', 'Rating', 'Type', 'Team', 'Civilization'],
        pl = body.querySelectorAll('Player'),
        n = pl.length;

    for (var i = 0; i < n; i++) {
        let set = {};
        p.forEach(el => {
            let s = pl[i].querySelector(el).textContent;
            set[el.toLowerCase()] = isNaN(s) ? s : parseInt(s, 10);
        });
        let clientId = parseInt(pl[i].getAttribute('ClientID'), 10) + 1;
        clientId = clientId || parseInt(pl[i].getAttribute('ClientIndex'), 10) + 1;
        set.randomteam = set.team == 255;
        set.team = playerTeams[clientId];
        

        let god = getGodName(set.civilization);
        let god2 = getGodName(playerGods[clientId]);
        set.randomciv = god == god2 ? false : god;
        set.civilization = god == god2 ? god : god2;
        set.type = getTypeName(set.type);
        a.push(set);
    };
    return a;
}

/*string*/
function getGameModeName(gameModeID) {
    switch(gameModeID) {
        case  0: return "Supremacy";
        case  1: return "Conquest"; //double-check
        case  2: return "Lightning"; //double-check
        case  3: return "Deathmatch";
        case  4: return "Scenario"; //double-check
        default: return "Unknown Game Type: " . gameModeID;  
    }
}

/*string*/
function getTypeName(entityTypeID) {
    switch(entityTypeID) {
        case  0: return "Human";
        case  1: return "AI";
        case  4: return "Observer";
        default: return "Unknown Entity Type: " . entityType;
    }
}

/*string*/
function getGodName(godID) {
    return expansion ? getExpansionGodName(godID) : getVanillaGodName(godID);
}

/*string*/
function getVanillaGodName(godID) {
    switch(godID) {
        case  0: return "Zeus";
        case  1: return "Poseidon";
        case  2: return "Hades";
        case  3: return "Isis";
        case  4: return "Ra";
        case  5: return "Set";
        case  6: return "Odin";
        case  7: return "Thor";
        case  8: return "Loki";
        case  9: return "Random All";
        case 10: return "Random Greek";
        case 11: return "Random Norse";
        case 12: return "Random Egyptian";
        case 13: return "Nature";
        default: return "Unknown God: " . godID;
    }
}

/*string*/
function getExpansionGodName(godID) {
    switch(godID) {
        case  0: return "Zeus";
        case  1: return "Poseidon";
        case  2: return "Hades";
        case  3: return "Isis";
        case  4: return "Ra";
        case  5: return "Set";
        case  6: return "Odin";
        case  7: return "Thor";
        case  8: return "Loki";
        case  9: return "Kronos";
        case 10: return "Oranos";
        case 11: return "Gaia";
        case 12: return "Random All";
        case 13: return "Random Greek";
        case 14: return "Random Norse";
        case 15: return "Random Egyptian";
        case 16: return "Random Atlantean";
        case 17: return "Nature";
        default: return "Unknown God: " . godID;
    }
}

/*string*/
function getTaleGodName(godID) {
    let dif = version == 0 && godID > 8 ? 7 : 0;
        dif = version == 1 && godID > 11 ? 4 : 0;
    switch(godID + dif) {
        case  0: return "Zeus";
        case  1: return "Poseidon";
        case  2: return "Hades";
        case  3: return "Isis";
        case  4: return "Ra";
        case  5: return "Set";
        case  6: return "Odin";
        case  7: return "Thor";
        case  8: return "Loki";
        case  9: return "Kronos";
        case 10: return "Oranos";
        case 11: return "Gaia";
        case 12: return "Fuxi";
        case 13: return "Nuwa";
        case 14: return "Shennong";
        case 15: return "Random Greek";
        case 16: return "Random All";
        case 17: return "Random Greek";
        case 18: return "Random Norse";
        case 19: return "Random Egyptian";
        case 20: return "Random Atlantean";
        case 21: return "Random Chinese";
        case 22: return "Nature";
        default: return "Unknown God: " . godID;
    }
}

function unpack(buffer) {
	if (os.endianness() == "LE") {
		return buffer.readInt32LE(0);
	}
	else {
		return buffer.readInt32BE(0);
	}
}

module.exports = Aomparser;
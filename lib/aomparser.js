"use strict";
//npm i php-pack
//npm i xpath
//npm i qunpack
var fs = require('fs');
var path = require('path');
var bufferpack = require('bufferpack');
var qunpack = require('qunpack');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var zlib = require('zlib');
var nconf = require('nconf');
var os = require('os');
var parseString = require('xml2js').parseString;
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

/*
var nodes = xpath.select("//title", doc)
console.log(nodes[0].localName + ": " + nodes[0].firstChild.data)
console.log("Node: " + nodes[0].toString())
*/
  
var expansion = 0; //AoM or AoT?
var body; //embedded XML data
var recdata; //xml data
var rmsdata; //xml rms data
var rms = ""; //embedded Random Map Script
var playerGods = []; //actual player gods
var playerTeams = []; //actual player teams

var Aomparser = {};

Aomparser.init = function(file, callback) {
    var mimeType = path.extname(file.name);
    //$length = strlen($filePath);
    //$ext = substr($filePath, $length-3, 3);
    console.log(mimeType);
    if(mimeType == '.rec'){
        expansion = false;
    }else if(mimeType == '.rcx'){
        expansion = true;
    }

    var parses = Aomparser.parse(file.path);
    callback(null, {id: parses});
};

function unpack(buffer) {
	if (os.endianness() == "LE") {
		return buffer.readInt32LE(0);
	}
	else {
		return buffer.readInt32BE(0);
	}
}

Aomparser.parse = function(filename, callback) {
    var url = filename;//path.join(nconf.get('upload_path'), 'replays/aom', filename);
    fs.open(url, 'r', function(status, fd) {
		if (status) {
			console.log(status.message);
			return;
		}
				
		var buffer = Buffer.alloc(100);
		let num = fs.readSync(fd, buffer, 0, 4, null);
		
		if(buffer.toString('utf8', 0, num) != 'l33t')
			throw new Error("Could not open file for reading.")
		
		num = fs.readSync(fd, buffer, 0, 4, null);
		
		let size = unpack(buffer);
		
		let fileSize = fs.statSync(url).size;
		
		//console.log(size)
		
		buffer = Buffer.alloc(fileSize - 8);
		
		num = fs.readSync(fd, buffer, 0, fileSize - 8, null);
		
		fs.closeSync(fd);
		
		var data = zlib.unzipSync(buffer);
		
		if(data.length != size) {
			throw new Error("Length check failed.")
		}
		
		let seek = expansion == true ? 1470 : 1430;
		
		
		let totalSize = unpack(data.slice(seek - 4, seek ));
		let blockSize = unpack(data.slice(seek , seek + 4));
		
		//console.log(totalSize);
			//console.log(buffer.toString('utf8', 0, num));
			
		let xml = "";
		
		seek += 4;
		
		while(totalSize > 0) {
			let toRead = Math.min(totalSize, blockSize);
			let txt = data.toString('utf-8', seek, seek + toRead);
			xml += txt;
			
			seek += toRead + 4;
			
			totalSize -= toRead
        }
        
        console.log(xml);

        const xmlDom = new JSDOM(xml);
		const document = xmlDom.window.document;
		let res = document.documentElement.innerHTML;
		
		res = res.replace(new RegExp('&lt;','g'), '<');
		res = res.replace(new RegExp('&gt;', 'g'), '>');
		
        document.documentElement.innerHTML = res;
		/*body element like browser html body. contains xml nodes*/
        body = document.body;
		
		totalSize = unpack(data.slice(seek - 4, seek));
	
		blockSize = unpack(data.slice(seek , seek + 4));
		
		seek += 4;
		
		//console.log(xml);
		
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

	});

};

Aomparser.build = function(dom) {
    var data = {};
};

/*SimpleXMLElement*/
Aomparser.getXml = function() {
    return xml; 
};

/*string*/
Aomparser.getRandomMapScript = function() {
    return rms;
};

/*string*/
Aomparser.getGameType = function() {
    return expansion ? 'AoT' : 'AoM';
};

/*string*/
Aomparser.getMapName = function() {
    return query('Filename');
};

// Int: returns the player who recorded this
Aomparser.getPointOfView = function() {
    return query('CurrentPlayer');
};

// Int
Aomparser.getTimeStamp = function() {
    return parseInt(query('GameStartTime'), 10);
};

// String: not sure about time zone, probably GMT-7'ish
Aomparser.getGameDate = function() {
    return new Date(Aomparser.getTimeStamp()).toDateString();
};

// String
Aomparser.getMapSize = function() {
    let size = parseInt(query('MapSize'), 10);
    return size == 0 ? 'Normal Map' : 'Large Map';
};

// String
Aomparser.getGameMode = function() {
    let gameModeID = query('GameMode');
    return Aomparser.getGameModeName(gameModeID);
};

// Int
Aomparser.getMapSeed = function() {
    let seed = query('MapSeed');
    return parseInt(seed, 10);
};

// Int: excluding mother nature
Aomparser.getNumPlayers = function() {
    let num = queryAll('Player');
    return num.length;
};

/*array(string)*/
Aomparser.getAllPlayers = function() {
    let players = queryAll('Name');
    let num = players.length;
    let result = [];
    for(var i=0; i < num; i++) {
        result[i] = players[i];
    }
    return result;
};

/*float*/
Aomparser.getPlayerRating = function(playerName) {
    return queryByName(playerName, 'Rating'); 
};

/*string*/
Aomparser.getPlayerType = function(playerName) {
    let type = queryByName(playerName, 'Type');
    return Aomparser.getTypeName(type);
};

/*int*/
Aomparser.getChosenPlayerTeam = function(playerName) {
    //might be 255 = random
    return queryByName(playerName, 'Team');
};

/*int*/
Aomparser.getPlayerTeam = function(playerName) {
    //returns actual player team
    let playerID = Aomparser.getPlayerNumber(playerName);
    return playerTeams[playerID]; 
};

//*string*
Aomparser.getCombinedPlayerTeam = function(playerName) {
    //shows if the teams were random
    // 255 = random
    let team = Aomparser.getChosenPlayerTeam(playerName);
    let playerID = Aomparser.getPlayerNumber(playerName);
    let team2 = playerTeams[playerID];
    return team == 255 ? team2 + ' (Random)' : team2; 
};

/*array(string)*/
Aomparser.getPlayersOnTeam = function(team) {
    //based on actual team
    let num = Aomparser.getNumPlayers();
    let results = [];
    for(var i=0; i < num; i++) {
        if(playerTeams[i] == team) {
            results.push(Aomparser.getPlayerName(i));
        }
    }
    return results;
};

/*int*/
Aomparser.getNumTeams = function() {
    return Math.max(playerTeams); 
};

/*array(int)*/
Aomparser.getAllTeams = function() {
    return unique(playerTeams); 
};

function unique(array){
    return array.filter(function(el, index, arr) {
        return index == arr.indexOf(el);
    });
}

/*int*/
Aomparser.getPlayerGodID = function(playerName) {
    //returns ID of actual god
    let playerID = Aomparser.getPlayerNumber(playerName);
    return playerGods[playerID]; //actual god 
};

/*string*/
Aomparser.getPlayerGod = function(playerName) {
    //returns name of god (combined chosen + actual)
    let playerID = Aomparser.getPlayerNumber(playerName);
    let civ = queryByName(playerName, 'Civilization');
    let god = Aomparser.getGodName(civ); //chosen god
    let god2 = Aomparser.getGodName(playerGods[playerID]); //actual god
    return god == god2 ? god : god2 + ' (' + god + ')';  //second is random god 
};

/*int*/
Aomparser.getPlayerNumber = function(playerName) {
    //[1, n] (mother nature = 0)
    let id = queryByName(playerName, '', true);
    return parseInt(id, 10) + 1;
};

/*string*/
Aomparser.getPlayerName = function(playerNumber) {
    let node = body.querySelectorAll('Player[ClientID="' + (playerNumber -1) + '"]');
    return node[0].querySelector('Name').textContent; 
};

/*string*/
Aomparser.getGameModeName = function(gameModeID) {
    switch(gameModeID) {
        case  0: return "Supremacy";
        case  1: return "Conquest"; //double-check
        case  2: return "Lightning"; //double-check
        case  3: return "Deathmatch";
        case  4: return "Scenario"; //double-check
        default: return "Unknown Game Type: " . gameModeID;  
    }
};

/*string*/
Aomparser.getTypeName = function(entityTypeID) {
    switch(entityTypeID) {
        case  0: return "Human";
        case  1: return "AI";
        case  4: return "Observer";
        default: return "Unknown Entity Type: " . entityType;
    }
};

/*string*/
Aomparser.getVanillaGodName = function(godID) {
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
};

/*string*/
Aomparser.getExpansionGodName = function(godID) {
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
};

function query(name) {
    return body.querySelector(name).textContent;
}

function queryAll(name) {
    return body.querySelectorAll(name).textContent;
}

function queryByName(name, property, clientId) {
    var players = body.querySelectorAll('Player');
    var num = players.length;

    for (var i = 0; i < num; i++) {
        if(players[i].querySelector('Name').textContent == name) {
            return clientId ? players[i].getAttribute('ClientID') : players[i].querySelector(property).textContent;
        }
    };
}

/*string*/
Aomparser.getGodName = function(godID) {
    return expansion ? Aomparser.getExpansionGodName(godID) : Aomparser.getVanillaGodName(godID);
};

module.exports = Aomparser;
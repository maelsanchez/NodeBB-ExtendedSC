"use strict";
//npm i php-pack
//npm i xpath
var fs = require('fs');
var path = require('path');
var bufferpack = require('bufferpack');
var xpath = require('xpath');
var dom = require('xmldom').DOMAomparser;
var zlib = require('zlib');

/*
var nodes = xpath.select("//title", doc)
console.log(nodes[0].localName + ": " + nodes[0].firstChild.data)
console.log("Node: " + nodes[0].toString())
*/
  
var expansion; //AoM or AoT?
var xml; //embedded XML data
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
    if(mimeType == 'rec'){
        expansion = false;
        callback(null, {id: "No-expansion"});
    }else if(mimeType == 'rcx'){
        expansion = true;
        callback(null, {id: "Expansion"});
    }else{
        callback(null, {id: "Invalid extension"});
    }
    //Aomparser.parse(file);
};
/*
//Return SimpleXMLElement
Aomparser.getXml = function() {
    return xml;
};

//Return String
Aomparser.getRandomMapScript = function() {
    return rms;
};

//Return String
Aomparser.getGameType = function() {
    if(expansion){
        return "AoT";
    }else{
        return "AoM";
    }
};

//Return String
Aomparser.getMapName = function() {
    var map = xml.xpath("/GameSettings/Filename");
    return map[0];
};

//Return Int, returns the player who recorded this
Aomparser.getPointOfView = function() {
    var pov = xml.xpath("/GameSettings/CurrentPlayer");
    return pov[0];
};

//Return Int
Aomparser.getTimeStamp = function() {
    var start = xml.xpath("/GameSettings/GameStartTime");
    start = start[0];
    return parseInt(start);
};

//Return String, not sure about time zone, probably GMT-7'ish
Aomparser.getGameDate = function() {
    return date('Y-m-d H:i:s', Aomparser.getTimeStamp());
};

//Return String
Aomparser.getMapSize = function() {
    var size = xml.xpath("/GameSettings/MapSize");
    size = size[0];
    size = parseInt(size);
    if(size == 0)
        return "Normal Map";
    else
        return "Large Map";
};

//Return String
Aomparser.getGameMode = function() {
    var gameModeID = xml.xpath("/GameSettings/GameMode");
    return Aomparser.getGameModeName(gameModeID[0]);
};

//Return Int
Aomparser.getMapSeed = function() {
    var seed = xml.xpath("/GameSettings/MapSeed");
    return parseInt(seed[0]);
};

//Return Int, excluding mother nature
Aomparser.getNumPlayers = function() {
    var num = xml.xpath("/GameSettings/Player");
    return count(num);
};

//Array(string), excluding mother nature
Aomparser.getAllPlayers = function() {
    var players = xml.xpath("/GameSettings/Player/Name");
    var num = count(players);
    var result = array();
    for(var i=0; i < num; i++){
        result[i] = String(players[i]);
    }
    
    return result;
};

//Float
Aomparser.getPlayerRating = function(playerName) {
    var query = "/GameSettings/Player[Name='" . playerName . "']/Rating";
    var rate = xml.xpath(query);
    return rate[0];
};

//String
Aomparser.getPlayerType = function(playerName) {
    var query = "/GameSettings/Player[Name='" . playerName . "']/Type";
    var type = xml.xpath(query);
    return Aomparser.getTypeName(type[0]);
};

//Int, might be 255 = random
Aomparser.getChosenPlayerTeam = function(playerName) {
    var query = "/GameSettings/Player[Name='" . playerName . "']/Team";
    var team = xml.xpath(query);
    return team[0];
};

//Int, returns actual player team
Aomparser.getPlayerTeam = function(playerName) {
    var playerID = Aomparser.getPlayerNumber(playerName);
    return playerTeams[playerID];
};

//String, shows if the teams were random
Aomparser.getCombinedPlayerTeam = function(playerName) {
    var team = Aomparser.getChosenPlayerTeam(playerName);
    var playerID = Aomparser.getPlayerNumber(playerName);
    var team2 = playerTeams[playerID];
    
    if(team == 255){
        return team2 + " (Random)";
    }else{
        return team2;
    }
};

//Array(string), based on actual team
Aomparser.getPlayersOnTeam = function(team) {
    var num = Aomparser.getNumPlayers();
    var results = array();
    for(var i=0; i < num; i++){
        if(playerTeams[i] == team)
            results.push(Aomparser.getPlayerName(i));
    }
    return results;
};

//Int
Aomparser.getNumTeams = function() {
    return Math.max(playerTeams);
};

//Array(int)
Aomparser.getAllTeams = function() {
    return unique(playerTeams);
};

function unique(array){
    return array.filter(function(el, index, arr) {
        return index == arr.indexOf(el);
    });
}

//Int, returns ID of actual god
Aomparser.getPlayerGodID = function(playerName) {
    var playerID = Aomparser.getPlayerNumber(playerName);
    return playerGods[playerID]; //actual god
};

//String, returns name of god (combined chosen + actual)
Aomparser.getPlayerGod = function(playerName) {
    var playerID = Aomparser.getPlayerNumber(playerName);
    var query = "/GameSettings/Player[Name='" . playerName . "']/Civilization";
    var god = xml.xpath(query);
    god = Aomparser.getGodName(god[0]); //chosen god
    var god2 = Aomparser.getGodName(playerGods[playerID]); //actual god
    if(god == god2){
        return god;
    }else{ //random god
        return god2 + " (" + god + ")";
    }
};

//Int, [1, n] (mother nature = 0)
Aomparser.getPlayerNumber = function(playerName) {
    $query = "/GameSettings/Player[Name='" . $playerName . "']/@ClientID";
    $id = $this->xml->xpath($query);
    return $id[0] + 1;
};

//String
Aomparser.getPlayerName = function(playerNumber) {
    var query = "/GameSettings/Player[@ClientID='" . (playerNumber - 1) . "']/Name";
    var name = xml.xpath(query);
    return name[0];
};

//String
Aomparser.getGameModeName = function(gameModeID) {
    switch(gameModeID)
    {
        case  0: return "Supremacy";
        case  1: return "Conquest"; //double-check
        case  2: return "Lightning"; //double-check
        case  3: return "Deathmatch";
        case  4: return "Scenario"; //double-check
        default: return "Unknown Game Type: " . gameModeID;
    }
};

//String
Aomparser.getTypeName = function(entityTypeID) {
    switch(entityTypeID)
    {
        case  0: return "Human";
        case  1: return "AI";
        case  4: return "Observer";
        default: return "Unknown Entity Type: " . entityType;
    }
};

//String
Aomparser.getVanillaGodName = function(godID) {
    switch(godID)
    {
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

//String
Aomparser.getExpansionGodName = function(godID) {
    switch(godID)
    {
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
        default: return "Unknown God: " . $godID;
    }
};

//String
Aomparser.getGodName = function(godID) {
    if(expansion){
        return Aomparser.getExpansionGodName(godID);
    }else{
        return Aomparser.getVanillaGodName(godID);
    }
};
*/
//String
/*Aomparser.parse = function(filePath) {
    //load file
    fs.open(filePath, 'r', function(err, fd) {
        if(err){
            return "Could not open file for reading.";
        }

        var leet = fs.createReadStream(fd, { start : 0, end: 4 });
        if(leet != "l33t"){return "Invalid rec file.";}
        var size = bufferpack.unpack("l", leet);
        size = size[1];
        var stats = fs.statSync(fd);
        var fileSizeInBytes = stats.size;
        var compressed = fread(fd, fileSizeInBytes-8);
        fs.close(fd);

        //decompress
        $data = gzuncompress($compressed);
        if(size != data.length) return("Length check failed.");

        //read XML sizes
        if(expansion){
            var seek = 1470;
        }else{
            var seek = 1430;
        }

        var totalSize = bufferpack.unpack("l", data.substr(seek-4, 4));
        totalSize = totalSize[1];
        var blockSize = bufferpack.unpack("l", data.substr(seek, 4));
        blockSize = blockSize[1];

        //start processing blocks of XML data
        xml = "";
        seek += 4;
        while (totalSize > 0)
        {
            var toRead = Math.min(totalSize, blockSize);
            var txt = data.substr(seek, toRead);//unicode?
            xml += txt;
            seek += toRead + 4;
            totalSize -= toRead;
        }

        recdata = new dom().parseFromString(xml);

        //read RMS sizes (unpack "l": signed long,always 32 bit, machine byte order)
        totalSize = bufferpack.unpack("l", data.substr(seek-4, 4));
        totalSize = $totalSize[1];
        blockSize = bufferpack.unpack("l", data.substr(seek, 4));
        blockSize = $blockSize[1];

        //start processing blocks of RMS data
        rms = "";
        seek += 4;
        while (totalSize > 0)
        {
            toRead = Math.min(totalSize, blockSize);
            txt = data.substr(seek, toRead);//unicode?
            rms += txt;
            seek += toRead + 4;
            totalSize -= toRead;
        }

        //save RMS
        rmsdata = rms;

        //parse actual civs/teams
        totalSize = bufferpack.unpack("l", data.substr(seek-4, 4));
        totalSize = totalSize[1]; //cNumPlayers
        for (var i=0; i < totalSize; i++)
        {
            playerCiv = bufferpack.unpack("l", data.substr(seek, 4));
            playerCiv = playerCiv[1];
            playerTeam = bufferpack.unpack("l", data.substr(seek+4, 4));
            playerTeam = playerTeam[1];
            seek += 8;
            
            playerGods[i] = playerCiv;
            playerTeams[i] = playerTeam;
        }

    });
};*/

module.exports = Aomparser;
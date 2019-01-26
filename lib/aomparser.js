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
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

/*
var nodes = xpath.select("//title", doc)
console.log(nodes[0].localName + ": " + nodes[0].firstChild.data)
console.log("Node: " + nodes[0].toString())
*/
  
var expansion = 0; //AoM or AoT?
var xml; //embedded XML data
var recdata; //xml data
var rmsdata; //xml rms data
var rms = ""; //embedded Random Map Script
var playerGods = []; //actual player gods
var playerTeams = []; //actual player teams

var Aomparser = {};

Aomparser.init = function(file, callback) {
    //var mimeType = path.extname(file.name);
    //$length = strlen($filePath);
    //$ext = substr($filePath, $length-3, 3);
    /*if(mimeType == '.rec'){
        expansion = false;
    }else if(mimeType == '.rcx'){
        expansion = true;
    }*/

    var parses = Aomparser.parse(file);
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
    var url = path.join(nconf.get('upload_path'), 'replays/aom', filename);
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
		res = res.replace(new RegExp('&gt;', 'g'), '>')
		
		document.documentElement.innerHTML = res;
		
		
		/*body element like browser html body. contains xml nodes*/
        let body = document.body;
        console.log(body);
		
		totalSize = unpack(data.slice(seek - 4, seek));
	
		blockSize = unpack(data.slice(seek , seek + 4));
		
		
		let rms = "";
		
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
	
	
		/*
			$this->playerGods in php
			$this->playerTeams in php
		*/
		let playerGods = [];
		let playerTeams = [];
		
		for (let i = 0; i < totalSize; ++i)
		{
			let playerCiv = unpack(data.slice(seek, seek + 4));
			let playerTeam = unpack(data.slice(seek + 4, seek + 8));
			seek += 8;
        
			playerGods[i] = playerCiv;
			playerTeams[i] = playerTeam;
        }
        
        console.log(playerGods);
        console.log(playerTeams);
	});

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
/*Aomparser.parse = function(filename, callback) {
    //load file
    var url = path.join(nconf.get('upload_path'), 'replays/aom', filename);
    var stats = fs.statSync(url);
    var fileSizeInBytes = stats.size;
    var fileSizeNormalized = stats.size - 8;
    var size = 0;
    var data;

    fs.open(url, 'r', function(err, fd) {
    //fs.open(filePath, 'r', function(err, fd) {
        if(err){
            return "Could not open file for reading.";
        }

        //de PHP debe dar 527454
        //tamaño del archivo en PHP : 115889
        //Salida del size: 1949512556
        
        var buf = Buffer.alloc(4);
        fs.read(fd, buf, 0, 4, null, function(err, bytesRead, buffer) {
            var leet = buffer.toString();

            if(leet != "l33t"){
                return "Invalid rec file.";
            }
            
            var size = qunpack.unpack("l", buffer);
            var size2 = qunpack.unpack("<l", buffer);
            console.log('size1:');
            console.log(size); // 1815294836 
            console.log('size2:');
            console.log(size2); // 1949512556 
            console.log("fileSizeInBytes:" + fileSizeInBytes);
            console.log("fileSizeInBytes8:" + fileSizeNormalized);
        });

        var buf2 = Buffer.alloc(fileSizeNormalized);
        fs.read(fd, buf2, 0, fileSizeNormalized, 0, function(err, bytesRead, buffer) {
            console.log(buffer);
            zlib.deflate(buffer.toString('binary'), function(err, b){
                //console.log('size2:' + b.toString('binary').length);
                zlib.inflate(b, function(err, subbuffer){
                    //var data = subbuffer.toString('binary');
                    //var data2 = subbuffer.toString();
                    //console.log('gzuncompress_binary:' + subbuffer.length); 
                    //console.log('gzuncompress_normal:' + data2.length); 
                    console.log(subbuffer.toString('binary').length);
                    
                });
            });*/
            /*zlib.unzip(buffer, function(err, arc) {
                var paquete = arc.toString();
                console.log('size2:' + paquete.length);
            });
            var gz = zlib.deflateSync(buffer);
            var rt = zlib.inflateSync(gz).toString('binary');
            console.log(rt.length);*/
        //});

        /*var buf = Buffer.alloc(4);
        fs.read(fd, buf, 0, 4, 0, function(err, bytesRead, buffer) {
            size = buffer[0]
            + (buffer[1] << 8)
            + (buffer[2] << 16)
            + (buffer[3] << 24);
            console.log(size);

        });

        var buf2 = Buffer.alloc(fileSizeInBytes-8);
        fs.read(fd, buf2, 0, fileSizeInBytes-8, 0, function(err, bytesRead, buffer2) {
            zlib.deflate(buffer2, { chunkSize : size },function(err, b){
                //console.log('size2:' + b.toString('binary').length);
                zlib.inflate(b, function(err, subbuffer){
                    data = subbuffer;
                    //console.log(data); 

                    var GAME_SETTINGS_BLOCKSIZE = Buffer.from('0x400', 'hex');
                    var GAMESETTINGSOFFSET = Buffer.from('0x59A', 'hex');
                    var TITAN_ADDITIONAL_SETTINGS_OFFSET = Buffer.from('0x28', 'hex');
                    var GAME_SETTINGS_STARTTAG = Buffer.from('<GameSettings>');
                    var GAME_SETTINGS_ENDTAG = Buffer.from('</GameSettings>', 'ascii');
                    var GAME_STEAM = Buffer.from('</TitanMode>', 'ascii');
                    console.log("query:");
                     
                    recdata = new dom().parseFromString(subbuffer.toString('utf16le'));
                    console.log(recdata);
                    console.log(recdata.indexOf(GAME_SETTINGS_STARTTAG.toString('utf16le')));

                    /*var uc_nullfree = data.substring(GAMESETTINGSOFFSET.toString('utf16le'));
                    
                    if(uc_nullfree.indexOf(GAME_SETTINGS_STARTTAG.toString('utf16le')) == 2)
                    {
                        expansion = 1;
                    }else{
                        
                        uc_nullfree = uc_nullfree.substring(TITAN_ADDITIONAL_SETTINGS_OFFSET.toString('utf16le'));

                        if(uc_nullfree.indexOf(GAME_SETTINGS_STARTTAG.toString('utf16le')) == 2)
                        {
                            expansion = 2;
                        }
                        else
                        {
                            expansion = 3;
                        }				    
                    }*/

                    //console.log('expansion:' + expansion);
                    
                /*});
            });
        
        });*/

        //console.log(hi.toString('utf16le'));

        


        //de PHP debe dar 527454
        //tamaño del archivo en PHP : 115889
        //Salida del size: 1949512556
        /*var buf = Buffer.alloc(4);
        fs.read(fd, buf, 0, 4, 0, function(err, bytesRead, buffer) {
            var leet = buffer.toString();

            if(leet != "l33t"){
                return "Invalid rec file.";
            }
            
            var size = bufferpack.unpack("l", buffer);
            console.log('array2:');
            console.log(size);

            console.log('buffer:' + leet);
            console.log("size:" + size);
            console.log("fileSizeInBytes:" + fileSizeInBytes);
        });

        var buf2 = Buffer.alloc(fileSizeInBytes-8);
        fs.read(fd, buf2, 0, fileSizeInBytes-8, 0, function(err, bytesRead, buffer) {
            console.log(buffer[0]);
            console.log(buffer[0]);
            console.log('BUFFER:' + buffer.toString().length);
            console.log('BUFFER2:' + buffer.toString('binary').length);
            /*zlib.inflate(buffer, function(err, b){
                console.log('size2:' + b.toString('binary').length);
                /*zlib.inflate(b, function(err, subbuffer){
                    var data = subbuffer.toString('binary');
                    console.log('size2:' + data.length); 

                    
                });
            });*/
            /*zlib.unzip(buffer, function(err, arc) {
                var paquete = arc.toString();
                console.log('size2:' + paquete.length);
            });*/
            /*var gz = zlib.deflateSync(buffer);
            var rt = zlib.inflateSync(gz).toString('binary');
            console.log(rt.length);
        });*/

        /*fs.close(fd);
    });*/

    /*var data;
    var leet = fs.createReadStream(url, { start : 0, end: 3 });
    var his, nope, size,compressed_size;
  
    leet.on('data', function (chunk) {
        his = chunk.toString();
        if(chunk.toString() != "l33t"){
            return "Invalid rec file.";
        }
        var size = bufferpack.unpack("l", chunk);
        console.log("size:" + size);

        var stats = fs.statSync(url);
        var fileSizeInBytes = stats.size;

        var compressed = fs.createReadStream(url, { start : 0, end: fileSizeInBytes-8 });

        compressed.on('data', function (chunks) {

            var text = Buffer.from(chunks.toString(), 'binary');
            zlib.deflate(text, function(err, buffer){
                console.log('size2:' + buffer.toString('binary').length);
                /*zlib.inflate(buffer, function(err, subbuffer){
                    data = subbuffer.toString('binary');
                    console.log('size2:' + data.length); 

                    
                });*/
            /*});
        });*/

        /*//read XML sizes
        if(expansion){
            var seek = 1470;
        }else{
            var seek = 1430;
        }

        var totalSize = bufferpack.unpack("l", data.substr(seek-4, 4));
        var blockSize = bufferpack.unpack("l", data.substr(seek, 4));

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

        //save XML
        recdata = new dom().parseFromString(xml);
        
        console.log(recdata);*/

        /*//read RMS sizes (unpack "l": signed long,always 32 bit, machine byte order)
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
        }*/

        //compressed_size = chunk;
            //decompress
            /*zlib.gunzip(compressed_size, function(err, dezipped) {
                var package = dezipped.toString();
                console.log(package);
            });
            chunks.push(chunk);
            /*var buff = new Buffer(chunk.toString(), 'binary');
            var gz = zlib.deflate(buff); // also another 'Buffer'
            var con = zlib.inflate(gz);
            console.log(con);
            chunks = chunk.toString();*/

        /*var buffer = Buffer.concat(chunks);
    
        //var buffer = new Buffer(chunks.toString(), 'binary');
        zlib.gunzip(buffer, function(err, decoded) {
            console.log(decoded);
        });*/
        

        /*compressed.on('end', function () {
            var buffer = new Buffer(chunks);
            zlib.gunzip(buffer, function(err, decoded) {
                console.log(decoded);
            });
        });*/
        
        /*var headerLenBuf = Buffer.alloc(fileSizeInBytes-8);
        fs.read(url, headerLenBuf, 0, fileSizeInBytes-8, 0, function(err, fd) {
            if(err){ return "wrong";}
            zlib.gunzip(headerLenBuf, function(err, decoded) {
                console.log(decoded);
            });
        });*/


    /*}).on('end', function () {  // done
        nope = "ready";
    });*/
    /*var text = new Buffer(chunks, 'binary');
    zlib.deflate(text, function(err, buffer){
            zlib.inflate(buffer, function(err, subbuffer){
            console.log(subbuffer.toString('binary')); 
        });
    }); // also another 'Buffer' */
    

    /*zlib.gunzip(compressed_size, function(err, hilo) {
        var paquete = hilo;
        console.log(hilo.toString());
    });*/
    /*return "bien";
};*/

module.exports = Aomparser;
const http = require('http');
const fs = require('fs');
const path = require('path');
const mine = require('mime');
const chatServer = require('./lib/chat_server');
const cache = {};



function send404(response) {
    response.writeHead(404,{'Content-Type':'text/plain'});
    response.write('Error 404: resource not found');
    response.end();
}

function sendFile(response,filePath,fileContents) {
    response.writeHead(200,{'content-type':mine.lookup(path.basename(filePath))});
    response.end(fileContents);
}

function serveStatic(response,cache,absPath) {
    if(cache[absPath]){
        sendFile(response,absPath,cache[absPath]);
    }else{
        fs.exists(absPath,function (exists) {
            if(exists){
                fs.readFile(absPath,function (err,data) {
                    if(err){
                        send404(response);
                    }else{
                        cache[absPath] = data;
                        sendFile(response,absPath,data);
                    }
                });
            }else{
                send404(response)
            }
        });
    }
}

var server = http.createServer(function (request,response) {
    var filePath = false;
    if(request.url == '/'){
        filePath = 'public/index.html';
    }else{
        filePath = 'public' + request.url;
    }
    var absPath = './'+filePath;
    serveStatic(response,cache,absPath);
});
server.listen(3000,function () {
    console.log("Server listening on port 3000");
});

chatServer.listen(server);
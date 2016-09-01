var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

app.get('/', function(req, res) {
    res.sendfile('views/index.html');
});

io.on('connection', function(socket) {
    var socket_id = socket.id;
    var client_ip = socket.request.connection._peername;

    console.log('user [' + client_ip + '] connected');

    //when a socket is disconnected or closed, .on('disconnect') is fired
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });

    socket.on('post_haiku', function(haiku) {
        var haiku_html = '<li class="line1">' + haiku.line1 + '</li><li class="line2">' + haiku.line2 + '</li><li class="line3">' + haiku.line3 + "</li><div class='haiku_author'>" + client_ip + "</div> \n";
        io.emit('share_haiku', haiku_html);
        fs.appendFile('haiku-2016-09', haiku_html, function(err) {});
        console.log('new haiku from ' + client_ip + ': ' + haiku.line1 + "/ " + haiku.line2 + "/ " + haiku.line3);
    });
});

http.listen((process.env.PORT || 8080), function() {
    console.log('listening on *:8080');
});

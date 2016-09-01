var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var striptags = require('striptags');

app.get('/', function(req, res) {
    res.sendfile('views/index.html');
});

io.on('connection', function(socket) {
    var socket_id = socket.id;
    var client_ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
    //socket.request.connection._peername.address;

    console.log('user [' + client_ip + '] connected');

    //when a socket is disconnected or closed, .on('disconnect') is fired
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });

    socket.on('post_haiku', function(haiku) {
        //cleans up input in case user submits some html or something
        var line1 = striptags(haiku.line1);
        var line2 = striptags(haiku.line2);
        var line3 = striptags(haiku.line3);
        var haiku_html = '<li class="line1">' + line1 + '</li><li class="line2">' + line2 + '</li><li class="line3">' + line3 + "</li><div class='haiku_author'>" + client_ip + "</div> \n";
        io.emit('share_haiku', haiku_html);
        //write to the file for this month
        //can be programmatically derived later, this is easy to change.
        fs.appendFile('haiku-2016-09', haiku_html, function(err) {});
        console.log('new haiku from ' + client_ip + ': ' + line1 + "/ " + line2 + "/ " + line3);
    });
});

http.listen((process.env.PORT || 8282), function() {
    console.log('listening on *:8282');
});

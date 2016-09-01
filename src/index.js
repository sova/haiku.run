var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
    res.sendfile('views/index.html');
});

io.on('connection', function(socket) {
    console.log('a user connected');

    //when a socket is disconnected or closed, .on('disconnect') is fired
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
});



io.on('connection', function(socket) {
    socket.on('chat message', function(msg) {
        io.emit('chat message', msg);
        //console.log('message: ' + msg);
    });
});

http.listen((process.env.PORT || 8080), function() {
    console.log('listening on *:8080');
});

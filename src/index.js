var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var striptags = require('striptags');
var shortid = require('shortid');
var byline = require('byline');
var current_haiku_monthly_file = 'haiku-2016-09'
    /*var get_haiku_from_file_by_line = byline(fs.createReadStream(current_haiku_monthly_file, {
            encoding: 'utf8'
        })
      );*/
var number_of_clients_connected = 0;

app.get('/', function(req, res) {
    res.sendfile('views/index.html');
});

app.get('/all', function(req, res) {
    res.sendfile('views/all.html');
});

io.on('connection', function(socket) {
    var socket_id = socket.id;
    var client_ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
    //socket.request.connection._peername.address;

    number_of_clients_connected++;
    console.log('[' + client_ip + '] connected, ' + number_of_clients_connected + ' total users online.');

    //when a socket is disconnected or closed, .on('disconnect') is fired
    socket.on('disconnect', function() {
        number_of_clients_connected--;
        console.log('[' + client_ip + '] disconnected, ' + number_of_clients_connected + ' total users online.');
    });

    socket.on('post_haiku', function(haiku) {
        //cleans up input in case user submits some html or something
        var line1 = striptags(haiku.line1);
        var line2 = striptags(haiku.line2);
        var line3 = striptags(haiku.line3);
        var haiku_id = shortid.generate(); //generates a shortID [thanks NPM!] for the haiku so we can rate it.

        var haiku_html = '<li class="line1">' + line1 + '</li><li class="line2">' + line2 + '</li><li class="line3">' + line3 + '</li><div class="haiku_author">' + client_ip + '</div><div class="haiku_id">' + haiku_id + '</div>\n';
        io.emit('share_haiku', haiku_html);
        //write to the file for this month
        //can be programmatically derived later, this is easy to change.
        fs.appendFile(current_haiku_monthly_file, haiku_html, function(err) {});
        console.log('new haiku from ' + client_ip + ' (' + haiku_id + ') ' + line1 + "/ " + line2 + "/ " + line3);
    });
    //reads haiku from the given haiku-year-month file and sends them
    socket.on('request_haiku_from_file', function(year_and_month_string) {
        var debugging_here = true;
        var haiku_file_string = 'haiku-' + year_and_month_string + '';
        var get_haiku_from_file_by_line_stream = byline(fs.createReadStream(haiku_file_string, {
            encoding: 'utf8'
        }));
        if (debugging_here) {
            console.log('haiku_file_string is ' + haiku_file_string);
        }
        get_haiku_from_file_by_line_stream.on('data', function(line_from_haiku_file) {
            io.to('all_haiku_room').emit('load_haiku_from_file', line_from_haiku_file);
            if (debugging_here) {
                console.log(line_from_haiku_file);
            }
        });
    });
    //ratings are tri-partite and tied to an IP address.
    socket.on('rate_haiku', function(rating) {

        //client_ip and rating are tethered to the haiku ID.
    });
});

http.listen((process.env.PORT || 8282), function() {
    console.log('listening on *:8282');
});

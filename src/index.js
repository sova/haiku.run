var express = require('express');
var app = express();
var favicon = require('serve-favicon');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var striptags = require('striptags');
var shortid = require('shortid');
var moment = require('moment');
var byline = require('byline');
var current_haiku_monthly_file = 'haiku-2016-09'
    /*var get_haiku_from_file_by_line = byline(fs.createReadStream(current_haiku_monthly_file, {
            encoding: 'utf8'
        })
      );*/
var number_of_clients_connected = 0;
var clients = [];
app.use(express.static('public'));
app.use(favicon('haiku_run_favicon.ico'));
app.get('/', function(req, res) {
    res.sendfile('views/index.html');
});

app.get('/all', function(req, res) {
    res.sendfile('views/all.html');
});


var number_of_haiku_to_keep_in_cache = 7;
var latest_haikus_cache = [];

var store_haiku_in_cache = function(haiku_html) {
    latest_haikus_cache.push(haiku_html);
    if (latest_haikus_cache.length > number_of_haiku_to_keep_in_cache) {
        latest_haikus_cache.shift(); //if more than (number_of_haiku_to_keep_in_cache), remove first one
    }
}

io.on('connection', function(socket) {
    var socket_id = socket.id;
    var client_ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
    //var s = '24.210.99.1';
    //console.log(s.replace(/(?:\.\d+){2}$/, '') + ".*.*");
    //http://stackoverflow.com/questions/39281845/hiding-last-2-segments-of-ip-using-js-regexp/39282019#39282019
    client_ip = '' + (client_ip.replace(/(?:\.\d+){2}$/, '') + ".*.*");
    clients.push(socket);
    //  console.info('New client connected (id=' + socket.id + ').');

    number_of_clients_connected++;
    console.log('[' + client_ip + '] connected, ' + number_of_clients_connected + ' total users online.');

    //when a socket is disconnected or closed, .on('disconnect') is fired
    socket.on('disconnect', function() {
        number_of_clients_connected--;
        console.log('[' + client_ip + '] disconnected, ' + number_of_clients_connected + ' total users online.');
        //on disconnect, remove from clients array
        var index = clients.indexOf(socket);
        if (index != -1) {
            clients.splice(index, 1);
            //console.info('Client gone (id=' + socket.id + ').');
        }
    });

    socket.on('post_haiku', function(haiku) {
        //cleans up input in case user submits some html or something
        var line1 = striptags(haiku.line1);
        var line2 = striptags(haiku.line2);
        var line3 = striptags(haiku.line3);
        var haiku_id = shortid.generate(); //generates a shortID [thanks NPM!] for the haiku so we can rate it.

        var haiku_html = '<li class="line1">' + line1 + '</li><li class="line2">' + line2 + '</li><li class="line3">' + line3 + '</li><div class="haiku_author">' + client_ip + '</div><div class="haiku_timestamp">' + moment().format("(YYYY-MM-D) h:mm a") + '<div class="haiku_id">' + haiku_id + '</div>\n';
        io.emit('share_haiku', haiku_html);
        //write to the file for this month
        //can be programmatically derived later, this is easy to change.
        fs.appendFile(current_haiku_monthly_file, haiku_html, function(err) {});
        /*cache*/
        store_haiku_in_cache(haiku_html); //store into latest haiku cache
        console.log('new haiku from ' + client_ip + ' (' + haiku_id + ') ' + line1 + "/ " + line2 + "/ " + line3);
    });

    //reads from latest_haikus_cache and sends them
    socket.on('request_haiku_cache', function() {
        latest_haikus_cache.forEach(function(a_latest_haiku) {
            clients[clients.indexOf(socket)].emit('load_haiku_from_cache', a_latest_haiku);
        });
    });


    //reads haiku from the given haiku-year-month file and sends them
    socket.on('request_haiku_from_file', function(year_and_month_string) {
        var debugging_here = false;
        var haiku_file_string = 'haiku-' + year_and_month_string + '';
        var get_haiku_from_file_by_line_stream = byline(fs.createReadStream(haiku_file_string, {
            encoding: 'utf8'
        }));
        if (debugging_here) {
            console.log('haiku_file_string is ' + haiku_file_string);
        }

        get_haiku_from_file_by_line_stream.on('data', function(line_from_haiku_file) {
            clients[clients.indexOf(socket)].emit('load_haiku_from_file', line_from_haiku_file);
            if (debugging_here) {
                console.log(line_from_haiku_file);
            }
        });
        if (debugging_here) {
            console.log('got all the haiku available in the file');
        }
    });
    //ratings are tri-partite and tied to an IP address.
    socket.on('rate_haiku', function(rating) {

        //client_ip and rating are tethered to the haiku ID.
    });
});

http.listen((process.env.PORT || 8282), function() {
    console.log('listening on *:8282');
});

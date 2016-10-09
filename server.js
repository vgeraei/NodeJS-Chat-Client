var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(require('http'));
var port = process.env.PORT || 3000;
var path = require('path');
var mongodb = require('mongodb');

io = require('socket.io').listen(server);

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

app.get('/', function(req, res){
    res.render('index.jade', {
    });
});


function User(){
    var name;
    var nickname;
    var online;
    var friends = new Array;
    var sock;
}

function message(){
    var from_nickname;
    var from_name;
    var to_nickname;
    var time;
    var text;
}

function name_nickname(){
    var name;
    var nickname;
}

function nickname_status(){
    var nickname;
    var online;
}

var users = new Array;
var messages = new Array;



var mongo = mongodb.MongoClient;
var addr = "mongodb://127.0.0.1:27017/chat";
mongo.connect(addr, function(error, db){
    console.log(error);
    if (error)
    {
        console.log('Can\'t connect to the mongoDB server. Error:', error);
    }
    else
    {
        console.log('Connected to', addr);
        global_db = db;
        usr_col = global_db.collection('users');
        msg_col = global_db.collection('messages');
        usr_col.find({}).toArray(function(error, res)
        {
            if (error)
            {
                console.log(error);
            }
            else if (res.length)
            {
                console.log(res.length);
                for(var i=0;i<res.length;i++)
                {
                    var user = new User();
                    user.name = res[i].name;
                    user.nickname= res[i].nickname;
                    user.friends = res[i].friends;
                    user.online = false;
                    //user.sock = res[i].sock;
                    users.push(user);
                }
                console.log('Founded Results:', res);
            }
            else
            {
                console.log('No results found!');
            }
        });

        msg_col.find({}).toArray(function(error, res)
        {
            if (error)
            {
                console.log(error);
            }
            else if (res.length)
            {
                console.log(res.length);
                for(var i=0;i<res.length;i++)
                {
                    var msg = new message();
                    msg.from_name = res[i].from_name;
                    msg.from_nickname = res[i].from_nickname;
                    msg.to_nickname = res[i].to_nickname;
                    msg.time = res[i].time;
                    msg.text = res[i].text;
                    //user.sock = res[i].sock;
                    messages.push(msg);
                }
                console.log('Founded Results:', res);
            }
            else
            {
                console.log('No results found!');
            }
        });
    }
});




io.on('connection', function (socket) {

    var cur_nickname;



    socket.on('login', function(rec_u){
        var u = new User();
        cur_nickname = rec_u.nickname;
        u.name = rec_u.name;
        u.nickname = rec_u.nickname;
        u.online = true;
        u.friends = [];
        u.sock = socket;


        //var sock_id;
        var ref;
        var exists = false;
        for(var i = 0; i < users.length; i++){
            if(users[i].nickname == u.nickname ){
                exists = true;
                users[i].sock = socket;
                users[i].online = true;
                temp_friends = new Array();

                //all friends with their status in one array
                for(var j=0; j<users[i].friends.length;j++){
                    var t = new nickname_status;
                    t.nickname = users[i].friends[j];

                    //find the status of friend and Broadcast
                    for(var k=0;k<users.length;k++){
                        if (users[k].nickname==users[i].friends[j]){
                            t.online = users[k].online;
                            console.log("Found status:  ", t.online , users[k]);


                            //Broadcast its status to friends (Online)
                            if(users[k].sock!=undefined) {
                                //console.log("broadcast online to "+users[k].nickname);
                                users[k].sock.emit('change status online', cur_nickname);
                            }
                        }
                    }

                    temp_friends.push(t);
                }

                socket.emit('friends', temp_friends);
                //sock_id = users[i];
                ref=i;
                break;

            }


        }

        if(exists==false) {
            //sock_id = socket.id;

            //push into users with socket
            users.push(u);


            var temp_user = {
                name: u.name,
                nickname: u.nickname,
                online: u.online,
                friends: u.friends
                //sock: u.sock
            };
            //push into DB without socket
            usr_col.insert(temp_user, function (err, result) { //change
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("User has been inserted to DB", result);
                }
            });

        }


        var temp_info = new name_nickname;
        temp_info.name= u.name;
        temp_info.nickname= u.nickname;
        socket.emit('send info', temp_info);

    });

    socket.on('add friend', function(u_f){
        var found = false;
        var ref_j;
        //console.log(u_f.nickname + "  "+ u_f.friend_name);
        for(var i=0;i<users.length;i++) {
            for (var j = 0; j < users.length; j++) {
                //check the name of the user, friend and if it already exist in it's friends list
                //&& users[j].indexOf(u_f.nickname)<= -1 check if user is not already a friend
                if (users[i].nickname == u_f.friend_name && users[j].nickname == u_f.nickname ) {
                    users[j].friends.push(users[i].nickname);
                    found = true;
                    usr_col.update({nickname: users[j].nickname}, {$set:{friends: users[j].friends}}, function(err, res){
                        if(err){
                            console.log(err);
                        }
                        else{
                            console.log(res);
                        }
                    });
                    ref_j=j;
                    var temp_friend= new nickname_status;
                    temp_friend.nickname = users[i].nickname;
                    temp_friend.status = users[i].online;
                    users[j].sock.emit('added', temp_friend);


                }
            }
        }

        if (found == false){
            users[ref_j].sock.emit('not added');
        }

        //arrValues.indexOf('Sam') > -1

    });



    socket.on('disconnect', function(){
        for(var i=0; i<users.length;i++){//all users
            if(users[i].nickname==cur_nickname){//find index of current user
                users[i].online=false;//hellp
                for(var j=0; j<users[i].friends.length;j++){//for on friends
                    for(var k=0;k<users.length;k++){//for on users
                        if (users[i].friends[j]==users[k].nickname){//find index of friends in users
                            if(users[k].sock!=undefined) {
                                users[k].sock.emit('change status offline', cur_nickname); //send offline status
                                users[k].sock.emit('last online', cur_nickname);
                            }
                        }
                    }
                }
            }
        }
    });

    socket.on('send message', function(msg){
        var m = new message;
        m.from_nickname= msg.from_nickname;
        m.from_name = msg.from_name;
        m.to_nickname=msg.to_nickname;
        m.time = new Date();
        m.text = msg.text;
        messages.push(m);
        //Insert to DB

        var temp_msg = {
                from_nickname: m.from_nickname,
                from_name: m.from_name,
                to_nickname: m.to_nickname,
                time: m.time,
                text: m.text
                //sock: u.sock
            };
            //push into DB without socket
            usr_col.insert(temp_msg, function (err, result) { //change
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("User has been inserted to DB", result);
                }
            });


            for(var i=0; i<users.length; i++){
                if (users[i].nickname==msg.to_nickname){
                    if(users[i].sock!=undefined){
                        users[i].sock.emit('recv message', m);
                        socket.emit('recv message',m);
                    }
                }
            }
    });

    socket.on('show messages', function(finder){

            for(var i=0;i<messages.length;i++){
                if((messages[i].to_nickname==finder.to && messages[i].from_nickname == finder.from) || (messages[i].to_nickname==finder.from && messages[i].from_nickname == finder.to) ){
                    socket.emit('recv message', messages[i]);
                }
            }
    } );

    socket.on('get status', function(nickname){
        for(var i=0;i<users.length;i++){
            if(users[i].nickname==nickname){
                socket.emit('set status',users[i].online);
            }

        }
    });

    socket.on('error', function (err) { console.error(err.stack); // TODO, cleanup
    });




});

app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
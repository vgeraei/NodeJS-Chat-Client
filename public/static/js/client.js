'use strict';
console.log('User has started');

//var current_target;

var socket = io.connect();

function l_online(){
    var nickname;
    var time;
}

function User(){
  var name;
  var nickname;
}

function friend_nickname(){
    var nickname;
    var friend_name;
}

function message(){
    var from_nickname;
    var from_name;
    var to_nickname;
    var time;
    var text;
}

function msg_finder(){
    var from;
    var to;
}

var cur_user = new User;
var to_nickname;
var lasts = new Array();

var friend_status;

$(document).ready(function() {
    $('#myModal.ui.modal').modal("show");
    console.log("showing!!");
    $('#messages-pane').hide();
    //$('#friends-list').hide();
});

$('#login.ui.button').on("click", function(){
    console.log("login button!!");
    var u= new User;
    u.name = $('#name').val();
    u.nickname = $('#nickname').val();

    socket.emit('login', u);
    return false;
});


socket.on('send info', function(u){
    cur_user.name= u.name;
    cur_user.nickname= u.nickname;
    $('#user-info.ui.raised.stacked.segment h2.ui.icon .content span').html('Welcome, '+ u.name + "!");
    $('#user-info.ui.raised.stacked.segment h2.ui.icon .ui.circular.image').attr("src","static/avatars/"+ u.nickname+".jpg");
    $('#user-info.ui.raised.stacked.segment h2.ui.icon .content .sub.header').html('@'+ u.nickname);
    $('#myModal.ui.modal').modal("hide");
});

socket.on ('friends', function(friends){
    //console.log(nick_status.nickname);
    for(var i=0; i<friends.length;i++) {
        if (friends[i].online == true) {//if online
            $('#roster').append("<a class='active green item' nickname=" + friends[i].nickname + "><span>" + friends[i].nickname + "</span></a>");
        }
        else {
            $('#roster').append("<a class='blue item' nickname=" + friends[i].nickname + "><span>" + friends[i].nickname + "</span></a>");
        }
    }
    return false;
});

$('#add_friend').keypress("click", function(key){
    if(key.which == 13){//If enter is pressed
        var n = $('#add_friend').val();
        $('#add_friend').val('');

        //sends both this and friends'name
        if(n!=""){
            var u_f = new friend_nickname();
            u_f.nickname = cur_user.nickname;
            u_f.friend_name = n;
            console.log(u_f.nickname + "  " +u_f.friend_name);
            socket.emit('add friend', u_f );
        }
    }
});


socket.on('added', function(nick_status){
    //console.log(nick_status.nickname);
    if(nick_status.status==true) {//if online
        $('#roster').append("<a class='active green item' nickname="+nick_status.nickname + "><span>"  +nick_status.nickname + "</span></a>");
    }
    else
    {
       $('#roster').append("<a class='blue item' nickname="+ nick_status.nickname +"><span>"  +nick_status.nickname + "</span></a>");
    }
    return false;
});

socket.on('not added', function(){
   alert("This User Does not exists!") ;
});

socket.on('change status online' , function(nickname){
    $("#roster a[nickname="+nickname+"]").removeClass('blue');
    $("#roster a[nickname="+nickname+"]").addClass('active green');
});

socket.on('change status offline', function(nickname){
    $("#roster a[nickname="+nickname+"]").removeClass('active green');
    $("#roster a[nickname="+nickname+"]").addClass('blue');
});

$('#formid.ui.form').submit(function(){
    var msg = new message;
    msg.from_nickname = cur_user.nickname;
    msg.from_name = cur_user.name;
    msg.to_nickname = to_nickname;
    msg.time = Date.now();
    msg.text = $('#chat-msg').val();
    $('#chat-msg').val('');
    socket.emit('send message', msg);

    return false;
});


$('#roster').on("click",'a',function(){
    if($(this).find('div.ui.blue.label').length != 0){
        $('div.ui.blue.label',this).remove();
    }
    to_nickname = $(this).text();
    $('#messages-pane').show();

    //socket.emit('show messages', to_nickname);
    $('.chat-title-name span').html('Conversation with @'+to_nickname);

    socket.emit('get status',to_nickname);

    //console.log("To: ",to_nickname);


    $('#messages .ui.minimal.comments').html('');

    var t = new msg_finder;
    t.to = to_nickname;
    t.from = cur_user.nickname;
    socket.emit('show messages', t);
    return false;
});

socket.on('set status',function(online){
    console.log("Status ",online);
    friend_status = online;
    if (friend_status==true){
        $('.chat-title-name .sub.header').html('Online');
    }else{
        var found =false;
        for(var i=0;i<lasts.length; i++){
            if(lasts[i].nickname==to_nickname){
                $('.chat-title-name .sub.header').html('Last Online:'+lasts[i].time);
                found=true;
            }

        }

        if (found==false) {
            $('.chat-title-name .sub.header').html('Offline');
        }
    }
});

socket.on('recv message', function(msg){
    //alert(msg.text);
    //alert("message received!");
    if(msg.from_nickname==to_nickname || msg.to_nickname==to_nickname){
        $('#messages .ui.minimal.comments').append("<div class='comment'><a class='avatar'><img src=static/avatars/" + msg.from_nickname + ".jpg" + "></a><div class='content'><a class='author'>" + msg.from_name + "</a><div class='metadata'><span class='date'>" + msg.time + "</span></div><div class='text'>" + msg.text + "</div></div></div>");
    }

    if(msg.from_nickname != to_nickname){
        //alert("unseen message");
        if($("#roster a[nickname=" + msg.from_nickname + "]").find('div.ui.blue.label').length != 0){
            var unseen = $("#roster a[nickname=" + msg.from_nickname + "]").find('div.ui.blue.label').text();
            unseen++;
            $("#roster a[nickname=" + msg.from_nickname + "]").find('div.ui.blue.label').text(unseen);
            //alert(unseen);
        }else{
            var unseen = 1;
            $("#roster a[nickname=" + msg.from_nickname + "]").append("<div class='ui blue label'>"+unseen+"</div>");
        }
    }

});

socket.on('last online', function(nickname){
    var found=false;
    for(var i=0;i<lasts.length;i++){
        if(lasts[i].nickname==nickname){
            lasts[i].time = new Date();
            found=true;
        }

    }

    if (found==false){
        var temp=new l_online;
        temp.nickname=nickname;
        temp.time=new Date();
        lasts.push(temp);
    }
});


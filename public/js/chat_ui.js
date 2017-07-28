function divEscapedContentElement(message) {
    return $('<div/>').text(message);
}
function divSystemContentElement(message) {
    return $('<div/>').html('<i>' + message + '</i>');
}
 require(['socket.io','chat'],function (io,Chat) {
    console.log(Chat)
var $message = $('#message');
var $sendMessage = $('#send-message');
function processUserInput(chatApp,socket) {
    var message = $sendMessage.val();
    var systemMessage;
    if(message.charAt(0) == '/'){
        systemMessage = chatApp.processCommand(message);
        if(systemMessage){
            $messageappend(divSystemContentElement(systemMessage));
        }
    }else {
        chatApp.sendMessage($('#room').text(), message);
        $message.append(divEscapedContentElement(message))
            .scrollTop($message.prop('scrollHeight'));
    }
    $sendMessage.val('');
}

    var socket = io.connect();
    socket.on('connect', function () {
        console.log('Client has connected to the server!');
    });


    $(function () {
        var chatApp = new Chat(socket);

        socket.on('nameResult', function (result) {
            var message;
            if (result.success) {
                message = 'You are now konwn as' + result.name + '.';
            } else {
                message = result.message;
            }
            $message.append(divSystemContentElement(message))
        });

        socket.on('joinResult', function (result) {
            $('#room').text(result.room);
            $message.append(divSystemContentElement('Room changed.'))
        });

        socket.on('message', function (message) {
            var newElement = $('<div/>').text(message.text);
            $message.append(newElement);
        });

        socket.on('rooms', function (rooms) {
            $('#room-list').empty();
            for (var room in rooms) {
                // room = room.substring(1, room.length);
                if (room != "" && room.indexOf('-Room')!== -1) {
                    $('#room-list').append(divEscapedContentElement(room));
                }
            }

            $('#room-list div').click(function () {
                chatApp.processCommand('/join ' + $(this).text());
                $sendMessage.focus();
            });
        });

        setInterval(function () {
            socket.emit('roomsp');
        }, 1000);
        $sendMessage.focus();
        $('#send-form').submit(function () {
            processUserInput(chatApp, socket);
            return false;
        });
    })
})
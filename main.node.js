
// config options
var config = require('./config.js');

var fs = require('fs');
var net = require('net');

// check debug mode
var compile_js = true;
switch(config.debug_mode.set)
{
    case 'file':
        var debug_file_content = null;
        try{
            debug_file_content = fs.readFileSync(config.debug_mode.debug_file, 'utf8')
        } catch (e) {
            console.log('Could not open debug file')
        }
        if(debug_file_content === '1\n')
        {
            compile_js = false;
        }
    break;
    case true:
        compile_js = false;
    break;
    case false:
        // ok
    break;   
}
if(!compile_js)
{
    console.log('DEBUG MODE ENABLED');
}

/**
 * Static array of FIles we're using
 */
 var file_object = {
     '/':{path:'./pages/main.page.html', content_type:'text/html'},
     '/js/client_config.js':{path:'./includes/client_config.js', content_type:'text/javascript', is_binary:false, extern:false},
     '/js/jquery-1.7.2.js':{path:'./includes/jquery-1.7.2.js', content_type:'text/javascript', is_binary:false, extern:false},
     '/js/client.class.js':{path:'./includes/client.class.js', content_type:'text/javascript', is_binary:false, extern:false},
     '/js/channel.class.js':{path:'./includes/channel.class.js', content_type:'text/javascript', is_binary:false, extern:false},
     '/js/user.class.js':{path:'./includes/user.class.js', content_type:'text/javascript', is_binary:false, extern:false},
     '/js/page.class.js':{path:'./includes/page.class.js', content_type:'text/javascript', is_binary:false, extern:false},
     '/js/pm.class.js':{path:'./includes/pm.class.js', content_type:'text/javascript', is_binary:false, extern:false},
     '/js/interface.class.js':{path:'./includes/interface.class.js', content_type:'text/javascript', is_binary:false, extern:false},
     '/js/socket.io.js':{path:'./node_modules/socket.io/node_modules/socket.io-client/socket.io.js', content_type:'text/javascript', is_binary:false, extern:true},
     '/js/init.js':{path:'./includes/init.js', content_type:'text/javascript', is_binary:false, extern:false},
     '/style.css':{path:'./includes/style.css', content_type:'text/css', is_binary:false},
     '/img/bg-top.png':{path:'./includes/bg-top.png', content_type:'image/png', is_binary:true},
     '/favicon.ico':{path:'./includes/style.css', content_type:'image/ico', is_binary:true},
     '/img/star.png':{path:'./includes/star.png', content_type:'image/png', is_binary:true},
     '/img/cup.png':{path:'./includes/cup.png', content_type:'image/png', is_binary:true},
     '/img/user_delete.png':{path:'./includes/user_delete.png', content_type:'image/png', is_binary:true},
     '/img/sound_mute.png':{path:'./includes/sound_mute.png', content_type:'image/png', is_binary:true},
     '/img/accept.png':{path:'./includes/accept.png', content_type:'image/png', is_binary:true}
 };
 
 // param options
 var compile_assets = false;
 
 // get arguments
 var first_param_found = false;
 process.argv.forEach(function(val, index, array)
 {
    if(val.substr(0,2) == '--')
    {
        first_param_found = true;
    }
    
    if(first_param_found)
    {
        switch(val)
        {
            case '--compile_assets':
                if(!compile_js)
                {
                    // invalid param
                    console.log('compile_js var set to false :(')
                    process.exit(1);
                }

                compile_assets = true;
            break;
            default:
                // invalid param
                console.log('Invalid param: ' + val)
                process.exit(1);
            break;
        }
    }
    
 });
 
 if(compile_js)
 {
     var url = '';
     var new_file_object = new Object();
     
    if(compile_assets)
    {
        var jar_line = '/usr/bin/java -jar assets/compiler.jar --js_output_file assets/js.js ';//--compilation_level ADVANCED_OPTIMIZATIONS '
        var file = ''
        for(url in file_object)
        {
           file = file_object[url];
           if(file.content_type == 'text/javascript'  && !file.extern)
           {
               if(file.extern)
               {
                   //jar_line += '--externs ' + file.path + ' ';
               } else {
                   jar_line += '--js ' + file.path + ' ';
               }

           } else {
               new_file_object[url] = file;
           }

        }
        
        console.log('compiling using line:');
        console.log(jar_line);
        require('child_process').exec(jar_line, function (error, stdout, stderr){
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if(error !== null){
                console.log('exec error: ' + error);
                process.exit(1);
            }
            
        });
        
        process.exit(1);
    } else {
        for(url in file_object)
        {
            if(file_object[url].content_type != 'text/javascript' || file_object[url].extern)
            {
                new_file_object[url] = file_object[url];
            }
        }
    }
    
    new_file_object['/js/js.js'] = {
        path: './assets/js.js',
        content_type: 'text/javascript',
        is_binary: false,
        extern: false
    }
     
     
    
    file_object = new_file_object;
    
    // clean up
    delete new_file_object;
    delete url;
 }
 

var http = require('http');
var io = require('socket.io');


/**
 * STATIC INITIAL FILE SERVING
 */
var s = http.createServer(function(req, client){
    
    loadFile(req.url, client);
});
s.listen(config.http.port, config.http.ip);

function loadFile(url, client)
{
    //console.log(file_object);
    if(file_object[url] == undefined)
    {
        console.log('ERROR: File not found using the following url: ' + url);
        client.writeHead(404, {'content-type':'text/html'});
        client.end('File not found');
        return;
    }
    
    var file = file_object[url];
    
    fs.readFile(file.path, function(err, data)
    {
        if(err) {
            console.error("Could not open file from %s to %s: %s", file.url, file.file_path, err);
            process.exit(1);
        }
	 
        client.writeHead(200, {'content-type':file.content_type});
        if(file.is_binary)
        {
            client.end(data, 'binary');
        } else {
            client.end(data.toString('utf-8'));
        }
        
	});
    
}

/**
 * PROCCES STUFF
*/
//on exit
process.on('exit', function () {
  console.log('Exiting');
});

/**
* EVENT PUSHING CODE
*/
// class includes
s_Functions = require('./classes/functions.js');
s_Functions.setSaltAndPepper(config.db_config.salt, config.db_config.pepper);
s_User = require('./classes/user.class.js');
s_Channel = require('./classes/channel.class.js');
//s_Channel_Users = require('./classes/channel_users.class.js');
s_Security = require('./classes/security.class.js');
s_DBQueue = require('./classes/db_queue.class.js');

//var s_live = http.createServer(handler);
var s_io = io.listen(s);
// s_io.set('log level', 1);

// TODO: setting
var max_messages_per_second = 2;

//var sockets = new Array();
// keys are the usernames
var user_list = new Object();
user_list.users = new Object();
// keys are the channel names
var channels = new Object();

// method on the user array to get a user. If it doesn't exists create it
user_list.retrieveUser = function(name)
{
    //console.log('retrieve user')
    if(name in user_list.users)
    {
        //console.log('retrieve user: grab existing user');
        return user_list.users[name];
    } else {
        user_list.users[name] = new s_User();
        user_list.users[name].setName(name);
        //console.log('retrieve user: created user');
        return user_list.users[name];
    }
}

// method on the user array to get a user. If it doesn't exists return false
user_list.getUser = function(name)
{
    //console.log('get user')
    if(name in user_list.users)
    {
        //console.log('get user: grab existing user');
        return user_list.users[name];
    } else {
        //console.log('get user: user trying to get doesn\'t exist');
        return false;
    }
}

user_list.getUsers = function()
{
    return user_list.users;
}

// http://stackoverflow.com/a/3710226
var json_parse = function (str) {
    try {
        return JSON.parse(str);
    } catch (e) {
		console.log('Invalid JSON socket data: '+ str);
        return false;
    }
};

//mysql client
var database = null
var mysql = require("mysql");


var database = new s_DBQueue(connection);

var connection;
function handleDisconnect() {
  connection = mysql.createConnection(config.db_config); // Recreate the connection, since
  database.setConnection(connection);
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      database.setInactive();
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } else {                                // to avoid a hot loop, and to allow our node script to
        database.setActive();
    }
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
      database.setInactive();
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}
handleDisconnect();
    
console.log("DB Connection succesfull!");

var list_event_function = function(channel, statuscode, param)
{
    //console.log('list event function on channel: '+ channel.getName() +'. Status: '+statuscode+'. Param: '+param);
    for(var user_name in user_list.getUsers())
    {
        var list_user = user_list.getUser(user_name);
        if(list_user.isConnected() && list_user.isChannelListActive())
        {
            if(statuscode == 'update_public')
            {
                if(param)
                {
                    list_user.emit('channel_list_add', {
                        'name':channel.getName(),
                        'users_no':channel.getNumberOfJoinedUsers(),
                        'topic':channel.getTopic(),
                        'has_password':(channel.getPassword()==''?false:true)
                    });
                } else {
                    list_user.emit('channel_list_remove', {
                        'name':channel.getName()
                    });
                }

            } else {
                list_user.emit('channel_list_update', 
                {
                    'channel_name':channel.getName(),
                    'statuscode':statuscode,
                    'param':param
                });
            }

        }
    }
}


// Retrieve all the regged channels and put them in 'channels' (this is for the channel lists)
database.query('Select name from channels where public = 1' , [], function(error, rows, cols) {
    if (error) {
        console.log('ERROR: ' + error);
        return false;
    }

    for(var i = 0; i < rows.length; i++)
    {
        //console.log(rows[i].name);
        // create channel
        var channel = new s_Channel(database, rows[i].name, user_list, list_event_function, function(success){
            if(success == 'success')
            {
                //console.log('adding channel '+ channel.getName() + ' to channels');
                channels[channel.getName()] = channel;
                return true;

            } else {
                // TODO: send error
                return false;
            }
        }); 
    }
}, {'async':false});

var server = net.createServer(function(c) { //'connection' listener
    // console.log('android connected');

    // grab the user once connected, so we can use it when the socket fails
    var socket_user = null;

    c.setNoDelay(true);
    var started = false;
    var socket_triggers = {};
    var socket = {
        'on':function(action, func)
        {
            if(action == 'disconnect')
            {
                c.on('end',func);
            } else {
                socket_triggers[action] = func;
            }
        },
        'emit':function(action, param)
        {
            // console.log('android calling "emit":' +  action);
            if(typeof param === 'undefined')
            {
                param = {'action':action};
            } else {
                param['action'] = action;
            }

            // console.log('sending: '+ JSON.stringify(param));
            c.write(JSON.stringify(param)+'\n');
            //c.flush();
        }
    };

    c.on('data', function(data) {

        // console.log('recieve-Data');
        // console.log(data);
        data = json_parse(data);
		if(data === false)
		{
			return;
		}

      // console.log(data.toString());
      var action = data.action;

      // incoming: login, username, password
        var start = function(data)
        {
            // console.log(data);

            var login =  s_Security.escape.bool(data.login);
            if(!s_Security.checker.username(data.username))
            {
                socket.emit('invalid_field', {field:'username'});
                return;
            }
            var username =  data.username;
            var password =  '';
            if(s_Security.checker.userPassword(data.password))
            {
                password =  data.password;
            }

            // check if login
            if(login)
            {
                // create user
                var user = user_list.retrieveUser(username, 'socket');

                // other scope socket_user
                socket_user = user;

                login_function({'password':password, 'callback':function(success)
                {
                    if(success)
                    {
                        // registered user was already connected? Do the disconnect first
                        if(user.isConnected())
                        {
                            //console.log('reconnect->disconnect');
                            user.emit('logged_in_elsewhere');

                            // remove from his channels
                            var channel_users = user.getChannelUsers();
                            for(var channel_name in channel_users)
                            {   
                                var loop_channel = channel_users[channel_name].getChannel(); 
                                if(loop_channel.quitUser(user))
                                {

                                    if(loop_channel.getNumberOfJoinedUsers() == 0 && !loop_channel.isRegged())
                                    {
                                        //console.log('non regged channel \'' + loop_channel.getName() + '\'with no users, deleting...')

                                        // set public to false first, so that everybody's list will be updated accordingly'
                                        loop_channel.setPublic(false);

                                        // delete channel from list
                                        delete channels[loop_channel.getName()];

                                        // unset corresponding channel_user
                                        delete channel_users[channel_name];
                                    }
                                }
                            }

                            // no moar connection
                            user.unsetSocket();
                            user.setChannelListInactive();
                        }

                        user.setSocket(socket);

                        user.emit('started', {'is_root':user.isRoot()} );

                        // get first page from db
                        database.query('Select title, text from text_pages where id = 1', [], function(error, rows, cols) {
                            if(rows.length > 0)
                            {
                                user.emit('text_found', {'title':rows[0].title, 'text':rows[0].text});
                            }

                        });


                        user.setConnected(true);

                        // unregistered channels that we still have, join them
                        var active_channels_joined = user.joinActiveChannels();

                        //get all active ChannelUsers for this user and add them
                        database.query('select cu.*, c.name from channels_users as cu inner join channels as c on c.id=cu.channel_id where user_id = ? and active = 1', [user.getId()], function(error, rows, cols) {
                            if (error) {
                                console.log('ERROR: ' + error);
                                return false;
                            }


                            if(rows.length == 0 && !active_channels_joined)
                            {
                                // still make a loop when there is no active channel_user
                                rows[0] = null;
                            }

                            for(var i = 0; i < rows.length; i++)
                            {
                                var channel_name = '';
                                if(rows[i] == null)
                                {
                                    // no active channel_user, join main
                                    channel_name = 'android';
                                } else {
                                    channel_name = rows[i].name;
                                }

                                // copied from socket.on('join_channel'....
                                //console.log(user.getName() + ': joining channel ' + channel_name);
                                // check if channel exists
                                var channel = null;
                                if(channel_name in channels)
                                {
                                    //console.log(user.getName() + ': channel already exists');
                                    channel = channels[channel_name];
                                    //console.log(rows[i]);
                                    channel.addUser(user, rows[i], '', function(success)
                                    {
                                        switch(success)
                                        {
                                            case 'success':
                                                //console.log(user.getName() + ': successfull join');
                                            break;
                                            case 'fail':
                                                //console.log(user.getName() + ': unable to add user');
                                            break;
                                            case 'password_required':
                                                socket.emit("password_required", {"channel_name":channel_name});
                                            break;
                                            case 'password_invalid':
                                                socket.emit("password_invalid", {"channel_name":channel_name});
                                            break;
                                        }
                                    });

                                } else {
                                    //console.log(user.getName() + ': creating channel on start');

                                    // 'infamous loop problem' rows[i] not being available, create a function around it
                                    var create_channel = function(channel_name, mysql_result)
                                    {
                                        // create channel
                                        var channel = new s_Channel(database, channel_name, user_list, list_event_function, function(success){
                                            if(success)
                                            {
                                                // add user
                                                //console.log(channel_name);

                                                channel.addUser(user, mysql_result, '', function(success){
                                                    if(success == 'success')
                                                    {
                                                        // add channel to list
                                                        //console.log('adding channel '+ channel.getName() + ' to channels');
                                                        channels[channel.getName()] = channel;

                                                        //console.log(user.getName() + ': successfull join');

                                                    } else {
                                                        //console.log(user.getName() + ': unable to add user');
                                                    }
                                                });

                                                return true;

                                            } else {
                                                // TODO: send error
                                                return false;
                                            }
                                        });   
                                    }
                                    create_channel(channel_name, rows[i]);
                                }
                                // end of copy socket.on('join_channel'....
                            }

                            return true;
                        });

                        setSocketCallbacks(socket, user, list_event_function);
                    } else {
                        delete user;
                    }
                }}, user, socket);
            } else {
                //nickname
                s_Functions.checkNickInuse(database, username, user_list, function(success){
                    if(success)
                    {
                        //console.log(username + ': nick ' +  username + ' taken');
                        socket.emit('nick_taken');
                    } else {
                        //console.log(username + ': nick not taken :D');

                        // create user
                        var user = user_list.retrieveUser(username, 'socket');

                        // other scope socket_user
                        socket_user = user;

                        user.setConnected(true);
                        user.setSocket(socket);

                        // get first page from db
                        database.query('Select title, text from text_pages where id = 1', [], function(error, rows, cols) {
                            if(rows.length > 0)
                            {
                                user.emit('text_found', {'title':rows[0].title, 'text':rows[0].text});
                            }

                        });

                        user.emit('started', {'is_root':false} );

                        setSocketCallbacks(socket, user, list_event_function);
                    }
                });
            }

            started = true;
        };


    c.on('error', function(err){

        // unset the socket of the user
        if(socket_user !== null)
        {
            socket_user.unsetSocket();
        }

        // Handle the connection error.
        console.log('SOCKET ERROR: ');
        console.log(err);
        c.destroy();
    });


      if(action === 'start')
      {
            // console.log('pre-start');
            // console.log(data)
            start(data);
      } else if(started)
      {
        if(action in socket_triggers)
        {
            // console.log('android calling "on":' +  action);
            socket_triggers[action](data);
        } else {
            // console.log('Android: unknown action:' + action);
        }
      } else {
          // console.log('Android: Attempting to call action while not calling start first: '+ action);
      }

    });
    c.pipe(c);
});    
server.listen(8124, function() { //'listening' listener
    console.log('android socket server bound');
});

// above statement should have been completed, socket connect
s_io.sockets.on('connection', function (socket) {

    //console.log('user connecting!');     

    //sockets.push(socket);
    // incoming: login, username, password
    socket.on('start', function (data) {

        var login =     s_Security.escape.bool(data.login);
        if(!s_Security.checker.username(data.username))
        {
            socket.emit('invalid_field', {field:'username'});
            return;
        }
        var username =  data.username;
        var password =  '';
        if(s_Security.checker.userPassword(data.password))
        {
            password =  data.password;
        }

        // check if login
        if(login)
        {
            // create user
            var user = user_list.retrieveUser(username, 'websocket');

            login_function({'password':password, 'callback':function(success)
            {
                if(success)
                {
                    // registered user was already connected? Do the disconnect first
                    if(user.isConnected())
                    {
                        //console.log('reconnect->disconnect');
                        user.emit('logged_in_elsewhere');

                        // remove from his channels
                        var channel_users = user.getChannelUsers();
                        for(var channel_name in channel_users)
                        {   
                            var loop_channel = channel_users[channel_name].getChannel(); 
                            if(loop_channel.quitUser(user))
                            {

                                if(loop_channel.getNumberOfJoinedUsers() == 0 && !loop_channel.isRegged())
                                {
                                    //console.log('non regged channel \'' + loop_channel.getName() + '\'with no users, deleting...')

                                    // set public to false first, so that everybody's list will be updated accordingly'
                                    loop_channel.setPublic(false);

                                    // delete channel from list
                                    delete channels[loop_channel.getName()];

                                    // unset corresponding channel_user
                                    delete channel_users[channel_name];
                                }
                            }
                        }

                        // no moar connection
                        user.unsetSocket();
                        user.setChannelListInactive();
                    }

                    user.setSocket(socket);

                    user.emit('started', {'is_root':user.isRoot()} );

                    // get first page from db
                    database.query('Select title, text from text_pages where id = 1', [], function(error, rows, cols) {
                        if(rows.length > 0)
                        {
                            user.emit('text_found', {'title':rows[0].title, 'text':rows[0].text});
                        }

                    });


                    user.setConnected(true);

                    // unregistered channels that we still have, join them
                    var active_channels_joined = user.joinActiveChannels();

                    //get all active ChannelUsers for this user and add them
                    database.query('select cu.*, c.name from channels_users as cu inner join channels as c on c.id=cu.channel_id where user_id = ? and active = 1', [user.getId()], function(error, rows, cols) {
                        if (error) {
                            console.log('ERROR: ' + error);
                            return false;
                        }


                        if(rows.length == 0 && !active_channels_joined)
                        {
                            // still make a loop when there is no active channel_user
                            rows[0] = null;
                        }

                        for(var i = 0; i < rows.length; i++)
                        {
                            var channel_name = '';
                            if(rows[i] == null)
                            {
                                // no active channel_user, join main
                                channel_name = 'main';
                            } else {
                                channel_name = rows[i].name;
                            }

                            // copied from socket.on('join_channel'....
                            //console.log(user.getName() + ': joining channel ' + channel_name);
                            // check if channel exists
                            var channel = null;
                            if(channel_name in channels)
                            {
                                //console.log(user.getName() + ': channel already exists');
                                channel = channels[channel_name];
                                //console.log(rows[i]);
                                channel.addUser(user, rows[i], '', function(success)
                                {
                                    switch(success)
                                    {
                                        case 'success':
                                            //console.log(user.getName() + ': successfull join');
                                        break;
                                        case 'fail':
                                            //console.log(user.getName() + ': unable to add user');
                                        break;
                                        case 'password_required':
                                            socket.emit("password_required", {"channel_name":channel_name});
                                        break;
                                        case 'password_invalid':
                                            socket.emit("password_invalid", {"channel_name":channel_name});
                                        break;
                                    }
                                });

                            } else {
                                //console.log(user.getName() + ': creating channel on start');

                                // 'infamous loop problem' rows[i] not being available, create a function around it
                                var create_channel = function(channel_name, mysql_result)
                                {
                                    // create channel
                                    var channel = new s_Channel(database, channel_name, user_list, list_event_function, function(success){
                                        if(success)
                                        {
                                            // add user
                                            //console.log(channel_name);

                                            channel.addUser(user, mysql_result, '', function(success){
                                                if(success == 'success')
                                                {
                                                    // add channel to list
                                                    //console.log('adding channel '+ channel.getName() + ' to channels');
                                                    channels[channel.getName()] = channel;

                                                    //console.log(user.getName() + ': successfull join');

                                                } else {
                                                    //console.log(user.getName() + ': unable to add user');
                                                }
                                            });

                                            return true;

                                        } else {
                                            // TODO: send error
                                            return false;
                                        }
                                    });   
                                }
                                create_channel(channel_name, rows[i]);
                            }
                            // end of copy socket.on('join_channel'....
                        }

                        return true;
                    });

                    setSocketCallbacks(socket, user, list_event_function);
                } else {
                    delete user;
                }
            }}, user, socket);
        } else {
            //nickname
            s_Functions.checkNickInuse(database, username, user_list, function(success){
                if(success)
                {
                    //console.log(username + ': nick ' +  username + ' taken');
                    socket.emit('nick_taken');
                } else {
                    //console.log(username + ': nick not taken :D');

                    // create user
                    var user = user_list.retrieveUser(username, 'websocket');
                    user.setConnected(true);
                    user.setSocket(socket);

                    // get first page from db
                    database.query('Select title, text from text_pages where id = 1', [], function(error, rows, cols) {
                        if(rows.length > 0)
                        {
                            user.emit('text_found', {'title':rows[0].title, 'text':rows[0].text});
                        }

                    });

                    user.emit('started', {'is_root':false} );

                    setSocketCallbacks(socket, user, list_event_function);
                }
            });
        }
    });
});

var login_function = function(data, user, socket)
{
    //console.log('loggin in');
    s_Functions.login(database, user_list, user, data.password, function(success){
        if(success)
        {
            //tell all users we know we had success
            var user_channel_users = user.getChannelUsers();
            for(var channel_name in user_channel_users)
            {
                user_channel_users[channel_name].getChannel().isLoggedIn(user.getName());
            }
            
            // call the optional callback
            if(typeof(data.callback) !== 'undefined')
            {
                data.callback(true);
            }
            
            
        } else {
            
            // only tell ourselves
            socket.emit('logged_in_failed');
            
            data.callback(false);
        }


    });
}

var setSocketCallbacks = function(socket, user, list_event_function)
{
    var message_timer = Math.round((new Date()).getTime() / 1000);
    var messages_per_second = 0;
    
    // incoming: name, password
    socket.on('join_channel', function(data)
    {
        if(user.getSocket() !== socket)
        {
            //console.log('join_channel, wrong socket on user: '+ user.getName());
            return;
        }

        if(!s_Security.checker.channelName(data.name))
        {
            socket.emit('invalid_field', {field:'channel_name'});
            return;
        }
        if(!s_Security.checker.channelPassword(data.password))
        {
            return;
        }
        var name =      data.name;
        var password =  data.password;
        
        //console.log('join_channel:');
       // console.log(user.getName() + ': joining channel ' + name);
        // check if channel exists
        var channel = null;
        if(name in channels)
        {
            //console.log(user.getName() + ': channel already exists');
            channel = channels[name];
            channel.addUser(user, null, password, function(success)
            {
                switch(success)
                {
                    case 'success':
                        //console.log(user.getName() + ': successfull join');
                    break;
                    case 'fail':
                        //console.log(user.getName() + ': unable to add user');
                    break;
                    case 'password_required':
                        socket.emit("password_required", {"channel_name":name});
                    break;
                    case 'password_invalid':
                        socket.emit("password_invalid", {"channel_name":name});
                    break;
                }
            });

            return;

        } else {
            //console.log(user.getName() + ': creating channel');


            // create channel
            channel = new s_Channel(database, name, user_list, list_event_function, function(success){
                if(success)
                {
                    // add user
                    channel.addUser(user, null, '', function(success){
                        // andere cases doen we hier niet, want een channel kan in dit geval geen password hebben?
                        if(success == "success")
                        {
                            // add channel to list
                            //console.log('adding channel '+ channel.getName() + ' to channels');
                            channels[channel.getName()] = channel;

                            //console.log(user.getName() + ': successfull join');

                        } else {
                            //console.log(user.getName() + ': unable to add user');
                        }
                    });

                    return true;
                } else {
                    // TODO: send error

                    return false;
                }
            });

        }
    });

    // incoming: name 
    socket.on('leave_channel', function(data)
    {
        if(user.getSocket() !== socket)
        {
            //console.log('leave_channel, wrong socket on user: '+ user.getName());
            return;
        }
        
        if(!s_Security.checker.channelName(data.name))
        {
            return;
        }
        var name = data.name;
        
        //console.log(user.getName() + ': leaving channel ' + name);
        // check if channel exists
        var channel = null;
        if(name in channels)
        {
            //console.log('leaving channel found');
            channel = channels[name];
            if(channel.removeUser(user))
            {
                //console.log('user removed');                    

                user.emit('channel_leave', {"name":channel.getName()});
                
                if(channel.getNumberOfJoinedUsers() == 0 && !channel.isRegged())
                {
                    //console.log('non regged channel \'' + name + '\'with no users, deleting...')
                    
                    // set public to false first, so that everybody's list will be updated accordingly'
                    channel.setPublic(false);
                    
                    // delete channel from list
                    delete channels[name];
                }

                //return true;

            } else {

                //console.log(user.getName() + ': could not leave channel');
                //return false;
            }

        } else {
            //console.log(user.getName() + ': channel ' + name + 'doesn\'t exists!');
            //return false;
        }
    });

    // incoming: channel_name, message
    socket.on('send_message', function(data){
        if(user.getSocket() !== socket)
        {
            //console.log('send_message, wrong socket on user: '+ user.getName());
            return;
        }
        
        if(!s_Security.checker.channelName(data.channel_name))
        {
            return;
        }
        var channel_name =  data.channel_name;
        var message =       s_Security.escape.channelMessage(data.message);
        
        //console.log('send_message called');

        // check if we are in this channel_users
        var channel_users = user.getChannelUsers();
        if( (!channel_name in channel_users) || !channel_users[channel_name].isJoined())
        {
            //console.log('user ' + user.getName() + 'tried to talk in channel ' + channel_name + 'but he\'s not in there');
            return;
        }
        var channel_user = channel_users[channel_name];

        // skip checks if we are root :)
        if(!user.isRoot())
        {
            // check if not muted
            if(channel_user.isMuted())
            {
                //console.log('user is muted');
                return;
            }
            // skip empty messages
            //if(message == "")
            //{
            //    console.log('empty message given, not sending');
            //    return false;
            //}
            
            // check timer if we are allowed
            var current_time = Math.round((new Date()).getTime() / 1000);
            if(message_timer == current_time)
            {
                messages_per_second++;
                if(messages_per_second >= max_messages_per_second)
                {
                    user.emit('notice', {'notice':'message_cap'});
                    return;
                }

            } else {
                message_timer =  current_time;
                messages_per_second = 0;
            }

        }

        // loop users to send them the message (OF DOOM)
        var users_in_channel = channels[channel_name].getChannelUsers();
        for(var user_name in users_in_channel)
        {
            if(users_in_channel[user_name].isJoined())
            {
                users_in_channel[user_name].getUser().emit('receive_message', {'channel_name':channel_name, "user_name":user.getName(), "message":message});
            }
        }
    });
    
    // incoming: user_name, message
    socket.on('send_pm', function(data){
        if(user.getSocket() !== socket)
        {
            //console.log('send_pm, wrong socket on user: '+ user.getName());
            return;
        }
        
        if(!s_Security.checker.username(data.user_name))
        {
            return;
        }
        var username =  data.user_name;
        var message =   s_Security.escape.pmMessage(data.message);
        
        var receiver = user_list.getUser(username)
        if(receiver !== false && receiver.isConnected())
        {
            //console.log('sending pm');
            receiver.emit('receive_pm', {'user_name':user.getName(), "message":message});
        } else {
            //console.log('couldn\'t send pm');
            // tell user message sending failed
            user.emit('receive_pm_failed', {"user_name":username, "message":message});
        }
    });

    socket.on('disconnect', function() {
        if(user.getSocket() !== socket)
        {
            //console.log('disconnect, wrong socket on user: '+ user.getName());
            return;
        }
        
        user.unsetSocket();
        
        //console.log('QUITING USER '+ user.getName());
        // remove from his channels
        var channel_users = user.getChannelUsers();
        for(var channel_name in channel_users)
        {   
            var loop_channel = channel_users[channel_name].getChannel(); 
            if(loop_channel.quitUser(user))
            {
                    
                if(loop_channel.getNumberOfJoinedUsers() == 0 && !loop_channel.isRegged())
                {
                    //console.log('non regged channel \'' + loop_channel.getName() + '\'with no users, deleting...')

                    // set public to false first, so that everybody's list will be updated accordingly'
                    loop_channel.setPublic(false);

                    // delete channel from list
                    delete channels[loop_channel.getName()];
                    
                    // unset corresponding channel_user
                    delete channel_users[channel_name];
                }
            }
        }

        // no moar connection
        //users[user.getName()].setConnected(false);
        //users[user.getName()].unsetSocket(false);

        // remove from global users
        //if(!users[user.getName()].isRegged())
        //{
        //    // no need of this user anymore
        //    delete users[user.getName()];
        //}
        
        // no moar connection
        user.setConnected(false);
        user.setChannelListInactive();

        // remove from global users
        if(!user.isRegged())
        {
            // no need of this user anymore
            delete user_list.getUsers()[user.getName()];
        }
        
    });

    // incoming: email, password
    socket.on('register', function(data){
        if(user.getSocket() !== socket)
        {
            //console.log('register, wrong socket on user: '+ user.getName());
            return;
        }
        
        if(!s_Security.checker.email(data.email))
        {
            socket.emit('invalid_field', {field:'email'});
            return;
        }
        var email = data.email;
        if(!s_Security.checker.userPassword(data.password))
        {
            return;
        }
        var password = data.password
        
        s_Functions.register(database, user, password, email, function(success){

            if(success)
            {                
                // post it on all channels
                var channel_users = user.getChannelUsers();
                for(var channel_name in channel_users)
                {
                    //console.log('tell the user hasregister to channel: ' + channel_name)
                    channel_users[channel_name].getChannel().setUserRegged(user);
                }
                
            }

            //tell our user we had success or failed
            user.emit('registered', {"success":success} );
            
                            

        });
    });
    
    //incoming: channel_name
    socket.on('register_channel', function(data){
        if(user.getSocket() !== socket)
        {
            //console.log('register_channel, wrong socket on user: '+ user.getName());
            return;
        }
        
        if(!s_Security.checker.channelName(data.channel_name))
        {
            return;
        }
        var channel_name = data.channel_name;
        
        //console.log('Registering channel');
        
        // check if channel exists
        var channel_users = user.getChannelUsers();
        if(!(channel_name in channel_users) || !channel_users[channel_name].isJoined())
        {
            //console.log('Register channel: ' + channel_name + ' not in channel_users');
            return;
        }
        
        var current_channel = channel_users[channel_name].getChannel();
        
        // check if admin (or root :D )
        if(user.isRoot() || current_channel.getUserStatus(user) == 1)
        {
            current_channel.register(function(success){
                //console.log('register channel callback called');
                if(success)
                {
                    user.emit('notice', {'notice':'register_channel_succeeded','channel_name':current_channel.getName()});
                } else {
                    user.emit('notice', {'notice':'register_channel_failed','channel_name':current_channel.getName()});
                }
            })
        } else {
            //console.log('Register channel: ' + channel_name + '. Not root or admin');
            return;
        }
        
        return true;
        
    });

    //socket.on('login', function(data)
    //{
    //    login_function(data, user, user_channels);
    //});
    
    // incoming: channel_name, user_name, role
    socket.on('set_user_role', function(data){
        if(user.getSocket() !== socket)
        {
            //console.log('set_user_role, wrong socket on user: '+ user.getName());
            return;
        }
        
        if(
            !s_Security.checker.channelName(data.channel_name) || 
            !s_Security.checker.username(data.user_name) || 
            !s_Security.checker.role(data.role)
        )
        {
            return;
        }
        
        var channel_name =  data.channel_name;
        var user_name =     data.user_name;
        var role =          data.role;
        
        // check if channel exists
        var channel_users = user.getChannelUsers();
        if(!(channel_name in channel_users) || !channel_users[channel_name].isJoined())
        {
            return;
        }
        
        var user_in_subject = user_list.getUser(user_name)
        
        // check if user exists
        if(user_in_subject === false)
        {
            return;
        }
        
        var current_channel = channel_users[channel_name].getChannel();
        
        var change_authorized = false;

        if(user.isRoot())
        {
            change_authorized = true;
        }
        
        //var role = parseInt( role );
        
        if(!change_authorized)
        {
            switch(current_channel.getUserStatus(user))
            {
                // Admin
                case 1:
                    switch(role)
                    {
                        case 1:
                        case 2:
                        case 3:
                        case 4:
                            if(role != current_channel.getUserStatus(user_in_subject))
                            {
                                change_authorized = true;
                            }
                        break;
                    }
                break;
                // Moderator
                case 2:
                    switch(role)
                    {
                        case 2:
                        case 3:
                        case 4:
                            if(role != current_channel.getUserStatus(user_in_subject))
                            {
                                change_authorized = true;
                            }
                        break;
                    }
                break;
                // Visitor
                case 3:
                case 4:
                    // can't do stuff as a visitor
                break;
            }
        }
        
        if(change_authorized)
        {
            // Root user protecction
            if(user_in_subject.isRoot() && !user.isRoot())
            {
                user.emit('notice', {"notice":"ninja", "channel_name":channel_name});
                user_in_subject.emit('notice', {"notice":'ninja_caught', "channel_name":channel_name,"user_name":user.getName()});
            } else {
                current_channel.changeUserStatus(user_in_subject, role)
            }
        }
    });
    
    // incoming: channel_name, user_name
    socket.on('kick', function(data){
        if(user.getSocket() !== socket)
        {
            //console.log('kick, wrong socket on user: '+ user.getName());
            return;
        }
                
        if(
            !s_Security.checker.channelName(data.channel_name) || 
            !s_Security.checker.username(data.user_name)
        )
        {
            return;
        }
        
        var channel_name =  data.channel_name;
        var user_name =     data.user_name;

        
        // check channel exists
        var channel_users = user.getChannelUsers();
        if(!(channel_name in channel_users) || !channel_users[channel_name].isJoined())
        {
            return;
        }
        
        var user_in_subject = user_list.getUser(user_name);
        
        // check if user exists
        if(user_in_subject === false)
        {
            return;
        }
        
        var current_channel = channel_users[channel_name].getChannel();
        var role_in_subject = current_channel.getUserStatus(user_in_subject);
        
        // check if user is in channel
        if(role_in_subject === false)
        {
            return;
        }
        
        var change_authorized = false;

        if(user.isRoot())
        {
            change_authorized = true;
        }
        
        if(!change_authorized)
        {
            switch(current_channel.getUserStatus(user))
            {
                // Admin
                case 1:
                    switch(role_in_subject)
                    {
                        case 1:
                        case 2:
                        case 3:
                        case 4:
                            change_authorized = true;
                        break;
                    }
                break;
                // Moderator
                case 2:
                    switch(role_in_subject)
                    {
                        case 2:
                        case 3:
                        case 4:
                            change_authorized = true;
                        break;
                    }
                break;
                // Visitor
                case 3:
                case 4:
                    // can't do stuff as a visitor
                break;
            }
        }
        
        if(change_authorized)
        {
            // Root user protecction
            if(user_in_subject.isRoot() && !user.isRoot())
            {
                user.emit('notice', {"notice":"ninja", "channel_name":channel_name});
                user_in_subject.emit('notice', {"notice":'ninja_caught', "channel_name":channel_name,"user_name":user.getName()});
            } else {
                if(current_channel.removeUser(user_in_subject))
                {
                    //console.log('user ' + user_in_subject.getName() + ' kicked');
                    user_in_subject.emit('channel_leave', {"name":current_channel.getName()});
                    
                    if(current_channel.getNumberOfJoinedUsers() == 0 && !current_channel.isRegged())
                    {
                        //console.log('non regged channel \'' + current_channel.getName() + '\'with no users, deleting...')

                        // set public to false first, so that everybody's list will be updated accordingly'
                        current_channel.setPublic(false);

                        // delete channel from list
                        delete channels[current_channel.getName()];
                    }

                } else {
                    //console.log('ERROR: could not kick user' + user_in_subject.getName());
                }
            }
        }
    });
    
    // incoming: channel_name, user_name
    socket.on('ban', function(data){
        if(user.getSocket() !== socket)
        {
            //console.log('ban, wrong socket on user: '+ user.getName());
            return;
        }
        
        if(
            !s_Security.checker.channelName(data.channel_name) || 
            !s_Security.checker.username(data.user_name)
        )
        {
            return;
        }
        
        var channel_name =  data.channel_name;
        var user_name =     data.user_name;  

        
        //console.log('ban called');
        
        // check channel exists
        var channel_users = user.getChannelUsers();
        if(!(channel_name in channel_users) || !channel_users[channel_name].isJoined())
        {
            return;
        }
        
        var user_in_subject = user_list.getUser(user_name);
        
        // check if user exists
        if(user_in_subject === false)
        {
            return;
        }
        
        var current_channel = channel_users[channel_name].getChannel();
        var role_in_subject = current_channel.getUserStatus(user_in_subject);
        
        // check if user is in channel
        if(role_in_subject === false)
        {
            return;
        }
        
        var change_authorized = false;

        if(user.isRoot())
        {
            change_authorized = true;
        }
        
        if(!change_authorized)
        {
            switch(current_channel.getUserStatus(user))
            {
                // Admin
                case 1:
                    switch(role_in_subject)
                    {
                        case 1:
                        case 2:
                        case 3:
                        case 4:
                            change_authorized = true;
                        break;
                    }
                break;
                // Moderator
                case 2:
                    switch(role_in_subject)
                    {
                        case 2:
                        case 3:
                        case 4:
                            change_authorized = true;
                        break;
                    }
                break;
                // Visitor
                case 3:
                case 4:
                    // can't do stuff as a visitor
                break;
            }
        }
        
        if(change_authorized)
        {
            // Root user protecction
            if(user_in_subject.isRoot() && !user.isRoot())
            {
                user.emit('notice', {"notice":"ninja", "channel_name":channel_name});
                user_in_subject.emit('notice', {"notice":'ninja_caught',"channel_name":channel_name,"user_name":user.getName()});
            } else {
                if(current_channel.ban(user_in_subject))
                {
                    //console.log('user ' + user_in_subject.getName() + ' kicked and banned');                    

                    user_in_subject.emit('channel_leave', {"name":current_channel.getName()});
                    
                                        
                    if(current_channel.getNumberOfJoinedUsers() == 0 && !current_channel.isRegged())
                    {
                        //console.log('non regged channel \'' + current_channel.getName() + '\'with no users, deleting...')

                        // set public to false first, so that everybody's list will be updated accordingly'
                        current_channel.setPublic(false);

                        // delete channel from list
                        delete channels[current_channel.getName()];
                    }

                } else {
                    //console.log('ERROR: could not kick and ban user' + user_in_subject.getName());
                }   
            }
        }
        
    });
    
    // incoming: muted, channel_name, user_name
    socket.on('mute', function(data){
        if(user.getSocket() !== socket)
        {
            //console.log('mute, wrong socket on user: '+ user.getName());
            return;
        }
        //console.log('mute called');
        
        if(
            !s_Security.checker.channelName(data.channel_name) || 
            !s_Security.checker.username(data.user_name)
        )
        {
            return;
        }
        
        var muted =         s_Security.escape.bool(data.muted);
        var channel_name =  data.channel_name;
        var user_name =     data.user_name;
        
        // check channel exists
        var channel_users = user.getChannelUsers();
        if(!(channel_name in channel_users) || !channel_users[channel_name].isJoined())
        {
            return;
        }
        
        var user_in_subject = user_list.getUser(user_name);
        
        // check if user exists
        if(user_in_subject === false)
        {
            return;
        }
        
        var current_channel_user = channel_users[channel_name];
        //console.log('rand: on MUTE:' + current_channel_user.random);
        //if(current_channel_user.isMuted() == mute)
        //{
            // user is already (un)muted
        //    console.log('user ' + user_in_subject.getName() + ' was already (un)muted'); 
        //    return false;
        //}
        
        var current_channel = current_channel_user.getChannel();
        var role_in_subject = current_channel.getUserStatus(user_in_subject);
        
        // check if user is in channel
        if(role_in_subject === false)
        {
            return;
        }
        
        var change_authorized = false;

        if(user.isRoot())
        {
            change_authorized = true;
        }
        
        if(!change_authorized)
        {
            switch(current_channel.getUserStatus(user))
            {
                // Admin
                case 1:
                    switch(role_in_subject)
                    {
                        case 1:
                        case 2:
                        case 3:
                        case 4:
                            change_authorized = true;
                        break;
                    }
                break;
                // Moderator
                case 2:
                    switch(role_in_subject)
                    {
                        case 2:
                        case 3:
                        case 4:
                            change_authorized = true;
                        break;
                    }
                break;
                // Visitor
                case 3:
                case 4:
                    // can't do stuff as a visitor
                break;
            }
        }
        
        if(change_authorized)
        {
            // Root user protection
            if(user_in_subject.isRoot() && !user.isRoot())
            {
                user.emit('notice', {"notice":"ninja", "channel_name":channel_name});
                user_in_subject.emit('notice', {"notice":'ninja_caught',"channel_name":channel_name,"user_name":user.getName()});
            } else {
                if(current_channel.mute(muted, user_in_subject))
                {
                    //console.log('user ' + user_in_subject.getName() + ' (un)muted');                    

                    // we don't have to send it to ourselves, since we already sent it to everybody
                    // user_in_subject.emit('muted', {"name":current_channel.getName()});

                } else {
                    //console.log('ERROR: could not (un)mute user' + user_in_subject.getName());
                }   
            }
        }
    });
    
    // incoming: channel_name, channel_password
    socket.on('set_channel_password', function(data)
    {
        if(user.getSocket() !== socket)
        {
            //console.log('set_channel_password, wrong socket on user: '+ user.getName());
            return;
        }
        
        if(!s_Security.checker.channelName(data.channel_name))
        {
            return;
        }
        if(!s_Security.checker.channelPassword(data.channel_password))
        {
            socket.emit('invalid_field', {field:'channel_password'})
            return;
        }
        
        var channel_name =      data.channel_name;
        var channel_password =  data.channel_password;
        
        //console.log('set password called');
        
        // check channel exists
        var channel_users = user.getChannelUsers();
        if(!(channel_name in channel_users) || !channel_users[channel_name].isJoined())
        {
            //console.log('set password: channel not found :(');
            return;
        }
        
        var current_channel = channel_users[channel_name].getChannel();
        var current_role = channel_users[channel_name].getRole();
        
        var change_authorized = false;

        if(user.isRoot() || current_role == 1)
        {
            change_authorized = true;
        }
        
        if(change_authorized)
        {
            current_channel.setPassword(channel_password);
            return;
        } else {
            //console.log('set password: not authorized :(');
            return;
        }
        
    });
    
    //incoming: channel_name, channel_topic
    socket.on('set_channel_topic', function(data)
    {
        if(user.getSocket() !== socket)
        {
            //console.log('set_channel_topic, wrong socket on user: '+ user.getName());
            return;
        }
        
        if(!s_Security.checker.channelName(data.channel_name))
        {
            return;
        }
        
        
        var channel_name =  data.channel_name;
        var channel_topic = s_Security.escape.channelTopic(data.channel_topic);
        

        //console.log('set_topic called');
        
        // check channel exists
        var channel_users = user.getChannelUsers();
        if(!(channel_name in channel_users) || !channel_users[channel_name].isJoined())
        {
            //console.log('set topic: channel not found :(');
            return;
        }
        
        var current_channel = channel_users[channel_name].getChannel();
        var current_role = channel_users[channel_name].getRole();
        
        var change_authorized = false;

        if(user.isRoot() || current_role == 1)
        {
            change_authorized = true;
        }
        
        if(change_authorized)
        {
            current_channel.setTopic(channel_topic);
            
            // loop users to send them the message (OF DOOM)
            //var users_in_channel = channels[data.channel_name].getChannelUsers();
            var users_in_channel = current_channel.getChannelUsers();
            for(var user_name in users_in_channel)
            {
                if(users_in_channel[user_name].isJoined())
                {
                    users_in_channel[user_name].getUser().emit('topic_set', {'channel_name':channel_name, "channel_topic":channel_topic});
                }
            }
            
        } else {
            //console.log('set_topic: not authorized :(');
        }
        
    });
    
    //incoming: channel_name
    socket.on('set_public', function(data)
    {
        if(user.getSocket() !== socket)
        {
            //console.log('set_public, wrong socket on user: '+ user.getName());
            return;
        }
        
        if(!s_Security.checker.channelName(data.channel_name))
        {
            return;
        }
        
        var channel_name = data.channel_name;

        
        //console.log('set_public called');
        
        // check channel exists
        var channel_users = user.getChannelUsers();
        if(!(channel_name in channel_users) || !channel_users[channel_name].isJoined())
        {
            //console.log('set_public: channel not found :(');
            return;
        }
        
        var current_channel = channel_users[channel_name].getChannel();
        var current_role = channel_users[channel_name].getRole();
        
        var change_authorized = false;

        if(user.isRoot() || current_role == 1)
        {
            change_authorized = true;
        }
        
        if(change_authorized)
        {
            current_channel.setPublic(true);
            
            // loop users to send them the message (OF DOOM)
            var users_in_channel = current_channel.getChannelUsers();
            for(var user_name in users_in_channel)
            {
                if(users_in_channel[user_name].isJoined())
                {
                    users_in_channel[user_name].getUser().emit('public_set', {'channel_name':channel_name});
                }
            }
            
            return;
        } else {
            //console.log('set_topic: not authorized :(');
            return;
        }
    })
    
    //incoming: channel_name
    socket.on('set_private', function(data)
    {
        if(user.getSocket() !== socket)
        {
            //console.log('set_private, wrong socket on user: '+ user.getName());
            return;
        }
        
        if(!s_Security.checker.channelName(data.channel_name))
        {
            return;
        }
        var channel_name = data.channel_name;
        
        //console.log('set_private called');
        
        // check channel exists
        var channel_users = user.getChannelUsers();
        if(!(channel_name in channel_users) || !channel_users[channel_name].isJoined())
        {
            //console.log('set_private: channel not found :(');
            return false;
        }
        
        var current_channel = channel_users[channel_name].getChannel();
        var current_role = channel_users[channel_name].getRole();
        
        var change_authorized = false;

        if(user.isRoot() || current_role == 1)
        {
            change_authorized = true;
        }
        
        if(change_authorized)
        {
            current_channel.setPublic(false);
            
            // loop users to send them the message (OF DOOM)
            var users_in_channel = current_channel.getChannelUsers();
            for(var user_name in users_in_channel)
            {
                if(users_in_channel[user_name].isJoined())
                {
                    users_in_channel[user_name].getUser().emit('private_set', {'channel_name':channel_name});
                }
            }
            
            return true;
        } else {
            //console.log('set_topic: not authorized :(');
            return false;
        }
    });
    
    // GET ALL THE PUBLIC CHANNELS!
    socket.on('get_channel_list', function()
    {
        if(user.getSocket() !== socket)
        {
            //console.log('get_channel_list, wrong socket on user: '+ user.getName());
            return;
        }
        user.setChannelListActive();
        
        // var channel_array = new Array();
        var current_channel = null;
        for(var channel_name in channels)
        {
            current_channel = channels[channel_name];
            if(current_channel.isPublic())
            {
                socket.emit('channel_list_add', {
                    'name':current_channel.getName(),
                    'users_no':current_channel.getNumberOfJoinedUsers(),
                    'topic':current_channel.getTopic(),
                    'has_password':(current_channel.getPassword()==''?false:true)
                });
                //channel_array.push
                //({
                //    'name':current_channel.getName(),
                //    'users_no':current_channel.getNumberOfJoinedUsers(),
                //    'topic':current_channel.getTopic(),
                //    'has_password':(current_channel.getPassword()==''?false:true)
                //});
            }
        }
        //return channel_array;
    });
    
    // incoming: title
    socket.on('get_text', function(data)
    {
        if(user.getSocket() !== socket)
        {
            //console.log('get_text, wrong socket on user: '+ user.getName());
            return;
        }
        
        var title = s_Security.escape.textTitle(data.title)
        
            database.query('Select * from text_pages where title = ? and active = 1', [title], function(error, rows, cols) {
            if (error) {
                console.log('ERROR: ' + error);
                return;
            }
            
            if(rows.length > 0)
            {
                socket.emit('text_found', {'title':title, 'text':rows[0].text} );
            } else {
                // text not found
            }
        });
    });
    
    // incoming: channel_name
    socket.on('get_unban_list', function(data){
        if(user.getSocket() !== socket)
        {
            //console.log('get_unban_list, wrong socket on user: '+ user.getName());
            return;
        }
    
        if(!s_Security.checker.channelName(data.channel_name))
        {
            return;
        }
        var channel_name = data.channel_name;

        // check if channel exists
        var channel_users = user.getChannelUsers();
        if(!(channel_name in channel_users) || !channel_users[channel_name].isJoined())
        {
            //console.log('get_unban_list: channel not found :(');
            return;
        }
        
        var current_channel = channel_users[channel_name].getChannel();
        var current_role = channel_users[channel_name].getRole();
        
        var change_authorized = false;

        if(user.isRoot() || current_role == 1)
        {
            change_authorized = true;
        }
        
        if(change_authorized)
        {
            // var current_channel = channel_users[data.channel_name].getChannel();
            socket.emit('unban_list_found', {'channel_name':channel_name, 'unban_list':current_channel.getBanList()});
        } else {
            //console.log('get_unban_list: not authorized :(');
        }
    });
    
    // incoming: channel_name, ip_bans, user_bans
    socket.on('unban', function(data){
        if(user.getSocket() !== socket)
        {
            //console.log('unban, wrong socket on user: '+ user.getName());
            return;
        }
        
        if(!s_Security.checker.channelName(data.channel_name))
        {
            //console.log('unban, wrong parameter input');
            return
        }
        var channel_name = data.channel_name;
        
        var ip_bans = new Array();
        if(s_Security.checker.ipBans(data.ip_bans))
        {
            ip_bans = data.ip_bans;
        }
        
        var user_bans = new Array();
        if(s_Security.checker.userBans(data.user_bans))
        {
             user_bans = data.user_bans;
        }
        
        if(ip_bans.length == 0 && user_bans.length == 0)
        {
            //console.log('nothing to unban');
            return;
        }
        
        
        // check if channel exists
        var channel_users = user.getChannelUsers();
        if(!(channel_name in channel_users) || !channel_users[channel_name].isJoined())
        {
            //console.log('get_unban_list: channel not found :(');
            return;
        }
        
        var current_channel = channel_users[channel_name].getChannel();
        var current_role = channel_users[channel_name].getRole();
        
        var change_authorized = false;

        if(user.isRoot() || current_role == 1)
        {
            change_authorized = true;
        }
        
        if(change_authorized)
        {
            current_channel.unban(ip_bans, user_bans);
        } else {
            //console.log('unban: not authorized :(');
        }
    });
    
    // root vars and socket functions
    if(user.isRoot)
    {
        //incoming: global, show, channel_name.
        socket.on('show_root_status', function(data)
        {
            if(user.getSocket() !== socket)
            {
                console.log('show_root_status, wrong socket on user: '+ user.getName());
                return;
            }
                        
            var global =        s_Security.escape.bool(data.global);
            var show =          s_Security.escape.bool(data.show);
            
            

            
            var channel_users = user.getChannelUsers();
            var current_channel = null;
            
            if(global)
            {
                user.setShowPersistentRoot(Boolean(show));
                
                // post it on all channels
                for(var loop_channel_name in channel_users)
                {
                    current_channel = channel_users[loop_channel_name].getChannel();
                    if(show)
                    {
                        current_channel.setRootUserStatus(user);
                    } else {
                        current_channel.unsetRootUserStatus(user);
                    }
                }

            } else {
                
                // get the optional channel_name parameter
                if(!s_Security.checker.channelName(data.channel_name))
                {
                    return;
                }
                var channel_name =  data.channel_name;

                if(channel_name in channel_users)
                {
                    current_channel = channel_users[channel_name].getChannel();
                    if(show)
                    {
                        current_channel.setRootUserStatus(user);
                    } else {
                        current_channel.unsetRootUserStatus(user);
                    }
                } else {
                    return;
                }
            }
            
            return;
        });
    }
}

/**
* END EVENT PUSHING CODE
*/

// -- incoming: login, username, password
//start
// -- incoming: name, password
//join_channel
// -- incoming: name 
//leave_channel
// -- incoming: channel_name, message
//send_message
// -- incoming: user_name, message
//send_pm
// --
//disconnect
// -- incoming: email, password
//register
// -- incoming: channel_name
//register_channel
// -- incoming: channel_name, user_name, role
//set_user_role
// -- incoming: channel_name, user_name
//kick
// -- incoming: channel_name, user_name
//ban
// -- incoming: muted, channel_name, user_name
//mute
// -- incoming: channel_name, channel_password
//set_channel_password
// -- incoming: channel_name, channel_topic
//set_channel_topic
// -- incoming: channel_name
//set_public
// -- incoming: channel_name
//set_private
// --
//get_channel_list
// -- incoming: title
//get_text
// -- incoming: channel_name
//get_unban_list
// -- incoming: channel_name, ip_bans, user_bans
//unban
// -- incoming: global, show, channel_name.
//show_root_status

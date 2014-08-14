
//prerequisites
s_Channel_Users = require('./channel_users.class.js');


function s_Channel(database, name, user_list, list_event_callback, callback)
{
    this.database = database;
    this.id = null;
    this.name = name;
    this.channel_users = new Object();    
    this.next_join_is_admin = false;
    this.persistent = false;
    
    this.password = "";
    this.topic = "";
    this.is_public = true;
    
    this.list_event_callback = list_event_callback;
    
    this.ips_banned = new Array();
    this.users_banned = new Object();
    
    this.number_of_joined_users = 0;
    
    // closure scope
    var current_object = this;
    
    //this.randId = Math.floor(Math.random()*10001);
    
    // do a list event callback that we are alive
    this.list_event_callback(this, 'update_public', true);
    
    // get channel from database if exists
    database.query('Select * from channels where name = ? and persistent = 1', [name], function(error, rows, cols){
        if (error) {
                console.log('ERROR: ' + error);
                callback(false);
                return;
        }
        if(rows.length > 0)
        {
            // persist cause it's in the database
            current_object.persistent = true;
            
            current_object.id = rows[0].id;
            current_object.topic = rows[0].topic;
            current_object.is_public = rows[0]['public'];
            
            // get bans for this channel
            database.query('Select ib.*, u.username from ip_bans as ib left outer join users as u on ib.user_id=u.id where ib.channel_id = ?', [current_object.id], function(error, rows_ip_bans, cols) {
                if (error) {
                        console.log('ERROR: ' + error);
                        callback(false);
                        return;
                }
                
                var rows_ip_bans_length = rows_ip_bans.length;
                for(var i = 0; i< rows_ip_bans_length; i++)
                {
                    if(rows_ip_bans[i]["IP"] != '')
                    {
                        current_object.ips_banned.push(rows_ip_bans[i]["IP"]);
                    }
                    
                    if(rows_ip_bans[i]["user_id"] > 0)
                    {
                        var user_name = rows_ip_bans[i]["username"];
                        if(!(user_name in current_object.users_banned))
                        {
                            var ban_user = user_list.retrieveUser(user_name);
                            current_object.users_banned[user_name] = {"user": ban_user, "ips": new Array()};
                        }
                        
                        if(rows_ip_bans[i]["IP"] != '')
                        {
                            current_object.users_banned[user_name]["ips"].push(rows_ip_bans[i]["IP"]);
                        }
                        
                    }
                }
                
                callback(true);
            });
        } else {
            // new channel, no admin so far
            current_object.next_join_is_admin = true;
            
            callback(true);
        }
        
    });
}

s_Channel.prototype.isRegged = function()
{
    if(this.id != null && this.id > 0)
    {
        return true;
    } else {
        return false;
    }
}

s_Channel.prototype.getId = function()
{
    return this.id;
}

s_Channel.prototype.getName = function()
{
    return this.name;
}

s_Channel.prototype.getJoinedUsersNameObjects = function()
{
    // create an object with usename properties and username values?
    var objects = new Array();
    for(var user_name in this.channel_users)
    {
        var current_channel_users = this.channel_users[user_name];
        if(current_channel_users.isJoined())
        {
            var show_role = current_channel_users.getRole();
            var muted = current_channel_users.isMuted();
            if(current_channel_users.getUser().isRoot() && current_channel_users.getUser().isShowPersistentRoot())
            {
                show_role = 0;
            }

            objects.push({"name":user_name, "regged":current_channel_users.getUser().isRegged(), "role":show_role, "muted":muted});
        }
    }
    
    return objects;
}

// I don't want to use this method anymore ='(
//s_Channel.prototype.getUsers = function()
//{
//    var users = new Object();
//    for(var user_name in this.channel_users)
//    {
//        users[user_name] = this.channel_users[user_name].getUser();
//    }
//    
//    return users;
//}

s_Channel.prototype.getChannelUsers = function()
{
    return this.channel_users;
}

s_Channel.prototype.addUser = function(user, user_channels_sql_result_optional, password, callback)
{
    //console.log('addUser');
    //console.log('JOIN CHANNEL'+ this.name);
    //console.log('unique debug id: '+ this.randId)
    //console.log(user_channels_sql_result_optional);
    //console.log('addUser2');
    var add_user_to_channel = function(rows)
    {
        //console.log('ADD_USER_TO_CHANNEL');
        /*
        if(rows.length == 0)
        {
            console.log('add_user_to_channel: no row =\'(');
        } else {
            console.log('add_user_to_channel: '+ rows[0].id);
        }
        */
        var role = 3;

        var has_regged_channel_users = false;
        var channel_users = null;

        // check if we have it our own
        //console.log('weirdassuser named '+ user.getName());
        //console.log('----------');
        //console.log(current_channel.channel_users);
        //console.log('----------');
        if(user.getName() in current_channel.channel_users)
        {
            //console.log('a');
            // found channel_user in memory (thus non-regged)
            //console.log('channel_user_get: '+ 1);
            channel_users = current_channel.channel_users[user.getName()];
            role = channel_users.getRole();
            if(channel_users.isJoined())
            {
                 //console.log('b');
                // user was already joined
                callback("fail");
                return;
            }
        } else {
            //console.log('c');
            if(rows.length > 0)
            {
                //console.log('d');
                // found channel_user in database (thus regged)
                //console.log('channel_user_get: '+ 2);
                // found an hit
                role = rows[0].role;
                channel_users = new s_Channel_Users(current_channel.database, rows[0].id, user, current_channel, role)
                has_regged_channel_users = true;

                // check if banned
                if(role == 5)
                {
                    //console.log('e');
                    // banned!
                    user.emit('notice', {"notice":"banned", "channel_name":current_channel.name});
                    callback("fail");
                    return;
                }
            } else {
                // unknown channel_user, so new channel_user
                //console.log('channel_user_get: '+ 3);
                
                //console.log('f')
                
                if(current_channel.next_join_is_admin)
                {
                    current_channel.next_join_is_admin = false;
                    role = 1;
                }
                channel_users = new s_Channel_Users(current_channel.database, null, user, current_channel, role);
            }   
        }
        
        current_channel.next_join_is_admin = false;

        //console.log('fg');
        if(current_channel.is_banned(user))
        {
            //console.log('g');
            // banned!
            user.emit('notice', {"notice":"banned", "channel_name":current_channel.name});
            callback("fail");
            return;
        }
        
        //if at this point the user has a ban status in his channel_users, it was a non-regged user who got unbanned
        if(role == 5)
        {
            //console.log('h');
            role = 3;
            channel_users.setRole(role);
            //console.log('unsetting ban status on non-regged joining user');
        }

        //if(current_channel.next_join_is_admin)
        //{
        //    current_channel.next_join_is_admin = false;
        //    if(has_regged_channel_users)
        //    {
        //        // wordt waarschijnlijk nooit aangeraakt
        //        current_channel.channel_users[user.getName()].setRole(1);
        //    }
        //    role = 1;
        //}
        //console.log('i');
        var show_root_status = false;
        if(user.isRoot())
        {   
            //console.log('j');
            if(user.isShowPersistentRoot())
            {
                //console.log('h');
                show_root_status = true;
            }
        }

        //console.log('k');
        var show_role = role;
        if(show_root_status)
        {
            show_role = 0;
        }

        //for(var key in current_channel.channel_users)
        //{
        //    role = 3;
        //    break;
        //}    

        //if(user.name in current_channel.channel_users)
        //{
        //    // user already in channel
        //    callback(false)
        //    return;
        //}

        //console.log('sending to others that a new user has joined an existing channel');
        for(var user_name in current_channel.channel_users)
        {
            //console.log('l');
            //if(user.getName() != user_name)
            //{
            var user_channel_users = current_channel.channel_users[user_name];
            if(user_channel_users.isJoined())
            {
                //console.log('m');
                user_channel_users.getUser().emit('user_join', {"channel_name":current_channel.getName(), "user":{"name":user.getName(),"role":show_role,"regged":user.isRegged()}} );
            }
            //}
        }
        
        //console.log('n');
        // set channel_users to active
        channel_users.setActive(true);
        // set channel_users to joined
        channel_users.setJoined(true);

        // add channel_users to the channel
        current_channel.channel_users[user.getName()] = channel_users;

        //add channel_users to the user
        user.addChannelUser(channel_users);
        
        // send to self that we joined this channel
        user.emit('channel_joined', {
            "name":current_channel.getName(),
            "topic":current_channel.topic,
            "users":current_channel.getJoinedUsersNameObjects(),
            'is_public':Boolean(current_channel.is_public)
        });

        // add to number of joined users
        current_channel.number_of_joined_users++;
        
        current_channel.list_event_callback(current_channel, 'user_joined', true);

        //console.log('o');
        callback("success");
        return;
    };
    
    // actual execution part

    // closure scope
    var current_channel = this;
    
    // check if there's a password on this channel
    if(this.password != "" && password == "")
    {
        callback("password_required");
        return;
    }
    // check if user entered correct password
    if(this.password != "" && this.password != password)
    {
        callback("password_invalid");
        return;
    }
    
    // check if the second parameter already gave us user_channels
    if(user_channels_sql_result_optional != null)
    {
        //console.log('1');
        // console.log('user_channels_sql_result_optional found: ' + user_channels_sql_result_optional.name + 'in channel' + this.name);
        
        // send it to the same function, but as an array so the parameters will be the same
        add_user_to_channel([user_channels_sql_result_optional]);
    } else {
        //console.log('2');
        // check if in the database for registered role
        this.database.query('select * from channels_users where user_id = ? and channel_id = ?', [user.getId(), this.id], function(error, rows, cols) {
            if (error) {
                    console.log('ERROR: ' + error);
                    return;
            }
            //console.log('3');
            add_user_to_channel(rows);
        });
    
    }
    
}

s_Channel.prototype.removeUser = function(user)
{
    if(!(user.getName() in this.channel_users) || !this.channel_users[user.getName()].isJoined())
    {
        //console.log(user.name + ' not found in this.users');
        return false;
    }
    
    // emit to our users that a user has left
    for(var user_name in this.channel_users)
    {
        if(user.getName() != user_name)
        {
            var user_channel_users = this.channel_users[user_name];
            if(user_channel_users.isJoined())
            {
                user_channel_users.getUser().emit('user_leave', {'channel_name':this.name, 'user':{"name":user.getName()}});
            }
        }
    }
    
    //set channel_users to inactive, this doesn't happen in quit method..
    this.channel_users[user.getName()].setActive(false);
    this.channel_users[user.getName()].setJoined(false);
    
    
    // add to number of joined users
    this.number_of_joined_users--;
    
    // remove from memory IF regged
    if(user.isRegged() && this.isRegged())
    {
        // always delete, all the time, we will always get it back from the db
        delete this.channel_users[user.getName()];
        // delete from the user
        user.removeChannelUser(this.name);
    }
    
    this.list_event_callback(this, 'user_left', true);
    
    return true;
}

// user leaves server entirely, do some cleanup
s_Channel.prototype.quitUser = function(user)
{
    
    if(!(user.getName() in this.channel_users) || !this.channel_users[user.getName()].isJoined())
    {
        //console.log('unable to quit user, user wasn\'t even here to begin with')
        return false;
    }
    
    // emit to our users that a user has left
    for(var user_name in this.channel_users)
    {
        if(user.getName() != user_name)
        {
            var user_channel_users = this.channel_users[user_name];
            if(user_channel_users.isJoined())
            {
                user_channel_users.getUser().emit('user_leave', {'channel_name':this.name, 'user':{"name":user.getName()}});
            }
        }
    }
    
    // if role = 3, delete the channel_user, since we wouldn't be needing it
    //if(channel_user.getRole() == 3)
    //{

    //}
    
    this.channel_users[user.getName()].setJoined(false);
    
    //difference between this method and removeUser is that removeUser sets the channel_user to inactive in the database
    //delete this.channel_users[user.getName()];
    
    // delete from the user
    //user.removeChannelUser(user.getName());
    
    // add to number of joined users
    this.number_of_joined_users--;
    
    // remove from memory IF regged
    if(user.isRegged() && this.isRegged())
    {
        // always delete, all the time, we will always get it back from the db
        delete this.channel_users[user.getName()];
        // delete from the user
        user.removeChannelUser(this.name);
    }
    
    this.list_event_callback(this, 'user_left', true);
    
    return true;
}

s_Channel.prototype.isLoggedIn = function(username)
{
    if(!(username in this.channel_users) || !this.channel_users[username].isJoined())
    {
        // user not in this channel
        return false;
    }
    
    // emit to our users that a user has logged in
    for(var user_name in this.channel_users)
    {
        var user_channel_users = this.channel_users[user_name];
        if(user_channel_users.isJoined())
        {
            user_channel_users.getUser().emit('logged_in', {'username':username});
        }
        
    }
    
    return true;
    
}

s_Channel.prototype.register = function(callback)
{
    // check this channel wasn't already registered
    if(!this.persistent)
    {
        // closure scope
        var current_channel = this;
        
        this.database.query('insert into channels (name, topic, persistent, date_created) VALUES (?, ?, ?, NOW())', ['name', 'topic', 'persistent', 'date_created'], function(error, result){
            if (error) {
                console.log('ERROR: ' + error);

                // we got an error, we failed :-(
                callback(false);

                return;
            }


            // the resulting id
            current_channel.id = result.id;
            current_channel.persistent = true;
            
            // register current users
            var channel_users = current_channel.getChannelUsers();
            for(var user_name in channel_users)
            {
                // we know the channel is persistent, check if the user is
                if(channel_users[user_name].getUser().isRegged())
                {

                    current_channel.database.query('insert into channels_users (user_id, channel_id, role, active, date_set) VALUES (?, ?, ?, ?, NOW())', [channel_users[user_name].getUser().getId(), current_channel.id, channel_users[user_name].getRole(), 1], 
                    function(error, result){
                        if (error) {
                            console.log('ERROR: ' + error);
                        } else {
                            channel_users[user_name].setId(result.id);
                        }
                        
                    });
                }
            }

            // Success
            callback(true);

        });
    } else {
        // channel was already registered
        callback(false);
    }

}

s_Channel.prototype.changeUserStatus = function(user, role)
{
    if(!(user.getName() in this.channel_users) || !this.channel_users[user.getName()].isJoined())
    {
        //console.log(user.name + ' not found in this.users');
        return false;
    }
    
    // change user status
    this.channel_users[user.getName()].setRole(role);
    
    // emit to our users that a user has changed status
    for(var user_name in this.channel_users)
    {
        var user_channel_users = this.channel_users[user_name];
        if(user_channel_users.isJoined())
        {
            user_channel_users.getUser().emit('user_change_status', {"channel_name":this.getName(), "user_name":user.getName(),"role":role} );
        }
    }
    
    return true;
}

s_Channel.prototype.getUserStatus = function(user)
{
    if(!(user.getName() in this.channel_users) || !this.channel_users[user.getName()].isJoined())
    {
        //console.log(user.name + ' not found in this.users');
        return false;
    }
    
    return this.channel_users[user.getName()].getRole();
}

s_Channel.prototype.setRootUserStatus = function(user)
{
    if(!(user.getName() in this.channel_users)  || !this.channel_users[user.getName()].isJoined() || !user.isRoot())
    {
        //console.log(user.name + ' not found in this.users');
        return false;
    }
    
    this.channel_users[user.getName()].setShowRootStatus(true);
    
    // emit to our users that a root user has set it's root status'
    for(var user_name in this.channel_users)
    {
        var user_channel_users = this.channel_users[user_name];
        if(user_channel_users.isJoined())
        {
            user_channel_users.getUser().emit('user_change_status', {"channel_name":this.getName(), "user_name":user.getName(),"role":0} );
        }
    }
    
    return true;
}


s_Channel.prototype.unsetRootUserStatus = function(user)
{
    console.log('unsetting showrootstatus with role' + this.channel_users[user.getName()].getRole());
    
    if(!(user.getName() in this.channel_users) || !this.channel_users[user.getName()].isJoined()|| !user.isRoot())
    {
        //console.log(user.name + ' not found in this.users');
        return false;
    }
    
    this.channel_users[user.getName()].setShowRootStatus(false);
    
    // emit to our users that a user has unset it's root status
    for(var user_name in this.channel_users)
    {
        var user_channel_users = this.channel_users[user_name];
        if(user_channel_users.isJoined())
        {
            user_channel_users.getUser().emit('user_change_status', {"channel_name":this.getName(), "user_name":user.getName(),"role":this.channel_users[user.getName()].getRole()} );
        }
    }
    
    return true;
}

s_Channel.prototype.setUserRegged = function(user)
{
    if(!(user.getName() in this.channel_users) || !this.channel_users[user.getName()].isJoined())
    {
        return false;
    }
    
    // emit to our users that a user has regged
    for(var user_name in this.channel_users)
    {
        var user_channel_users = this.channel_users[user_name];
        if(user_channel_users.isJoined())
        {
            user_channel_users.getUser().emit('user_regged', {"user_name":user.getName()} );
        }
    }
    
    return true;
}

s_Channel.prototype.ban = function(user_to_ban)
{
    this.changeUserStatus(user_to_ban, 5);
    
    var ip_to_ban = user_to_ban.getIP();
    if(ip_to_ban !== null)
    {
        // add ip to ban list
        this.ips_banned.push(ip_to_ban);
        
        if(this.isRegged())
        {      
            this.database.query('insert into ip_bans (IP, date_added, channel_id, user_id) VALUES (?, NOW(), ?, ?)', [ip_to_ban, {value: "NOW()", escape: false}, this.id, (user_to_ban.isRegged()?user_to_ban.id:0)], function(error, result){
                if (error) {
                    console.log('ERROR: ' + error);
                    // we got an error, we failed :-(
                    return;
                }
            });
        }
    }
    
    if(user_to_ban.isRegged())
    {
        if(typeof this.users_banned[user_to_ban.getName()] == 'undefined')
        {
            // add user to banned users, and their ip
            this.users_banned[user_to_ban.getName()] = {"user": user_to_ban, "ips":[ip_to_ban]};
        } else {
            this.users_banned[user_to_ban.getName()]["ips"].push(ip_to_ban);
        }
    }
    
    // kick user
    if(this.removeUser(user_to_ban))
    {
        // banned!
        user_to_ban.emit('notice', {"notice":"banned", "channel_name":this.name});
        return true;
    } else {
        return false;
    }
}

s_Channel.prototype.is_banned = function(user)
{
    // check in users_banned
    if(user.getName() in this.users_banned)
    {
        return true;
    }
    
    // check in ips_banned
    var ip = user.getIP();
    if(ip !== null)
    {
        if(this.ips_banned.indexOf(ip) != -1)
        {
            return true;
        }
    }
    
    return false;
}

s_Channel.prototype.getBanList = function()
{
    // build ban list
    var ban_list = new Array();
    var ips_listed = new Array();
    for(var user_name in this.users_banned)
    {
        var ban_record = this.users_banned[user_name];
        if(ban_record['ips'].length == 0)
        {
            ban_list.push({'username':ban_record['user'].getName(), 'IP':''});
        } else {
            var ips_length = ban_record['ips'].length;
            for(var i =0; i<ips_length;i++)
            {
                ban_list.push({'username':ban_record['user'].getName(), 'IP':ban_record['ips'][i]});
                if( ips_listed.indexOf(ban_record['ips'][i]) === -1)
                {
                    ips_listed.push(ban_record['ips'][i]);
                }
            }
        }
    }
    
    // loose ips
    var ips_banned_length = this.ips_banned.length;
    for(i=0; i < ips_banned_length; i++)
    {
        var ip_banned = this.ips_banned[i];
        if(ips_listed.indexOf(ip_banned) === -1)
        {
            ban_list.push({'username':'', 'IP':ip_banned});
        }
    }
    
    return ban_list;
    
}

s_Channel.prototype.unban = function(ip_bans, user_bans)
{
    // helper vars
    var ip_index = -1;
    var user_banned = null;
    var username = '';
    var i = 0;
    var user_index = -1;
    ////////////
    
    //console.log('A');
    
    // ga alle ip bans af, en kijk of er users aan vast zitten
    for(var ip_bans_length = ip_bans.length; i< ip_bans_length; i++)
    {
        ip_index = this.ips_banned.indexOf(ip_bans[i]); // Find the index
        if(ip_index == -1)
        {
            // ip not banned...
            continue;
        }
        var ip_found_in_banned_users = false;
        for(username in this.users_banned)
        {
            // check the IPs of the user_banned
            user_banned = this.users_banned[username];
            ip_index = user_banned['ips'].indexOf(ip_bans[i]); // Find the index
            if(ip_index != -1 )
            {
                user_banned['ips'].splice(ip_index, 1); // Remove it if really found!
                
                // no need to remove IP query's if the user get's deleted as well
                user_index = user_bans.indexOf(username); // Find the index
                if(user_index == -1)
                {

                    if(!ip_found_in_banned_users)
                    {
                        // first time IP found
                        this.database.query('update ip_bans set IP = 0 where channel_id = ? and user_id = ?', [this.id, user_banned['user'].id], function(error, result){
                            if (error) {
                                 console.log('QUERY 1: ERROR: ' + error);
                                // we got an error, we failed :-(
                                return;
                            }

                            //console.log('RESULT OF QUERY 1: ', result);
                        });

                    } else {
                        // Ip was already found
                        this.database.query('delete from ip_bans where channel_id = ? and IP = ? and user_id = ?', [this.id, ip_bans[i], user_banned['user'].id], function(error, result){
                            if (error) {
                                 console.log('QUERY 2: ERROR: ' + error);
                                // we got an error, we failed :-(
                                return;
                            }

                            //console.log('RESULT OF QUERY 2: ', result);
                        });
                    }
                
                    ip_found_in_banned_users = true;
                
                }
            }
        }
        
        if(!ip_found_in_banned_users)
        {
            this.ips_banned.splice(ip_index, 1); // Remove it if really found!

            // query to remove every ip record
            this.database.query('Delete from ip_bans where channel_id = ? and IP = ?', [this.id, ip_bans[i]], function(error, result){
                if (error) {
                     console.log('QUERY 3: ERROR: ' + error);
                    // we got an error, we failed :-(
                    return;
                }

                //console.log('RESULT OF QUERY 3: ', result);
            });
        }
    }
    
    //console.log('L');
    
    // nadat we de mogelijke ips uit de users hebben gehaald, kijk of er nog ips over zijn
    var unique_IPs_made_userless = new Array();
    var user_bans_length = user_bans.length;
    for(i = 0; i < user_bans_length; i++)
    {
        //console.log('M');
        if(user_bans[i] in this.users_banned)
        {
            //console.log('N');
            // kijk of de user ook verwijderd moet worden
            user_banned = this.users_banned[user_bans[i]];
            user_index = user_bans.indexOf(user_bans[i]); // Find the index
            if(user_index != -1)
            {
                //console.log('O');
                // user moeten we verwijderen
                if(user_banned['ips'].length == 0)
                {
                    //console.log('P');
                    // query to remove every user record
                    this.database.query('Delete from ip_bans where channel_id = ? and user_id = ?', [this.id, user_banned['user'].id], function(error, result){
                        if (error) {
                             console.log('QUERY 4: ERROR: ' + error);
                            // we got an error, we failed :-(
                            return;
                        }

                        //console.log('RESULT OF QUERY 4: ', result);
                    });
                } else {
                    //console.log('Q');
                    // loop door de IPS
                    for( var j = 0,user_banned_ips_length = user_banned['ips'].length; j < user_banned_ips_length; j++)
                    {
                        //console.log('R');
                        // kijk of het ip al in onze check array staat
                        ip_index = unique_IPs_made_userless.indexOf( user_banned['ips'][j]); // Find the index
                        if(ip_index != -1)
                        {
                            //console.log('S');
                            // verwijder em MICHAEL JACKSON MOVE! (want we hebben er al een record op user_id = 0 geset )
                            this.database.query('Delete from ip_bans where channel_id = ? AND IP = ? AND user_id = ?', [this.id, user_banned['ips'][j], user_banned['user'].id], function(error, result){
                                if (error) {
                                     console.log('QUERY 5: ERROR: ' + error);
                                    // we got an error, we failed :-(
                                    return;
                                }

                                //console.log('RESULT OF QUERY 5: ', result);
                            });
                        } else {
                            //console.log('T');
                            // query: user still has ips, set them to user_id = 0
                            this.database.query('update ip_bans set user_id = 0 where channel_id = ? AND IP = ? AND user_id = ?', [this.id, user_banned['ips'][j], user_banned['user'].id], function(error, result){
                                if (error) {
                                     console.log('QUERY 6: ERROR: ' + error);
                                    // we got an error, we failed :-(
                                    return;
                                }

                                //console.log('RESULT OF QUERY 6: ', result);
                            });

                            // stop em in de check 
                            unique_IPs_made_userless.push(user_banned['ips'][j]);
                        }
                    }

                }
                //console.log('U');

                // Vewijder de user
                delete this.users_banned[user_bans[i]]

                // query: zet rechten terug op 3
                this.database.query('update channels_users set role = 3 where channel_id = ? AND user_id = ?', [this.id, user_banned['user'].id], function(error, result){
                    if (error) {
                         console.log('QUERY 7: ERROR: ' + error);
                        // we got an error, we failed :-(
                        return;
                    }

                    //console.log('RESULT OF QUERY 7: ', result);
                });

            }
        } else {
            //console.log('V');
            // user not banned...
            continue;
        }
    }
}

/*
s_Channel.prototype.unban_oud = function(ip_bans, user_bans)
{
    console.log('--- START OF UNBANNING!');
    
    // remove ip bans
    var ip_bans_length = ip_bans.length;
    console.log('unban: ip_bans_length' + ip_bans_length);
    for(i=0; i< ip_bans_length; i++)
    {
        var ip_index = this.ips_banned.indexOf(ip_bans[i]); // Find the index
        if(ip_index!=-1) this.ips_banned.splice(ip_index, 1); // Remove it if really found!
        console.log('unbanned ip '+ ip_bans[i] + ' on channel '+ this.name);
    }
    
    // remove user bans
    var user_bans_length = user_bans.length;
    var count_ips_from_users_that_are_removed_by_ip = new Object();
    var ban_records_with_ips_to_unban = new Array();
    var ban_record = null;
    var j = 0;
    console.log('unban: user_bans_length' + user_bans_length);
    for(var i =0; i <user_bans_length; i++)
    {
        console.log('unban: user_ban_check on ' + user_bans[i])
        if(user_bans[i] in this.users_banned)
        {
            console.log('found!');
            
            ban_record = this.users_banned[user_bans[i]];
            this.changeUserStatus(ban_record['user'], 3);
            
            var user_ips_bans_length = ban_record['ips'].length;
            if(user_ips_bans_length == 0)
            {
                // user hasn't got any IP bans, delete his last record
                this.database.query()
                .delete()
                .from("ip_bans")
                .where("channel_id = ? AND user_id = ? ", [this.id, ban_record['user'].id])
                .execute(function(error, result){
                    if (error) {
                         console.log('QUERY 1: ERROR: ' + error);
                        // we got an error, we failed :-(
                        return;
                    }
                    
                    console.log('RESULT OF QUERY 1: ', result);
                });
            } else {
                for(j = 0; j < user_ips_bans_length; j++)
                {
                    if(typeof count_ips_from_users_that_are_removed_by_ip[ban_record['ips'][j]] === 'undefined')
                    {
                        count_ips_from_users_that_are_removed_by_ip[ban_record['ips'][j]] = 1;
                    } else {
                        count_ips_from_users_that_are_removed_by_ip[ban_record['ips'][j]]++;
                    }

                    ban_records_with_ips_to_unban.push(ban_record['user']);
                }
            }
            
            delete this.users_banned[user_bans[i]];
            console.log('unbanned username '+ user_bans[i] + ' on channel '+ this.name);
        }
    }
    
    var ban_records_with_ips_to_unban_length = ban_records_with_ips_to_unban.length;
    for(i = 0; i < ban_records_with_ips_to_unban_length; i++)
    {
        console.log('q: ');
        console.log(ban_records_with_ips_to_unban);
        console.log('q2: ' + i);
        ban_record = ban_records_with_ips_to_unban[i];
        console.log('r: ');
        console.log(ban_record);
        var ip_to_check = null;
        for(j = 0; j < ban_record['ips'].length; j++)
        {
            ip_to_check = ban_record['ips'][j];
            // check the number of occurences on an item in string, check if it's more than one
            for(var ip in count_ips_from_users_that_are_removed_by_ip)
            {
                if(ip_to_check == ip)
                {
                    // check if the ip is not already in the ips we're about to unban
                    if(ip_bans.indexOf(ban_record['ips'][j]) != -1)
                    {
                        // The IP is already to be deleted AND user is also? Records needs deletion
                        this.database.query()
                        .delete()
                        .from("ip_bans")
                        .where("channel_id = ? AND user_id = ? and IP = ?", [this.id, ban_record['user'].id, ip_to_check])
                        .execute(function(error, result){
                            if (error) {
                                 console.log('QUERY 2: ERROR: ' + error);
                                // we got an error, we failed :-(
                                return;
                            }
                            
                            console.log('RESULT OF QUERY 2: ', result);
                        });
                    } else {
                        if(count_ips_from_users_that_are_removed_by_ip == 1)
                        {
                            // the ip in the ban record was the only one left in the database, set the user_id to 0
                            this.database.query()
                            .update('ip_bans')
                            .set({"user_id": 0})
                            .where("channel_id = ? AND IP = ? ", [this.id, ip_to_check])
                            .execute(function(error, result){
                                if (error) {
                                     console.log('QUERY 3: ERROR: ' + error);
                                    // we got an error, we failed :-(
                                    return;
                                }
                                
                                console.log('RESULT OF QUERY 3: ', result);
                            });

                        } else if(count_ips_from_users_that_are_removed_by_ip > 1) {
                            // IP has multiple locations, delete ours
                            this.database.query()
                            .delete()
                            .from("ip_bans")
                            .where("channel_id = ? AND user_id = ? and IP = ?", [this.id, ban_record['user'].id, ip_to_check])
                            .execute(function(error, result){
                                if (error) {
                                     console.log('QUERY 4: ERROR: ' + error);
                                    // we got an error, we failed :-(
                                    return;
                                }
                                
                                console.log('RESULT OF QUERY 4: ', result);
                            });
                        }
                    }
                }
            }
        }
    }

    // check which 'i' of IP is found in our banned users
    var ip_iterators_found = new Array();
    // remove ip bans in the user_list
    for(var user_name in this.users_banned)
    {
        ban_record = this.users_banned[user_name];
        for(i=0; i< ip_bans_length; i++)
        {
            ip_index = ban_record['ips'].indexOf(ip_bans[i])
            if(ip_index!=-1) // Remove it if really found!
            {
                ip_iterators_found.push(i);
                
                ban_record['ips'].splice(ip_index, 1); 
                console.log('unbanned ip '+ ip_bans[i] +' from username '+ user_name + ' on channel '+ this.name);
                
                if(ban_record['ips'].length > 0)
                {
                    // the user has other db records: delete corresponding record from db;
                    this.database.query()
                    .delete()
                    .from("ip_bans")
                    .where("channel_id = ? AND user_id = ? and IP = ?", [this.id, ban_record['user'].id, ip_bans[i]])
                    .execute(function(error, result){
                        if (error) {
                             console.log('QUERY 5: ERROR: ' + error);
                            // we got an error, we failed :-(
                            return;
                        }
                        
                        console.log('RESULT OF QUERY 5: ', result);
                    });
                } else {
                    // the user has no other db records, keep record of him, just lose the ip
                    this.database.query()
                    .update('ip_bans')
                    .set({"IP": 0})
                    .where("channel_id = ? AND user_id = ? ", [this.id, ban_record['user'].id])
                    .execute(function(error, result){
                        if (error) {
                             console.log('QUERY 6: ERROR: ' + error);
                            // we got an error, we failed :-(
                            return;
                        }
                        
                        console.log('RESULT OF QUERY 6: ', result);
                    });
                }
            }
            
        }
    }
    
    // remove the ip's that were not found on any user from the db 
    for(i=0; i< ip_bans_length; i++)
    {
        if(ip_iterators_found.indexOf(i) == -1)
        {
            this.database.query()
            .delete()
            .from("ip_bans")
            .where("channel_id = ? AND IP = ? ", [this.id, ip_bans[i]])
            .execute(function(error, result){
                if (error) {
                     console.log('QUERY 7: ERROR: ' + error);
                    // we got an error, we failed :-(
                    return;
                }
                
                console.log('RESULT OF QUERY 7: ', result);
            });
        }
    }
    
    // remove from db
    //var ip_to_ban = user_to_ban.getIP();
    //if(ip_to_ban !== null)
    //{
    //    // add ip to ban list
    //    this.ips_banned.push(ip_to_ban);
    //    
    //    if(this.isRegged())
    //    {      
    //        this.database.query()
    //        .delete()
    //        .from("ip_bans")
    //        .where("channel_id = ? AND ")
    //        .execute(function(error, result){
    //            if (error) {
    //                console.log('ERROR: ' + error);
    //                // we got an error, we failed :-(
    //                return;
    //            }
    //        });
    //    }
    //}
    
            
    // FIX outside of the loops of doom. Reset the roles of the unbanned users
    this.database.query()
    .update([{'cu':'channel_users'}])
    .join(
        {
            'type':'left',
            'table':'ip_bans',
            'alias':'ib',
            'conditions':'ib.channel_id = ' + this.id + ' AND cu.channel_id = ' + this.id + ' cu.user_id=ib.user_id'
        })
    .set({"cu.role": 3})
    .where("ib.user_id is null")
    .execute(function(error, result){
        if (error) {
             console.log('QUERY 8: ERROR: ' + error);
            // we got an error, we failed :-(
            return;
        }

        console.log('RESULT OF QUERY 8: ', result);
    });
    
    
    console.log('--- END OF UNBANNING!');
}
*/

s_Channel.prototype.mute = function(mute, user_to_mute)
{
    mute = Boolean(mute);
    
    // Also check if the user was already (un)muted
    if(!(user_to_mute.getName() in this.channel_users) || 
        !this.channel_users[user_to_mute.getName()].isJoined() || 
        this.channel_users[user_to_mute.getName()].isMuted() == mute)
    {
        //console.log(user_to_mute.name + ' could not be ' + (mute?'':'un') + 'muted');
        return false;
    }
    
    // mute user
    var to_emit = 'muted';
    if(mute)
    {
        //console.log(user_to_mute.getName() + ' ' + to_emit);
        this.channel_users[user_to_mute.getName()].mute();
    } else {
        this.channel_users[user_to_mute.getName()].unmute();
        to_emit = 'unmuted';
        //console.log(user_to_mute.getName() + ' ' + to_emit);
    }
    
    
    // emit to our users that a user has changed status
    for(var user_name in this.channel_users)
    {
        var user_channel_users = this.channel_users[user_name];
        if(user_channel_users.isJoined())
        {
            user_channel_users.getUser().emit(to_emit, {"channel_name":this.getName(), "user_name":user_to_mute.getName()} );
        }
    }
    
    return true;
}

s_Channel.prototype.getPassword = function()
{
    return this.password;
}
s_Channel.prototype.setPassword = function(password)
{
    if(this.password != '' && password == '')
    {
        this.list_event_callback(this, 'update_password', false);
    }
    if(this.password == '' && password != '')
    {
        this.list_event_callback(this, 'update_password', true);
    }
    this.password = password
}

s_Channel.prototype.isPublic = function()
{
    return this.is_public;
}
s_Channel.prototype.setPublic = function(is_public)
{
    is_public = Boolean(is_public);
    var old_public = this.is_public;
    if(this.id != null && this.id > 0)
    {
        // closure scope
        var current_channel = this;
        
        this.database.query('update channels set public = ? where id = ? '[(is_public?'1':'0'), this.id], function(error, result) {
            if (error) {
                console.log('ERROR: ' + error);
                return;
            }
            
            // only sent callback when status actually changed
            if(old_public != is_public)
            {
                current_channel.list_event_callback(current_channel, 'update_public', is_public);
            }
            
            //console.log('publicness successfully updated: ' + is_public);
        });
    } else {
        // only sent callback when status actually changed
        if(old_public != is_public)
        {
            this.list_event_callback(this, 'update_public', is_public);
        }
    }
    this.is_public = is_public;
}

s_Channel.prototype.getTopic = function()
{
    return this.topic;
}
s_Channel.prototype.setTopic = function(topic)
{
    if(this.id != null && this.id > 0)
    {
        //closure scope
        var current_channel = this;
        
        this.database.query('update channels set topic = ? where id = ?', [topic, this.id], function(error, result) {
            if (error) {
                console.log('ERROR: ' + error);
                return;
            }
            
            current_channel.list_event_callback(current_channel, 'update_topic', topic);
            //console.log('topic successfully updated');
        });
    } else {
        this.list_event_callback(this, 'update_topic', topic);
        //console.log('topic successfully updated');
    }
    this.topic = topic;
}

s_Channel.prototype.getNumberOfJoinedUsers = function()
{
    return this.number_of_joined_users;
}

/**
 * Callbacks
 */


module.exports = s_Channel;
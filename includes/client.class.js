/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


function gc_Client()
{
    this.socket_client = null;
    this.user_name = "";
    this.channels = new Object();
    this.pages = new Object();
    this.pms = new Object();
    this.text_pages = new Object();
    this.user_list_loaded = false;
    this.current_channel = null;
    this.current_page = null;
    this.previous_channel = null;
    this.render_interface = new gc_Interface();
    this.is_root = false;
    this.logged_in = false;
    
    this.release_ctrl_callback = function(e)
    {
        if(e.which == 17)
        {
            ctrl_key_pressed = false;
            $(document).unbind('keyup', e);
        }
    }
    
    this.is_context_popup_shown = false; 
    this.is_channel_context_popup_shown = false;
    
    // var to store the ids of the list item that has been clicked
    this.last_user_clicked = null;
    this.last_user_clicked_channel = null;
    
    // here an actual page object will be stored
    this.last_page_clicked_page = null;
    
    this.channel_list_loaded = false;
    
    this.input_history = new Array();
    this.input_history_iterator = null;
    
    this.socket_callbacks_set = false;
}

gc_Client.prototype.joinChannel = function(channel_name, channel_password)
{
    if(typeof channel_password == 'undefined')
    {
        channel_password = '';
    }
    
    // check if exists
    if(channel_name in this.channels)
    {
        // put it as active
        this.switchPage('channel', channel_name);//this.channels[channel_name].getPage());
        return false;
    }
    //var channel = new gc_Channel(this, channel_name);
    //channel.join();
    //this.channels[channel_name] = channel;
    
    this.socket_client.emit("join_channel", {"name": channel_name, "password":channel_password});
    
    return true;
}

gc_Client.prototype.leaveChannel = function(channel_name)
{
    // check if exists
    if(channel_name in this.channels)
    {
        
        this.channels[channel_name].leave();
        // delete this.channels[channel_name];
        return true;
    }
    
    return false;
}

gc_Client.prototype.getChannel = function(name)
{
    // check if exists
    if(name in this.channels)
    {
        return this.channels[name];
    }
    
    return false;
}

gc_Client.prototype.getPage = function(type, name)
{
    // check if exists
    var key = type + '_' + name;
    if( key in this.pages)
    {
        return this.pages[key];
    }
    
    return false;
}

gc_Client.prototype.getPM = function(name)
{
    // check if exists
    if(name in this.pms)
    {
        return this.pms[name];
    }
    
    return false;
}

gc_Client.prototype.getTextPage = function(name)
{
    // check if exists
    if(name in this.text_pages)
    {
        return this.text_pages[name];
    }
    
    return false;
}

gc_Client.prototype.getChannels = function()
{
    return this.channels;
}

gc_Client.prototype.sendPM = function(user_name, message)
{
    // check if exists
    if(!(user_name in this.pms))
    {
        var pm_joined = new gc_PM(this, user_name)

        this.pms[user_name] = pm_joined;
        this.pages['pm_'+user_name] = pm_joined.getPage();

        // Always set current channel
        this.getInterface().addPageToTabs(pm_joined.getPage());
    }
    
    // put it as active
    this.switchPage('pm', user_name);//this.channels[channel_name].getPage());
    
    // if no message is given, only open the tab
    if(message != '')
    {
        this.pms[user_name].sendMessage(message);
    }
}

gc_Client.prototype.leavePM = function(user_name)
{
    // check if exists
    if(user_name in this.pms)
    {
        
        // PM should exist
        var pm = this.getPM(user_name);

        delete this.pms[pm.getUsername()];
        delete this.pages['pm_' + pm.getUsername()];
        pm.getPage().setInactive();

        // Interface
        this.getInterface().removePageFromTabs(pm.getPage());
        this.render_interface.clearPage(pm.getPage());
    
        if(pm.getPage() == this.current_page)
        {
            this.switchPagePrevious();
        }
        
        return true;
    }
    
    return false;
}

gc_Client.prototype.leaveTextPage = function(page_name)
{
    // check if exists
    if(page_name in this.text_pages)
    {
        
        // Text page should exist
        var text_page = this.getTextPage(page_name);

        delete this.text_pages[page_name];
        delete this.pages['text_' + page_name];
        text_page.setInactive();


        // Interface
        this.getInterface().removePageFromTabs(text_page);
        this.render_interface.clearPage(text_page);
    
        if(text_page == this.current_page)
        {
            this.switchPagePrevious();
        }
        
        return true;
    }
    
    return false;
}

gc_Client.prototype.getCurrentPage = function()
{
    return this.current_page;
}

gc_Client.prototype.getUsername = function()
{
    return this.user_name;
}

gc_Client.prototype.initialize = function()
{    
    
    this.socket_client = io.connect('http://192.168.42.74:8000/');
    
    // closure scope
    var current_client = this;
    
    var delete_initial_send_string = true;
    var ctrl_key_pressed = false;
    
    //code that used to be in .html

    // add correct events to the input box
    // add onkeydown event
    $('#input').keydown(function(e) {
        switch(e.which)
        {
            case 13:
                var message = $(this).val();
                $(this).val('');
                current_client.input(message);

                // reset history iterator
                current_client.input_history_iterator = null;

            break;
            case 17:
                ctrl_key_pressed = true;
                $(document).keyup(current_client.release_ctrl_callback);
            break;
            case 38:
                if(ctrl_key_pressed)
                {
                    if(current_client.input_history_iterator === null)
                    {
                        current_client.input_history_iterator = (current_client.input_history.length-1)
                    } else {
                        if(current_client.input_history_iterator > 0)
                        {
                            current_client.input_history_iterator--;
                        }
                    }

                    $('#input').val(current_client.input_history[current_client.input_history_iterator]);

                }
            break;
            case 40:
                if(ctrl_key_pressed)
                {
                    if(current_client.input_history_iterator !== null)
                    {
                        if(current_client.input_history_iterator <= (current_client.input_history.length-1))
                        {
                            current_client.input_history_iterator++;
                            $('#input').val(current_client.input_history[current_client.input_history_iterator]);
                        }
                        if(current_client.input_history_iterator > (current_client.input_history.length-1))
                        {
                            $('#input').val('');
                        }
                    }
                }
            break;
            // Tab
            case 9:
                var current_val = $('#input').val();
                // TODO: replace with actual allowed user name length + maybe regex check, but that might be too slow
                if(current_val.length > 32)
                {
                    //console.log('1');
                    return;
                }
                var current_val_length = current_val.length;
                var names_matched = new Array();
                // check if channel
                if(current_client.getCurrentPage() != null && current_client.getCurrentPage().getType() == 'channel')
                {
                    //console.log('2');
                    var channel = current_client.getCurrentPage().getChannel();
                    var channel_users = channel.getUsers();

                    for(var user_name in channel_users)
                    {
                        //skip ourselves
                        if(user_name == current_client.getUsername())
                        {
                            continue;
                        }

                        //console.log('3');
                        if(channel_users[user_name].name.substr(0, current_val_length) == current_val)
                        {
                            //console.log('4');
                            // check for exact match
                            if(channel_users[user_name].name.length == current_val_length)
                            {
                                //exact match found
                                names_matched = new Array(channel_users[user_name].name);
                                //console.log('5');
                                break;
                            }
                            names_matched.push(channel_users[user_name].name);

                        }
                    }

                    switch(names_matched.length)
                    {
                        case 0:
                        break;
                        case 1:
                            //console.log('6.1');
                            // do the autocomplete
                            $('#input').val(names_matched[0] + ': ');
                        break;
                        default:
                            //console.log('6.2');
                            // check which charachters also compare
                            var charachter_to_match = '';
                            var to_append = '';
                            var i = 0;
                            var names_matched_length = names_matched.length;
                            var one_user_found = true;
                            while(i < 100)
                            {
                                var match = true;
                                for(var j = 0; j < names_matched_length; j++)
                                {
                                    //console.log('6.2.1');
                                    var sub_name = names_matched[j].substr(current_val_length);
                                    if(sub_name.length+i == 0)
                                    {
                                        // found extact match. Still check if there are other users
                                        //console.log('6.2.2');
                                        match = false;
                                        //break 2;
                                    }
                                    if(j == 0)
                                    {   
                                        charachter_to_match = sub_name.charAt(i);
                                        //console.log('6.2.3');
                                    } else {
                                        //console.log('6.2.4');
                                        if(sub_name.charAt(i) != charachter_to_match)
                                        {
                                            // no more match
                                            //console.log('6.2.5');
                                            match = false;
                                            one_user_found = false;
                                            break;
                                        }
                                    }
                                }
                                if(match)
                                {
                                    //console.log('6.2.6');
                                    to_append += charachter_to_match
                                } else {
                                    //console.log('6.2.7');
                                    break;
                                }
                                i++;
                            }

                            if(one_user_found)
                            {
                                $('#input').val(current_val+to_append+': ');
                            } else {
                                // add as notfication in the room field
                                $('#input').val(current_val+to_append);
                                current_client.getInterface().appendSystemMessage(current_client.getCurrentPage(), names_matched.join('<br />'));
                            }



                        break;
                    }
                }

            break;
            default:
                // don't prevent default
                return true;
            break;
        }

        return false;
    });

    // add onfocus event
    $('#input').focus(function () {
        if(delete_initial_send_string){
            $(this).val('');
            delete_initial_send_string = false;
        };		
    });

    // add correctevents to the login input boxxes
    var chatname_empty = false;
    var username_empty = true;
    var password_empty = true;

    var chatname_empty_string = "Chatname:";
    var username_empty_string = "Username:";
    var password_empty_string = "Password:";

    $('.login_field').each(function(index, element){

        switch ($(element).attr('id'))
        {
           case "login_chatname":
               $(element).val("WhoopWhoop" + Math.floor(Math.random()*10001)); 
               $(element).focus();
               $(element).select();
           break;
           case "login_username":
               $(element).css("color","grey");
               $(element).val(username_empty_string);
           break;
           case "login_password":
               element.type = 'text';
               $(element).css("color","grey");
               $(element).val(password_empty_string);
           break;
        }
    });
    // add onfocus event
    $('.login_field').focus(function () {
        switch ($(this).attr('id'))
        {
        case "login_chatname":
            if(chatname_empty)
            {
                $(this).css("color","black");
                $(this).val('');
            }
        break;
        case "login_username":
            if(username_empty)
            {
                $(this).css("color","black");
                $(this).val('');
            }

        break;
        case "login_password":
            if(password_empty)
            {
                this.type = 'password';
                $(this).css("color","black");
                $(this).val('');
            }
        break;
        }
    });

    // add blur event
    $('.login_field').blur(function () {
         switch ($(this).attr('id'))
         {
            case "login_chatname":
                if($(this).val() == '')
                {
                    $(this).css("color","grey");
                    $(this).val(chatname_empty_string);
                    chatname_empty = true;
                } else {
                    chatname_empty = false;
                }
            break;
            case "login_username":
                if($(this).val() == '')
                {
                    $(this).css("color","grey");
                    $(this).val(username_empty_string);
                    username_empty = true;
                } else {
                    username_empty = false;
                }
            break;
            case "login_password":
                if($(this).val() == '')
                {
                    this.type = 'text';
                    $(this).css("color","grey");
                    $(this).val(password_empty_string);
                    password_empty = true;
                } else {
                    password_empty = false
                }
            break;
         }
    });
    ////////////////////////
    
    // set onclick on the popup buttons
    $('#chat_button').click(function()
    {
        if($('#login_chatname').val() != '')
        {
            gc_client.user_name = $('#login_chatname').val();
            function_started({'login':false});
        }
        
    });
    $('#login_button').click(function()
    {
        if($('#login_username').val() != '' && $('#login_password').val() != '')
        {
            gc_client.user_name = $('#login_username').val();
            function_started({'login':true, 'password': $('#login_password').val()});
            $('#login_password').val('');
        }
    });
    $('#channel_password_button_cancel').click(function()
    {
        gc_client.getInterface().hidePopup();
    });
    $('#channel_password_button_go').click(function()
    {
        if(!$('#channel_password_popup_password_set').is(':hidden'))
        {
            // set password on channel
            gc_client.setChannelPassword( $('.channel_password_popup_channel_name').html(), $('#channel_password').val() );
        } else {
            // use password to join channel
            gc_client.joinChannel( $('.channel_password_popup_channel_name').html(), $('#channel_password').val() );
        }

        gc_client.getInterface().hidePopup();
    });
    // unban button
    $('#unban_button').click(function()
    {
        var ip_bans = new Array();
        // get selected stuff
        $('#ip_bans option:selected').each(function(){
            ip_bans.push($(this).val());
            $(this).remove();
        });
        var user_bans = new Array();
        $('#user_bans option:selected').each(function(){
            user_bans.push($(this).val());
            $(this).remove();
        });
        gc_client.unban($('.channel_password_popup_channel_name').html(), ip_bans, user_bans);
    });
    
    $('#ban_close').click(function()
    {
        gc_client.getInterface().hidePopup();
    });
    
    // show channel list tab
    this.getInterface().initialize();
    
    // show popup
    this.getInterface().showPopup('start');
    //this.getInterface().initialize();
    
    var function_started = function(data)
    {
        //console.log('function started called');
        gc_client.getInterface().hidePopup();
        
        //this.user_name = prompt('Welcome to <insertawsumnameforchatservice> Chat!\nEnter a nickname: ');
        if(data.login)
        {
            gc_client.logged_in = true;
            gc_client.socket_client.emit("start", {"login":true, "username": gc_client.user_name, "password":data.password});
        } else {
            gc_client.logged_in = false;
            gc_client.socket_client.emit("start", {"login":false, "username": gc_client.user_name});
        }

        if(!gc_client.socket_callbacks_set)
        {
            gc_client.socket_callbacks_set = true;
            
            gc_client.socket_client.on("nick_taken", function(data)
            {
                //password = prompt('This nickname is already registered.\nEnter password to log in or cancel to enter another nickname: ');
                //gc_client.socket_client.emit('login', {"password":password});
                //this.socket_client.emit("start", {"username": this.user_name});
                alert('This nick is already registered or in use.');
                
                gc_client.getInterface().showPopup('start');
            });
            
            // incoming: field
            gc_client.socket_client.on('invalid_field', function(data){
                switch(data.field)
                {
                    case 'username':
                        alert('Invalid username, remove any special characters (besides \'_\')');
                    break;
                    case 'password':
                        alert('Invalid password, make sure it\'s between 6 and 128 characters long');
                    break;
                    case 'email':
                        alert('Invalid email, make sure it\'s a valid email address');
                    break;
                    case 'channel_password':
                        alert('Invalid channel password, make sure it\'s between 6 and 128 characters long');
                    break;
                    default:
                        alert('Something went wrong with field ' + data.field);
                    break;
                }
            });
        
        
            gc_client.socket_client.on("started", function(data){
                //console.log('started');
                //console.log(data);

                //console.log('socket started called');

                gc_client.is_root = data.is_root;
                
                // catch event when registered logs in somewhere else
                gc_client.socket_client.on('logged_in_elsewhere', function(){
                    
                    alert('Your account just logged in elsewhere');
                    
                    //gc_client.getInterface().showPopup('start');
                });

                // catch user join and user leave events
                gc_client.socket_client.on('user_join', function(data){
                    //console.log(data);
                    //console.log(data.user.name + ' joining on channel: '+ data.channel_name);
                    gc_client.getChannel(data.channel_name).addUser(data.user, true);
                });

                gc_client.socket_client.on('user_leave', function(data){
                    //console.log(data.user.name + ' leaving channel: '+ data.channel_name);
                    gc_client.getChannel(data.channel_name).removeUser(data.user);
                })
                
                var subdomain_found = gc_client.getSubDomainChannelName()
                if(subdomain_found !== null)
                {
                    gc_client.joinChannel(subdomain_found);
                } else {
                    if(!gc_client.logged_in)
                    {
                        gc_client.joinChannel('main');
                    }

                }

                gc_client.socket_client.on("channel_joined", function(data){
                    //console.log('channel_joined');
                    //console.log(data);

                    // Channel should exist
                    //this.channels[channel_name] = channel;
                    //var channel_joined = gc_client.getChannel(data.name);
                    var channel_joined = new gc_Channel(gc_client, data.name, data.topic, data.is_public);
                    gc_client.channels[data.name] = channel_joined;
                    gc_client.pages['channel_'+data.name] = channel_joined.getPage();


                    // Always set current channel
                    gc_client.getInterface().addPageToTabs(channel_joined.getPage());
                    gc_client.switchPage('channel', channel_joined.getName());

                    //Show topic
                    if(data.topic == '')
                    {
                        gc_client.getInterface().appendSystemMessage(channel_joined.getPage(), '(No topic set)');
                    } else {
                        gc_client.getInterface().appendSystemMessage(channel_joined.getPage(), 'Topic: ' + data.topic);
                    }


                    // add self
                    //console.log('onJoin adding self joining channel: '+ channel_joined.getName());
                    // channel_joined.addUser({'name':gc_client.user_name}, false);
                    //console.log(gc_client.user_name);

                    for( var i = 0; i < data.users.length; i++)
                    {
                        //console.log('onJoin adding ' + data.users[key].name  + ' joining channel: '+ channel_joined.getName());
                        channel_joined.addUser(data.users[i], false);
                        //console.log(data.users[key]);
                    }

                });

                gc_client.socket_client.on("channel_leave", function(data){
                    // Channel should exist
                    var channel = gc_client.getChannel(data.name);

                    delete gc_client.channels[channel.getName()];
                    delete gc_client.pages['channel_'+channel.getPage().getName()];
                    channel.getPage().setInactive();

                    // Always set current channel
                    gc_client.getInterface().removePageFromTabs(channel.getPage());
                    gc_client.render_interface.clearPage(channel.getPage());

                    if(channel.getPage() == gc_client.current_page)
                    {
                        gc_client.switchPagePrevious();
                    }

                });

                // incoming: user_name, message
                gc_client.socket_client.on("receive_pm", function(data){
                    var pm_joined = null;
                    if(data.user_name in gc_client.pms)
                    {
                        pm_joined = gc_client.pms[data.user_name];

                    } else {
                        pm_joined = new gc_PM(gc_client, data.user_name)

                        gc_client.pms[data.user_name] = pm_joined;
                        gc_client.pages['pm_'+data.user_name] = pm_joined.getPage();

                        // Always set current channel
                        gc_client.getInterface().addPageToTabs(pm_joined.getPage());
                        gc_client.switchPage('pm', pm_joined.getUsername());
                    }

                    pm_joined.receiveMessage(data.user_name, data.message);
                });

                // incoming: user_name, message
                gc_client.socket_client.on("receive_pm_failed", function(data){
                    var pm_joined = null;
                    if(data.user_name in gc_client.pms)
                    {
                        pm_joined = gc_client.pms[data.user_name];

                    } else {
                        pm_joined = new gc_PM(gc_client, data.user_name)

                        gc_client.pms[data.user_name] = pm_joined;
                        gc_client.pages['pm_'+data.user_name] = pm_joined.getPage();

                        // Always set current channel
                        gc_client.getInterface().addPageToTabs(pm_joined.getPage());
                        gc_client.switchPage('pm', pm_joined.getUsername());
                    }

                    pm_joined.receiveMessageFailed(data.user_name, data.message);
                });

                gc_client.socket_client.on("receive_message", function(data)
                {
                        gc_client.receiveMessage(data.channel_name, data.user_name, data.message );
                });

                gc_client.socket_client.on("registered", function(data)
                {
                    if(data.success)
                    {
                        gc_client.getInterface().appendSystemMessage(gc_client.getCurrentPage(), 'Registration successfull. You can now:');
                        gc_client.getInterface().appendSystemMessage(gc_client.getCurrentPage(), ' - Prevent other people from taking your name');
                        gc_client.getInterface().appendSystemMessage(gc_client.getCurrentPage(), ' - Register channels that are persistent');
                    } else {
                        gc_client.getInterface().appendSystemMessage(gc_client.getCurrentPage(), 'Registration failed. Please try again later.')
                    }
                });

                gc_client.socket_client.on("logged_in", function(data)
                {
                    if(data.username == gc_client.user_name)
                    {
                        // if we log in ourselves, show a message
                        gc_client.getInterface().appendSystemMessage(gc_client.getCurrentPage(), 'Successfully logged in.');
                    }

                    gc_client.getInterface().setStatusLogin(data.username, true);
                });

                // incoming: channel_name, user_name, role
                gc_client.socket_client.on("user_change_status", function(data)
                {
                    var current_channel = gc_client.getChannel(data.channel_name);

                    if(current_channel === false)
                    {
                        return false;
                    }

                    // update role in our objects
                    current_channel.changeUserRole(data.user_name, data.role);
                });

                // incoming: user_name
                gc_client.socket_client.on("user_regged", function(data){
                    gc_client.getInterface().setUserRegged(data.user_name);
                });

                // incoming: channel_name, user_name
                gc_client.socket_client.on("muted", function(data){
                    gc_client.getInterface().mute(data.channel_name, data.user_name);

                    if(data.user_name == gc_client.user_name)
                    {
                        gc_client.getInterface().appendSystemMessage(gc_client.getPage('channel', data.channel_name), 'You have been muted');
                    } else {
                        gc_client.getInterface().appendSystemMessage(gc_client.getPage('channel', data.channel_name), data.user_name + ' has been muted');
                    }
                });

                // incoming: channel_name, user_name
                gc_client.socket_client.on("unmuted", function(data){
                    gc_client.getInterface().unmute(data.channel_name, data.user_name);

                    if(data.user_name == gc_client.user_name)
                    {
                        gc_client.getInterface().appendSystemMessage(gc_client.getPage('channel', data.channel_name), 'You have been unmuted');
                    } else {
                        gc_client.getInterface().appendSystemMessage(gc_client.getPage('channel', data.channel_name), data.user_name + ' has been unmuted');
                    }
                });

                // incoming: channel_name
                gc_client.socket_client.on('password_required', function(data)
                {
                    gc_client.getInterface().showPopup('password_required', data.channel_name);
                });

                // incoming: channel_name
                gc_client.socket_client.on('password_invalid', function(data)
                {
                    gc_client.getInterface().showPopup('password_invalid', data.channel_name);
                });

                // incoming: title, text
                gc_client.socket_client.on('text_found', function(data){
                    var page = new gc_Page('text', data.title, null, this.text );
                    gc_client.text_pages[data.title] = page;
                    gc_client.pages['text_' + data.title] = page;

                    gc_client.getInterface().addPageToTabs(page);
                    gc_client.switchPage('text', data.title);
                    gc_client.getInterface().setTextPageText(data.title, data.text);
                });

                // incoming: name, users_no, topic, has_password
                gc_client.socket_client.on('channel_list_add', function(data) {
                    gc_client.getInterface().addChannelToList(data.name, data.users_no, data.topic, data.has_password);
                });

                // incoming: name
                gc_client.socket_client.on('channel_list_remove', function(data) {
                    gc_client.getInterface().removeChannelFromList(data.name);
                });

                //incoming: notice, user_name (optional), channel_name (optional)
                gc_client.socket_client.on("notice", function(data){
                    switch(data.notice)
                    {
                        default:
                            return;
                        break;
                        case 'ninja':
                            gc_client.getInterface().appendSystemMessage(gc_client.getChannel(data.channel_name).getPage(), 'That user is a ninja');
                        break;
                        case 'ninja_caught':
                            gc_client.getInterface().appendSystemMessage(gc_client.getChannel(data.channel_name).getPage(), 'You have been caught as a ninja by ' + data.user_name);
                        break;
                        case 'banned':
                            gc_client.getInterface().appendSystemMessage(gc_client.getCurrentPage(), 'Can\'t join  ' + data.channel_name + '. You have been banned from this channel');
                        break;
                        case 'message_cap':
                            gc_client.getInterface().appendSystemMessage(gc_client.getCurrentPage(), 'You have been sending too many messages at the same time');
                        break;
                        case 'register_channel_succeeded':
                            gc_client.getInterface().appendSystemMessage(gc_client.getChannel(data.channel_name).getPage(), 'This channel has been succesfully registered');
                        break;
                        case 'register_channel_failed':
                            gc_client.getInterface().appendSystemMessage(gc_client.getChannel(data.channel_name).getPage(), 'Registration of channel failed. If you believe this is in error, please contact admins');
                        break;
                    }
                });

                // incoming: channel_name, statuscode, param
                gc_client.socket_client.on('channel_list_update', function(data){
                   gc_client.getInterface().updateChannelList(data.channel_name, data.statuscode, data.param); 
                });

                // incoming: channel_name, channel_topic
                gc_client.socket_client.on('topic_set', function(data){

                    var current_channel = gc_client.getChannel(data.channel_name);

                    if(current_channel !== false)
                    {
                        current_channel.setTopic(data.channel_topic);
                        if(data.channel_topic == '')
                        {
                            gc_client.getInterface().appendSystemMessage(current_channel.getPage(), 'Channel topic has been unset');
                        } else {
                            gc_client.getInterface().appendSystemMessage(current_channel.getPage(), 'New channel topic set: ' + data.channel_topic);
                        }

                    }
                });

                // incoming: channel_name
                gc_client.socket_client.on('public_set', function(data){

                    var current_channel = gc_client.getChannel(data.channel_name);

                    if(current_channel !== false)
                    {
                        current_channel.setPublic();
                        gc_client.getInterface().appendSystemMessage(current_channel.getPage(), 'Channel set public');

                    }
                });

                // incoming: channel_name
                gc_client.socket_client.on('private_set', function(data){

                    var current_channel = gc_client.getChannel(data.channel_name);

                    if(current_channel !== false)
                    {
                        current_channel.setPrivate();
                        gc_client.getInterface().appendSystemMessage(current_channel.getPage(), 'Channel set private');

                    }
                });
                
                // Incoming: channel_name, unban_list
                gc_client.socket_client.on('unban_list_found', function(data){
                    //console.log('unban!!!||');
                    //console.log(data);
                    //console.log('|| end of unban!!!');
                    gc_client.getInterface().setBanPopupUnbanOptions(data.channel_name, data.unban_list);
                })

                /**
                 * USER CONTEXT MENU //////////////////////////////////////////////////////////////////
                 */
                // set events on contextmenu div
                $('#contextmenu_popup span').mouseover(function(){
                    $(this).css('background-color', '#000098');
                    $(this).css('color', '#FFFFFF');
                });

                $('#contextmenu_popup span').mouseout(function(){
                    $(this).css('background-color', '');
                    $(this).css('color', '');
                });
                $('#contextmenu_popup span').click(function(e){

                    var channel_name = gc_client.last_user_clicked_channel;
                    var user_name = gc_client.last_user_clicked;

                    switch(e.currentTarget.id)
                    {
                        case 'contextmenu_set_admin':
                            gc_client.setUserRole(channel_name, user_name, 1);
                        break;
                        case 'contextmenu_set_moderator':
                            gc_client.setUserRole(channel_name, user_name, 2);
                        break;
                        case 'contextmenu_set_visitor':
                            gc_client.setUserRole(channel_name, user_name, 3);
                        break;
                        case 'contextmenu_kick':
                            gc_client.kick(channel_name, user_name);
                        break;
                        case 'contextmenu_ban':
                            gc_client.ban(channel_name, user_name);
                        break;
                        case 'contextmenu_mute':
                            gc_client.mute(channel_name, user_name);
                        break;
                        case 'contextmenu_unmute':
                            gc_client.unmute(channel_name, user_name);
                        break;
                        case 'contextmenu_pm':
                            gc_client.sendPM(user_name, '');
                        break;
                    }

                    //$('#contextmenu_popup span').css('background-color', '');
                    //$('#contextmenu_popup span').css('color', '');
                    //$('#contextmenu_popup').hide();
                });


                //set bind on user list to show contextmenu div
                $(document).on('contextmenu', '.user_row', function(e)
                {
                    //console.log('click');
                    var id_splitted = e.currentTarget.id.split('_');
                    var channel_name = id_splitted[1];
                    var user_name = id_splitted[2];

                    gc_client.last_user_clicked = user_name;
                    gc_client.last_user_clicked_channel = channel_name;

                    var current_channel = gc_client.channels[channel_name];
                    // currently always has context options
                    var has_context_options = true;

                    // always show pm option
                    $('#contextmenu_pm').show();

                    $('#contextmenu_set_admin').hide();
                    $('#contextmenu_set_moderator').hide();
                    $('#contextmenu_set_visitor').hide();
                    $('#contextmenu_kick').hide();
                    $('#contextmenu_ban').hide();
                    $('#contextmenu_mute').hide();
                    $('#contextmenu_unmute').hide();

                    // check for moderating rights
                    if(gc_client.is_root)
                    {
                        $('#contextmenu_set_admin').show();
                        $('#contextmenu_set_moderator').show();
                        $('#contextmenu_set_visitor').show();
                        $('#contextmenu_kick').show();
                        $('#contextmenu_ban').show();
                        $('#contextmenu_mute').show();
                        $('#contextmenu_unmute').show();

                        //has_context_options = true;
                    } else {
                        // don't show popup on ourselves
                        if(gc_client.user_name == user_name)
                        {
                            //$('#contextmenu_set_admin').hide();
                            //$('#contextmenu_set_moderator').hide();
                            //$('#contextmenu_set_visitor').hide();
                            //$('#contextmenu_kick').hide();
                            //$('#contextmenu_ban').hide();
                            //$('#contextmenu_mute').hide();
                            //$('#contextmenu_unmute').hide();

                            has_context_options = false;
                        } else {
                            if(current_channel.isUserAdmin(gc_client.user_name) || current_channel.isUserModerator(gc_client.user_name) )
                            {
                                // check our user is admin on that channel
                                if(
                                    current_channel.isUserAdmin(gc_client.user_name) &&
                                        (!current_channel.isUserAdmin(user_name))
                                )
                                {
                                    $('#contextmenu_set_admin').show();
                                    has_context_options = true;
                                } else {
                                    //$('#contextmenu_set_admin').hide();
                                }


                                if(
                                    (
                                        (
                                            current_channel.isUserAdmin(gc_client.user_name) ||
                                            current_channel.isUserModerator(gc_client.user_name)
                                        ) &&
                                            current_channel.isUserVisitor(user_name)    
                                    ) || 
                                    (
                                        current_channel.isUserAdmin(gc_client.user_name) &&
                                        current_channel.isUserAdmin(user_name)
                                    )

                                )
                                {
                                    $('#contextmenu_set_moderator').show();
                                    has_context_options = true;
                                } else {
                                    //$('#contextmenu_set_moderator').hide();
                                }

                                // check for visitor rights
                                if(
                                    (
                                        (
                                            current_channel.isUserAdmin(gc_client.user_name) ||
                                            current_channel.isUserModerator(gc_client.user_name)
                                        ) &&
                                            current_channel.isUserModerator(user_name)    
                                    ) || 
                                    (
                                        current_channel.isUserAdmin(gc_client.user_name) &&
                                        current_channel.isUserAdmin(user_name)
                                    )

                                )
                                {
                                    $('#contextmenu_set_visitor').show();
                                    has_context_options = true;
                                } else {
                                    //$('#contextmenu_set_visitor').hide();
                                }

                                // check by DOM if the user is muted
                                var user_is_muted = false;
                                if( gc_client.getInterface().isUserMuted(current_channel.getName(), user_name))
                                {
                                    user_is_muted = true;
                                }
                                // check kick & ban rights
                                if(
                                    (
                                        (   
                                            current_channel.isUserAdmin(gc_client.user_name) ||
                                            current_channel.isUserModerator(gc_client.user_name) 
                                        ) && 
                                        (
                                            current_channel.isUserModerator(user_name) ||
                                            current_channel.isUserVisitor(user_name)
                                        )
                                    ) || 
                                    (
                                        current_channel.isUserAdmin(gc_client.user_name) &&
                                        current_channel.isUserAdmin(user_name)
                                    )       
                                )
                                {
                                    $('#contextmenu_kick').show();
                                    $('#contextmenu_ban').show();
                                    if(user_is_muted)
                                    {
                                        //$('#contextmenu_mute').hide();
                                        $('#contextmenu_unmute').show();
                                    } else {
                                        $('#contextmenu_mute').show();
                                        //$('#contextmenu_unmute').hide();
                                    }

                                    has_context_options = true;
                                } else {
                                    //$('#contextmenu_kick').hide();
                                    //$('#contextmenu_ban').hide();
                                    //$('#contextmenu_mute').hide();
                                    //$('#contextmenu_unmute').hide();
                                }
                            }
                        }
                    }

                    if(has_context_options)
                    {
                        // set position on contextmenu div
                        $('#contextmenu_popup').css('top', e.pageY);
                        $('#contextmenu_popup').css('left', e.pageX);

                        // show it
                        $('#contextmenu_popup').show();

                        // hide channel contextmenu popup
                        if(gc_client.is_channel_context_popup_shown)
                        {
                            $('#contextmenu_channel_popup span').css('background-color', '');
                            $('#contextmenu_channel_popup span').css('color', '');
                            $('#contextmenu_channel_popup').hide();

                            gc_client.is_channel_context_popup_shown = false;
                        }

                        gc_client.is_context_popup_shown  = true;
                    }            

                    //console.log(e);
                    //console.log('pief');
                    return false;
                });

                /**
                 *  //////////////////////////////////////////////////////////////////
                 */

                /**
                 * CHANNEL CONTEXT MENU //////////////////////////////////////////////////////////////////
                 */
                // set events on contextmenu div
                $('#contextmenu_channel_popup span').mouseover(function(){
                    $(this).css('background-color', '#000098');
                    $(this).css('color', '#FFFFFF');
                });

                $('#contextmenu_channel_popup span').mouseout(function(){
                    $(this).css('background-color', '');
                    $(this).css('color', '');
                });
                $('#contextmenu_channel_popup span').click(function(e){

                    var page = gc_client.last_page_clicked_page;

                    // check if the page is still there
                    if(page.isActive())
                    {
                        if(page.getType() == 'channel')
                        {
                            switch(e.currentTarget.id)
                            {
                                case 'contextmenu_channel_leave':
                                    gc_client.leaveChannel(page.getName());
                                break;
                                case 'contextmenu_channel_set_public':
                                    if(page.getChannel().isPublic())
                                    {
                                        gc_client.setChannelPrivate(page.getName());
                                    } else {
                                        gc_client.setChannelPublic(page.getName());
                                    }

                                break;
                                case 'contextmenu_channel_set_password':
                                    gc_client.getInterface().showPopup('password_set', page.getName());
                                break;
                                case 'contextmenu_channel_unban':
                                    gc_client.getInterface().showPopup('ban', page.getName());
                                break;
                            }
                        } else {
                            // pm, text_page
                            if(e.currentTarget.id == 'contextmenu_channel_close')
                            {
                                if(page.getType() == 'pm')
                                {
                                    gc_client.leavePM(page.getName());
                                }
                                if(page.getType() == 'text')
                                {
                                    gc_client.leaveTextPage(page.getName());
                                }

                            }
                        }
                    }

                    //$('#contextmenu_popup span').css('background-color', '');
                    //$('#contextmenu_popup span').css('color', '');
                    //$('#contextmenu_popup').hide();
                });


                //set bind on user list to show contextmenu div
                $(document).on('contextmenu', '.tabs_active, .tabs_idle, .tabs_notify', function(e)
                {
                    var page_name = $(e.currentTarget).html();

                    if(page_name == 'Channel List')
                    {
                        // no context menu
                        return false;
                    } else {
                        var page = null;
                        switch(page_name.charAt(0))
                        {
                            case '#':
                                var channel_name = page_name.substr(1);
                                page = gc_client.getPage('channel', channel_name);
                            break;
                            case '@':
                                var pm_name = page_name.substr(1);
                                page = gc_client.getPage('pm', pm_name);
                            break;
                            default:
                                page = gc_client.getPage('text', page_name);
                            break;
                        }

                        if(page === false)
                        {
                            // page not found, no context menu for you!
                            return false
                        }

                        gc_client.last_page_clicked_page = page;

                        $('#contextmenu_channel_close').hide();
                        $('#contextmenu_channel_leave').hide();
                        $('#contextmenu_channel_set_public').hide();
                        $('#contextmenu_channel_set_password').hide();
                        $('#contextmenu_channel_unban').hide();

                        // check for moderating rights                    
                        if(page.getType() != 'channel')
                        {
                            $('#contextmenu_channel_close').show();
                        } else {
                            $('#contextmenu_channel_leave').show();

                            var current_channel = page.getChannel();
                            if(gc_client.is_root || current_channel.isUserAdmin(gc_client.user_name))
                            {
                                //set public or unpublic text
                                if(current_channel.isPublic())
                                {
                                    $('#contextmenu_channel_set_public').html('Set private');
                                } else {
                                    $('#contextmenu_channel_set_public').html('Set public');
                                }

                                $('#contextmenu_channel_set_public').show();
                                $('#contextmenu_channel_set_password').show();
                                $('#contextmenu_channel_unban').show();
                            }
                        }

                        // set position on contextmenu div
                        $('#contextmenu_channel_popup').css('top', e.pageY);
                        $('#contextmenu_channel_popup').css('left', e.pageX);

                        // show it
                        $('#contextmenu_channel_popup').show();
                        
                        // hide user contextmenu popup
                        if(gc_client.is_context_popup_shown)
                        {
                            $('#contextmenu_popup span').css('background-color', '');
                            $('#contextmenu_popup span').css('color', '');
                            $('#contextmenu_popup').hide();

                            gc_client.is_context_popup_shown = false;
                        }
                        
                        gc_client.is_channel_context_popup_shown  = true;
                    }

                    return false;
                });


                /**
                 *  //////////////////////////////////////////////////////////////////
                 */


                $(document).click(function()
                {
                    if(gc_client.is_context_popup_shown)
                    {
                        $('#contextmenu_popup span').css('background-color', '');
                        $('#contextmenu_popup span').css('color', '');
                        $('#contextmenu_popup').hide();

                        gc_client.is_context_popup_shown = false;
                    }

                    if(gc_client.is_channel_context_popup_shown)
                    {
                        $('#contextmenu_channel_popup span').css('background-color', '');
                        $('#contextmenu_channel_popup span').css('color', '');
                        $('#contextmenu_channel_popup').hide();

                        gc_client.is_channel_context_popup_shown = false;
                    }
                });
            });

            gc_client.socket_client.on("logged_in_failed", function(data)
            {
                //gc_client.getInterface().appendSystemMessage(gc_client.getCurrentPage(), 'Failed to log in.');
                alert('Failed to login in. Please check login credentials.');
                gc_client.getInterface().showPopup('start');
            });
        }
        
    }
}

gc_Client.prototype.receiveMessage = function(channel_name, user, message)
{
    this.getChannel(channel_name).receiveMessage(user, message);
    //this.getCurrentChannel().receiveMessage(user, message);
}
        
gc_Client.prototype.input = function(message)
{
    if(message == "")
    {
        return false;
    }
    
    this.addToInputHistory(message);
    
    // skip /me's
    if(message.substring(0, 1) === "/" && message.substring(0, 4) != '/me ')
    {
        // command
        this.executeCommand(message);
    } else {
        
        if( this.getCurrentPage() != null)
        {
            //switch(this.getCurrentPage().getType())
            //{
               // case 'channel':

                    //if(gc_DOM_loaded)
                    //{
                        //receive own messages
                        //this.receiveMessage(this.getCurrentChannel().getName(), this.user_name, message);
                    //}

                    this.getCurrentPage().getChannel().sendMessage(message); 
                //break;
                //case 'pm':
                //    this.getCurrentPage().getPM().sendMessage(message);
               // break;
            //}
        }
    }
}

gc_Client.prototype.addToInputHistory = function(message)
{
    if(this.input_history.length >= 100)
    {
        this.input_history.shift();
    }
    
    this.input_history.push(message);
}

gc_Client.prototype.executeCommand = function(message)
{
    //command
    var params = message.split(" ");
    var command = params.shift();

    switch(command)
    {
        case '/help':
        {
            this.getInterface().appendSystemMessage(this.getCurrentPage(), 'Welcome to &#60;insertawsumnameforchatservice&#62;');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), 'Listed below are the following command you can use, followed by a description per command:');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '-------------------------------------------------');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '/join &#60;channel name&#62;\t\tJoin a channel by name');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '/leave &#60;channel name&#62;\t\tleave a channel by name');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '/register &#60;password&#62; &#60;email&#62;\t\tRegister your nickname. Once registered, the nickname will be reserved for you. You need to log in with the password to indentify yourself again');
            //this.getInterface().appendSystemMessage(this.getCurrentPage(), '/login &#60;password&#62;\t\tLogin to your username using your previously set password');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '/set_user_role &#60;username&#62; &#60;role&#62;\t\tGive the user a role: 1 for admin, 2 for moderator, 3 for visitor');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '/kick &#60;username&#62;\t\tkick a user from the current channel');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '/ban &#60;username&#62;\t\tban a user from the current channel');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '/mute &#60;username&#62;\t\tmute a user in the current channel');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '/unmute &#60;username&#62;\t\tunmute a muted user in the current channel');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '/register_channel \t\tRegister current channel, can only be done as an admin');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '/set_channel_password &#60;channel_password&#62;\t\tSet the current channel password, can only be done as an admin');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '/set_topic &#60;topic&#62;\t\tSet the current channel topic, can only be done as an admin');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '/set_public \t\tSet the current channel public, so that it can be found in the channel list');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '/set_private \t\tSet the current channel private so that it can\'t be found in the channel list');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '/send_pm &#60;user name&#62; &#60;message&#62;\t\tSend PM to a specific user');
            this.getInterface().appendSystemMessage(this.getCurrentPage(), '-------------------------------------------------');
        }
        break;
        case '/join':
        {
            if(params.length == 1)
            {
                var channel_name = params[0];
                if(channel_name.substring(0, 1) == '#')
                {
                    channel_name = channel_name.substring(1);
                }
                this.joinChannel(channel_name.toLowerCase());
                // moet in de recv
                //this.switchChannel(params[0].toLowerCase());
            } else {
                this.getInterface().appendSystemMessage(this.getCurrentPage(), '/join: Invalid number of parameters');
                this.getInterface().appendSystemMessage(this.getCurrentPage(), 'Type /help for more information');
            }
        }
        break;
        case '/leave':
        {
            if(params.length == 1)
            {
                var channel_name = params[0];
                if(channel_name.substring(0, 1) == '#')
                {
                    channel_name = channel_name.substring(1);
                }
                this.leaveChannel(channel_name.toLowerCase());
                // moet in de recv
                //this.switchChannel(params[0].toLowerCase());
            } else {
                this.getInterface().appendSystemMessage(this.getCurrentPage(), '/leave: Invalid number of parameters');
                this.getInterface().appendSystemMessage(this.getCurrentPage(), 'Type /help for more information');
            }
        }
        break;
        case '/register':
        {
            if(params.length == 2)
            {
                var password = params[0];
                var email = params[1];
                this.register(password, email);
                // moet in de recv
                //this.switchChannel(params[0].toLowerCase());
            } else {
                this.getInterface().appendSystemMessage(this.getCurrentPage(), '/register: Invalid number of parameters');
                this.getInterface().appendSystemMessage(this.getCurrentPage(), 'Type /help for more information');
            }
        }
        break;
        case '/login':
        {
            if(params.length == 1)
            {
                var password = params[0];
                this.login(password);
                // moet in de recv
                //this.switchChannel(params[0].toLowerCase());
            } else {
                this.getInterface().appendSystemMessage(this.getCurrentPage(), '/login: Invalid number of parameters');
                this.getInterface().appendSystemMessage(this.getCurrentPage(), 'Type /help for more information');
            }
        }
        break;
        // root function only
        case '/showrootstatus':
        {
            if(params.length == 2)
            {
                var global = parseInt(params[0]);
                var show = parseInt(params[1]);
                
                this.socket_client.emit('show_root_status', {'global': global, 'show': show});
            }
            if(params.length == 3 )
            {
                var global = parseInt(params[0]);
                if(global == 0)
                {
                    var show = parseInt(params[1]);
                    var channel_name = params[2];
                    
                    this.socket_client.emit('show_root_status', {'global': 0, 'show': show, 'channel_name':channel_name});
                    
                }
                
            }

        }
        break;
        case '/set_user_role':
            if(params.length == 2)
            {
                var username = params[0];
                var role = params[1];
                this.setUserRole(this.getCurrentPage().getName(), username, role);
            } else {
                this.getInterface().appendSystemMessage(this.getCurrentPage(), '/set_user_role: Invalid number of parameters');
                this.getInterface().appendSystemMessage(this.getCurrentPage(), 'Type /help for more information');
            }
            
        break;
        case '/kick':
            if(params.length == 1)
            {
                var username = params[0];
                this.kick(this.getCurrentPage().getName(), username);
            } else {
                this.getInterface().appendSystemMessage(this.getCurrentPage(), '/kick: Invalid number of parameters');
                this.getInterface().appendSystemMessage(this.getCurrentPage(), 'Type /help for more information');
            }
        break;
        case '/ban':
            if(params.length == 1)
            {
                var username = params[0];
                this.ban(this.getCurrentPage().getName(), username);
            } else {
                this.getInterface().appendSystemMessage(this.getCurrentPage(), '/ban: Invalid number of parameters');
                this.getInterface().appendSystemMessage(this.getCurrentPage(), 'Type /help for more information');
            }
        break;
        case '/register_channel':
            if(this.getCurrentPage().getType() == 'channel')
            {
                this.registerChannel(this.getCurrentPage().getChannel().getName());
            }
            
        break;
        case '/mute':
            if(params.length == 1)
            {
                var username = params[0];
                this.mute(this.getCurrentPage().getName(), username);
            } else {
                this.getInterface().appendSystemMessage(this.getCurrentPage(), '/mute: Invalid number of parameters');
                this.getInterface().appendSystemMessage(this.getCurrentPage(), 'Type /help for more information');
            }
        break;
        case '/unmute':
            if(params.length == 1)
            {
                var username = params[0];
                this.unmute(this.getCurrentPage().getName(), username);
            } else {
                this.getInterface().appendSystemMessage(this.getCurrentPage(), '/unmute: Invalid number of parameters');
                this.getInterface().appendSystemMessage(this.getCurrentPage(), 'Type /help for more information');
            }
        break;
        case '/set_channel_password':
            if(params.length == 1)
            {
                var channel_password = params[0];
                this.setChannelPassword(this.getCurrentPage().getName(), channel_password)
            } else {
                this.getInterface().appendSystemMessage(this.getCurrentPage(), '/set_channel_password: Invalid number of parameters');
                this.getInterface().appendSystemMessage(this.getCurrentPage(), 'Type /help for more information');
            }
            
        break;
        case '/set_topic':
            if(params.length >= 1)
            {
                var topic = params.join(' ');
                this.setChannelTopic(this.getCurrentPage().getName(), topic)
            } else {
                this.getInterface().appendSystemMessage(this.getCurrentPage(), '/set_topic: Invalid number of parameters');
                this.getInterface().appendSystemMessage(this.getCurrentPage(), 'Type /help for more information');
            }
        break;
        case '/set_public':
            this.setChannelPublic(this.getCurrentPage().getName());
        break;
        case '/set_private':
            this.setChannelPrivate(this.getCurrentPage().getName());
        break;
        case '/send_pm':
            if(params.length >= 2)
            {
                var user_name = params.shift();
                var pm_message = params.join(' ');
                this.sendPM(user_name, pm_message);
            } else {
                this.getInterface().appendSystemMessage(this.getCurrentPage(), '/set_topic: Invalid number of parameters');
                this.getInterface().appendSystemMessage(this.getCurrentPage(), 'Type /help for more information');
            }
        break;
    }
}

gc_Client.prototype.switchPage = function(page_type, page_name)
{    
    if(this.pageExists(page_type, page_name))
    {
        if(this.current_page == null || page_name != this.current_page.getName())
        {
            this.previous_page = this.current_page;
            this.current_page = this.pages[page_type + '_' + page_name];
            this.render_interface.loadPage(this.current_page);
            this.doPageAction(this.current_page);
            return true;
        }
    }
    
    return false;
}

gc_Client.prototype.pageExists = function(page_type, page_name)
{
    switch(page_type)
    {
        case 'channel':
            // check if exists
            if(page_name in this.channels )
            {
                return true;
            }
        break;
        case 'list':
            // channel list is er altijd?
            return true;
        break;
        case 'text':
            if(page_name in this.text_pages)
            {
                return true;
            }
        break;
        case 'pm':
            if(page_name in this.pms)
            {
                return true;
            }
        break;
    }
    
    return false;
}

gc_Client.prototype.retrieveTextPage = function(title)
{
    gc_client.socket_client.emit("get_text", {"title":title});
}

gc_Client.prototype.switchPagePrevious = function()
{
    if(this.previous_page != null && ( (this.previous_page.getType()+'_'+this.previous_page.getName()) in this.pages) )
    {
        this.current_page = this.previous_page;
        this.previous_page = null;
        this.render_interface.loadPage(this.current_page);
        this.doPageAction(this.current_page);
    } else {
        //just get the last one
        this.previous_page = null;
        //if(this.pages.length > 0)
        //{
        //    // this.pages is een object, geen array...
        //    this.current_page = this.pages[(this.pages.length-1)];
        //    this.render_interface.loadPage(this.current_page);
        //    this.doPageAction(this.current_page);
        //} else {
            this.current_page = null;
            this.render_interface.unloadPage();
        //}
        
    }
}

// actie die een page doet zodra die actief wordt
gc_Client.prototype.doPageAction = function(page)
{
    if(page.getType() == 'list' && !this.channel_list_loaded)
    {
        this.socket_client.emit('get_channel_list');
        this.channel_list_loaded = true;
    }
}

gc_Client.prototype.getSubDomainChannelName = function()
{
    var channel_name = null;
    
    //window.location.host is subdomain.domain.com
    var parts = window.location.host.split('.')
    
    if(parts.length > 2 && parts[parts.length-3].length > 3 && parts[parts.length-3].length < 33) 
    {
        //subdomain available
        channel_name = parts[parts.length-3];
    }
    
    return channel_name;
}

gc_Client.prototype.getInterface = function()
{
    return this.render_interface;
}

gc_Client.prototype.register = function(password, email)
{
    this.socket_client.emit('register', {'password': password, 'email':email});
    //this.getInterface().appendSystemMessage(this.getCurrentChannel(), 'Stub function');
    
}

gc_Client.prototype.login = function(password)
{
    this.socket_client.emit('login', {'password': password});
}

gc_Client.prototype.kick = function(channel_name, user_name)
{
    this.socket_client.emit('kick', {'channel_name':channel_name, "user_name":user_name});
}

gc_Client.prototype.ban = function(channel_name, user_name)
{
    this.socket_client.emit('ban', {'channel_name':channel_name, "user_name":user_name});
}

gc_Client.prototype.mute = function(channel_name, user_name)
{
    this.socket_client.emit('mute', {'muted':true, 'channel_name':channel_name, "user_name":user_name});
}

gc_Client.prototype.unmute = function(channel_name, user_name)
{
    this.socket_client.emit('mute', {'muted':false, 'channel_name':channel_name, "user_name":user_name});
}

gc_Client.prototype.setUserRole = function(channel_name, user_name, role)
{
    //console.log('setting user role '+role+' on '+channel_name+':'+user_name);
    this.socket_client.emit('set_user_role', {'channel_name':channel_name, "user_name":user_name, "role":role});
    //this.getInterface().appendSystemMessage(this.getCurrentChannel(), 'Stub function');
}
gc_Client.prototype.registerChannel = function(channel_name)
{
    //console.log('registering channel: '+ channel_name);
    this.socket_client.emit('register_channel', {'channel_name':channel_name});
    //this.getInterface().appendSystemMessage(this.getCurrentChannel(), 'Stub function');
}
gc_Client.prototype.setChannelPassword = function(channel_name, channel_password)
{
    //console.log('changing the password of a channel');
    this.socket_client.emit('set_channel_password', {'channel_name':channel_name, 'channel_password':channel_password});
}
gc_Client.prototype.setChannelTopic = function(channel_name, channel_topic)
{
    //console.log('changing the topic of a channel');
    this.socket_client.emit('set_channel_topic', {'channel_name':channel_name, 'channel_topic':channel_topic});
}
gc_Client.prototype.setChannelPublic = function(channel_name)
{
    //console.log('Setting the current channel to public');
    this.socket_client.emit('set_public', {'channel_name':channel_name});
}
gc_Client.prototype.setChannelPrivate = function(channel_name)
{
    //console.log('Setting the current channel to private');
    this.socket_client.emit('set_private', {'channel_name':channel_name});
}
// called by the interface
gc_Client.prototype.loadUnbanLists = function(channel_name)
{
    //console.log('retrieving current ban list');
    this.socket_client.emit('get_unban_list', {'channel_name':channel_name});
}
gc_Client.prototype.unban = function(channel_name, ip_bans, user_bans)
{
    this.socket_client.emit('unban', {'channel_name':channel_name, 'ip_bans':ip_bans, 'user_bans':user_bans});
}
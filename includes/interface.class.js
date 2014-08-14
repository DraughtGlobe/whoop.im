/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

function gc_Interface()
{
    //CONSTANTS
    this.default_page_title = 'Whoop.im';
    this.default_page_title_notifying_delay = 1000;
    
    this.channels_loaded = new Object();
    this.pms_loaded = new Object();
    //this.channels_muted = new Object();
    //this.current_room_id = "room";
    //this.current_userlist_id = "user_list";
    
    // channel, list or text
    this.current_page = null;
    
    this.channel_list_page = null;
    this.text_pages_loaded = new Object();
    
    // popups
    this.popup_shown = false;
    this.popup_queue = new Array();
    
    // the type of the popup that is currenly opened
    this.popup_type= '';
    
    // the list of users, we need needs to append and substract users in order
    this.user_list = new Array();
    
    // closure scope
    var current_interface = this;    
    
    // gets set / unset when popup is opened / closed
    this.popup_keypress_function = function(e)
    {
        if(e.which == 13)
        {
            switch(current_interface.popup_type)
            {
                case 'start':
                    if(
                        ( e.currentTarget.id == 'login_chatname' || 
                          e.currentTarget.id == 'chat_button' 
                        ) && $('#login_chatname').val() != ''
                    )
                    {
                        $('#chat_button').trigger('click');
                    }
                    if( 
                        ( e.currentTarget.id == 'login_username' ||
                          e.currentTarget.id == 'login_password' ||
                          e.currentTarget.id == 'login_button'
                        ) && 
                        $('#login_username').val() != '' &&
                        $('#login_password').val() != ''
                    )
                    {
                        $('#login_button').trigger('click');
                    }
                break;
                case 'password_required':
                case 'password_invalid':
                case 'password_set':
                    $('#channel_password_button_go').trigger('click');
                break;
            }
        }
    }
    
    this.select_matched_elements = $('#unban_matching_elements').is(':checked');
    
    // Callback for the multiple select options to set and unset when opening / closing unban popup
    this.unban_ip_selectbox_selected = new Object();
    this.unban_username_selectbox_selected = new Object();
    
    this.ban_popup_list_click_callback = function(e)
    {
        // do this ourselves
        e.preventDefault();
        
        if($(this).parent('[id="ip_bans"]').length == 1)
        {
            current_interface.unban_ip_selectbox_selected[$(this).attr('id')] = !current_interface.unban_ip_selectbox_selected[$(this).attr('id')];
            
            if(current_interface.unban_ip_selectbox_selected[$(this).attr('id')])
            {
                $(this).attr('selected', 'selected');
                if(current_interface.select_matched_elements)
                {
                    //console.log('which is set');
                    //console.log($('#ip_bans option:selected'));
                    $('#ip_bans option:selected').each(function(){
                        //console.log('an iteration');
                        //console.log($(this).data('usernames'))
                        $.each($(this).data('usernames'), function(index, username){
                            //console.log('matched element autoset username: ' + username);
                            $('#user\\:'+username).attr('selected', 'selected');

                            current_interface.unban_username_selectbox_selected['user:'+username] = true;
                        });
                    });
                }
            } else {
                $(this).removeAttr('selected');
            }
        }
        
        if($(this).parent('[id="user_bans"]').length == 1)
        {
            current_interface.unban_username_selectbox_selected[$(this).attr('id')] = !current_interface.unban_username_selectbox_selected[$(this).attr('id')];
            
            if(current_interface.unban_username_selectbox_selected[$(this).attr('id')])
            {
                $(this).attr('selected', 'selected');
                
                if(current_interface.select_matched_elements)
                {
                    $('#user_bans option:selected').each(function(){
                        //console.log('another iteration');
                        //console.log($(this).data('ips'));
                        $.each($(this).data('ips'), function(index, ip){
                            //console.log('matched element autoset ip: ' + ip);
                            $('#ip\\:'+ip.replace(/\./g, "\\.")).attr('selected', 'selected');

                            current_interface.unban_ip_selectbox_selected['ip:'+ip] = true;
                        });
                    });
                }
            } else {
                $(this).removeAttr('selected');
            }
        }
    }
    
    this.page_title_notifying_pages = new Array();
    this.page_title_notifying_iterator = 0;
    this.page_title_notifying_current_timeout = 0;
    this.page_title_notifying_active = false;
    this.page_title_notifying_function_react = function ()
    {
        current_interface.page_title_notifying_pages = $.grep(current_interface.page_title_notifying_pages, function(value) {
            return value != current_interface.current_page;
        });
        $('li#tab_' + current_interface.current_page.getType() + '_' + current_interface.current_page.getName()).attr('class', 'tabs_active');
        current_interface.resetPageTitleNotifying();
    }
    
    this.page_title_notifying_function = function()
    {
        if(current_interface.page_title_notifying_iterator < current_interface.page_title_notifying_pages.length)
        {
            var page = current_interface.page_title_notifying_pages[current_interface.page_title_notifying_iterator]
        
            if(page.getType() == 'channel')
            {
                $(document).attr("title",'## ' + page.getName() + ' ##');
            } else if(page.getType() == 'pm')
            {
                $(document).attr("title",'@' + page.getName());
            }else {
                // skip this page
                current_interface.page_title_notifying_iterator++;
                current_interface.page_title_notifying_function();
                return;
            }
            current_interface.page_title_notifying_iterator++;
            current_interface.page_title_notifying_current_timeout = setTimeout(current_interface.page_title_notifying_function, current_interface.default_page_title_notifying_delay);
        } else {
            $(document).attr("title", current_interface.default_page_title);
            current_interface.page_title_notifying_iterator = 0;
            current_interface.page_title_notifying_current_timeout = setTimeout(current_interface.page_title_notifying_function, current_interface.default_page_title_notifying_delay);
            return;
        }
    };
}

gc_Interface.prototype.initialize = function()
{
    //closure scope
    var current_object = this;
    // get's called early, so do it once the DOM has been loaded (TODO: gc_Page aanmaken in de client?)
    $(document).ready(function() {
        // Channel List aanmaken
        current_object.channel_list_page = new gc_Page('list', 'channel_list');
        gc_client.pages['list_channel_list'] = current_object.channel_list_page;
        current_object.addPageToTabs(current_object.channel_list_page);
        
        // onclick op de Channel list channel
        $('.channel_list_channel').live('click', function(el){
            //console.log('clicked on channel list channel');
            var channel_id = $(el.currentTarget).attr('id').substr(21);
            //console.log('channel_id: ' + channel_id);
            gc_client.joinChannel(channel_id, '');
            
        });
        
        // unban matching elements checkbox 
        $('#unban_matching_elements').click(function()
        {
            current_object.select_matched_elements = $(this).is(':checked');
        });
    });
}

gc_Interface.prototype.loadPage = function(page)
{
    var old_page = this.current_page;
    this.current_page = page;
    
    this.page_title_notifying_pages = $.grep(this.page_title_notifying_pages, function(value) {
        return value != page;
    });
    this.resetPageTitleNotifying();
    
    // set tab active
    $('li.tabs_active').attr('class', 'tabs_idle');
    $('li#tab_' + page.getType() + '_' + page.getName()).attr('class', 'tabs_active');

    // show new page
    switch(page.getType())
    {
        case 'channel':
            
            //var old_room_id = this.current_room_id;
            //var old_userlist_id = this.current_userlist_id;

            //this.current_room_id =     "room_"+page.getName();
            //this.current_userlist_id = "user_list_"+page.getName();

            if(!(page.getName() in this.channels_loaded))
            {
                //render
                $('#room').clone().attr('id', 'room_'+page.getName()).appendTo($('#main'));
                
                $('#user_list').clone().attr('id', "user_list_"+page.getName()).appendTo($('#main'));

                this.channels_loaded[page.getName()] = true;
            //this.channels_muted[channel.getName()] = false;
            }
            $('#user_list_'+page.getName()).show();
            $('#room_'+page.getName()).show();
            break;
        case 'pm':
            if(!(page.getName() in this.pms_loaded))
            {
                //render
                $('#pm').clone().attr('id', 'pm_'+page.getName()).appendTo($('#main'));

                this.pms_loaded[page.getName()] = true;
            }
            $('#pm_'+page.getName()).show();
        break;
        case 'list':
            $('#channel_list').show();
            break;
        case 'text':
            if(!(page.getName() in this.text_pages_loaded))
            {
                //render
                $('#text_page').clone().attr('id', 'text_page_'+page.getName()).appendTo($('#main'));
                this.text_pages_loaded[page.getName()] = true;
            }
            $('#text_page_'+page.getName()).show();
            break;
    }
    
    if(old_page == null)
    {
        $('#room').hide();
        $('#user_list').hide();
    } else  {
        // hide old page
        switch(old_page.getType())
        {
            case 'channel':
                $('#room_'+old_page.getName()).hide();
                $('#user_list_'+old_page.getName()).hide();
            case 'pm':
                $('#pm_'+old_page.getName()).hide();
                break;
            case 'list':
                $('#channel_list').hide();
                break;
            case 'text':
                $('#text_page_'+old_page.getName()).hide();
                break;
        }
    }
 
    
    
}

gc_Interface.prototype.clearPage = function(page)
{
    // TODO: This function should delete the page form the DOM instead of clearing them
    this.page_title_notifying_pages = $.grep(this.page_title_notifying_pages, function(value) {
        return value != page;
    });
    this.resetPageTitleNotifying();
    
    if(page != null)
    {
        switch(page.getType())
        {
            case 'channel':
                $('#room_'+page.getName() + ' ul').html('');
                $('#user_list_'+page.getName()).html('');
                break;
            case 'pm':
                $('#pm_'+page.getName() + ' ul').html('');
            break;
            case 'list':
                $('#channel_list').html('');
                break;
            case 'text_page':
                $('#text_page_'+page.getName()).html('');
                break;
        }
        
    }
}

// shows an empty channel page
gc_Interface.prototype.unloadPage = function()
{
    this.current_page = null;
    
    //this.switchPage('channel');
    
    //hide other stuff
    $('.text_page').hide();
    $('#channel_list').hide();
    $('.pm').hide();
    
    // switch
    $('#room').show();
    $('#user_list').show();
}

gc_Interface.prototype.addPageToTabs = function(page)
{
    if(page == null)
    {
        this.showError("Error:\n Trying to add non-existent tab");
        return;
    }
    
    var page_name = '';
    switch(page.getType())
    {
        case 'list':
            page_name = 'Channel List';
        break;
        case 'channel':
            page_name = '#' + page.getName();
        break;
        case 'pm':
            page_name = '@' + page.getName();
        break;
        default:
            page_name = page.getName();
        break;
    }
    
    $('#tabs_rooms ul').append("<li id='tab_" + page.getType() + '_' + page.getName() + "' class='tabs_idle'>" + page_name + "</li>");
    
    $('#tab_' + page.getType() + '_' + page.getName()).click(function(e)
    {
        gc_client.switchPage(page.getType(), page.getName());
    });
}

gc_Interface.prototype.setTextPageText = function(title, text)
{
    $('#text_page_'+title).html(text);
}


gc_Interface.prototype.removePageFromTabs = function(page)
{
    if(page == null)
    {
        this.showError("Error:\n Trying to delete non-existent tab");
        return;
    }
    
    $('li#tab_'+page.getType() + '_' + page.getName()).remove();
}

gc_Interface.prototype.addChannelToList = function(name, users_no, topic, has_password)
{
    var has_password_txt = this.getHasPasswordStatus(has_password);
    $('#channel_list_table').append('<tr id="channel_list_channel_' + name + '" class="channel_list_channel"><td class="clc_has_password">' + has_password_txt + '</td><td class="clc_name">' + name + '</td><td class="clc_users_no">' + parseInt(users_no) + '</td><td class="clc_topic">' + topic + '</td></tr>');
}

gc_Interface.prototype.removeChannelFromList = function(name)
{
    $('#channel_list_channel_' + name).remove();
}

gc_Interface.prototype.updateChannelList = function(channel_name, status_code, param)
{
    switch(status_code)
    {
        case 'update_topic':
            $('#channel_list_channel_' + channel_name + ' .clc_topic').html(param)
        break;
        case 'user_joined':
            $('#channel_list_channel_' + channel_name + ' .clc_users_no').html(parseInt($('#channel_list_channel_' + channel_name + ' .clc_users_no').html())+1);
        break;
        case 'user_left':
            $('#channel_list_channel_' + channel_name + ' .clc_users_no').html(parseInt($('#channel_list_channel_' + channel_name + ' .clc_users_no').html())-1);
        break;
        case 'update_password':
            $('#channel_list_channel_' + channel_name + ' .clc_has_password').html(this.getHasPasswordStatus(param));
        break;
    }
}

gc_Interface.prototype.addUserToList = function(channel, user, index_to_add)
{
    //console.log('addUserToList: channel: '+ channel.name+'|'+channel.role + ' user.name: '+ user.name + 'index_to_add: '+ index_to_add);
    if(channel == null)
    {
        this.showError("Error:\n Trying to add user to no room");
        return;
    }
    
    //var debug_channel_name = '#user_list_' + channel.getName();
    //var debug_li_name = "user_" + channel.getName() + "_"+user.name+"";
    
    // show or hide login status
    var regged_visibility_style = "visibility:hidden";
    if(user.regged)
    {
        regged_visibility_style = "visibility:visible";
    }
    
    // show or hide muted status
    var muted_visibility_style = "visibility:hidden";
    if(user.muted)
    {
        muted_visibility_style = "visibility:visible";
        
    // if self, diable input field
    //if(gc_client.getUsername() == user.name)
    //{
    //    this.channels_muted[channel.getName()] = true;
    //    
    //   if(this.current_room_id == 'room_'+channel.getName())
    //    {
    //        $('#input').attr('disabled', true);
    //    }  
    //}
        
    }
    
    // show our own name bold
    var list_user_class = 'list_username';
    if(user.name == gc_client.user_name)
    {
        list_user_class = 'list_username_self';
    }
    
    // check if we need a user role title
    var role_title = this.getRoleStatusTitle(user.role)
    var title_html = '';
    if(role_title != '')
    {
        title_html = " title='"+role_title+"'";
    }
    
    var html = "<li id='user_" + channel.getName() + "_"+user.name+"' class='user_row'><div class='" + list_user_class + "'>" + user.name + "</div><div class='status_mini'><img class='user_regged_" + user.name + " list_user_modifier_mini' style='" + regged_visibility_style + "' alt='Rg' title='Registered' src='img/accept.png'></img><img id='channel_" + channel.getName() + "_user_muted_" + user.name + "' style='" + muted_visibility_style + "' class='list_user_modifier_mini' alt='Mu' title='Muted' src='img/sound_mute.png'></img></div><div id='channel_" + channel.getName() + "_user_status_" + user.name + "' class='list_user_modifier'"+title_html+">" + this.getRoleStatus(user.role) + "</div></li>";
    if(index_to_add == -1)
    {
        $('#user_list_' + channel.getName()).append(html);
    } else {
        var list_item = $('#user_list_'+ channel.getName() +' li:nth-child(' + index_to_add + ')');
        if(list_item.length == 0)
        {
            $('#user_list_'+ channel.getName()).prepend(html);
        } else {
            list_item.after(html);
        }
        
    }
   
}

gc_Interface.prototype.removeUserFromList = function(channel, user)
{
    if(channel == null)
    {
        this.showError("Error:\n Trying to remove user from no room");
        return;
    }
    
    $('#user_' + channel.getName() + '_' + user.name).remove();
}

gc_Interface.prototype.getIndexOfUserInList = function(channel_name, user_name)
{
    //console.log('getIndexOfUserInList: param: channel: '+ channel_name + 'user: '+ user_name);
    return $('#user_list_'+channel_name+' .user_row').index($('#user_'+channel_name+'_'+user_name)[0]);
}

gc_Interface.prototype.appendUserMessage = function(channel, user, message)
{
    if(channel == null)
    {
        this.showError("Error:\n Trying to append message to no room");
        return;
    }
    
    $('#room_' + channel.getName() + ' ul').append("<li class='user_message'><b>"+user+":</b><span>"+message+"</span><div class='clear'></div></li>");

    this.scrollDown();
}

gc_Interface.prototype.appendMeMessage = function(channel, user, message)
{
    if(channel == null)
    {
        this.showError("Error:\n Trying to append message to no room");
        return;
    }
    
    $('#room_' + channel.getName() + ' ul').append("<li class='user_message'><b class='memessage'>"+user+" " + message + "</b><div class='clear'></li>");

    this.scrollDown();
}

gc_Interface.prototype.appendPMMessage = function(pm, user, message)
{
    if(pm == null)
    {
        this.showError("Error:\n Trying to append pm to no room");
        return;
    }
    
    $('#pm_' + pm.getUsername() + ' ul').append("<li class='user_message'><b>"+user+":</b><span>"+message+"</span><div class='clear'></div></li>");

    this.scrollDown();
}

gc_Interface.prototype.appendPMMeMessage = function(pm, user, message)
{
    if(pm == null)
    {
        this.showError("Error:\n Trying to append message to no room");
        return;
    }
    
    $('#pm_' + pm.getUsername() + ' ul').append("<li class='user_message'><b class='memessage'>"+user+" " + message + "</b><div class='clear'></li>");

    this.scrollDown();
}

gc_Interface.prototype.appendSystemMessage = function(page, message)
{
    
    var room_name = "#room";
    if(page != null)
    {
        switch(page.getType())
    {
            case 'channel':
                room_name = '#room_' + page.getName();
            break;
            case 'pm':
                room_name = '#pm_' + page.getName();
            break;
            default:
        //console.log('Trying to append system message to non-channel page')
                return;
            break;
    }
    }

    
    
    if($(room_name + ' ul li:last-child').is(".system_message"))
    {
        $(room_name + ' ul li:last-child').append("<br/>"+message);
    } else {
        $(room_name + ' ul').append("<li class='system_message'>" + message + "</li>");
    }
    
    this.scrollDown();
}

gc_Interface.prototype.setStatusLogin = function(username)
{
    // check in which channels this user can be found
    var channels = gc_client.getChannels();
    var users = null;
    var channels_found = new Array;
    for(var channel_name in channels)
    {
        users = channels[channel_name].getUsers();
        for(var user_name in users)
        {
            if(user_name == username)
            {
                channels_found.push(channel_name);
                break;
            }
        }
    }
    
    // loop trough our found users 
    for( var i = 0; i < channels_found.length; i++)
    {
        $('li#user_' + channels_found[i] + '_'+ username).append("");
    }
    
}

gc_Interface.prototype.setUserRole = function(channel_name, user_name, role, index_to_remove, index_to_add)
{
    //console.log('setUserRole: param: channel: '+ channel_name + 'user: '+ user_name+ 'role: '+ role+ 'index_to_remove: '+ index_to_remove+ 'index_to_add: '+ index_to_add);
    //var user_record = $('#channel_' + channel_name + '_user_status_' + user_name).html(this.getRoleStatus(role)).attr('title', this.getRoleStatusTitle(role));
    var user_record = $('#user_' +channel_name + '_' + user_name);
    user_record.find('#channel_' + channel_name + '_user_status_' + user_name).html(this.getRoleStatus(role));
    
    // check if we need a user role title
    var role_title = this.getRoleStatusTitle(role)
    if(role_title != '')
    {
        user_record.find('#channel_' + channel_name + '_user_status_' + user_name).attr('title', this.getRoleStatusTitle(role));
    }
    
    user_record.remove();
    
    if(index_to_add == -1)
    {
        $('#user_list_' + channel_name).append(user_record);
    } else {
        
        var list_item = $('#user_list_'+ channel_name +' li:nth-child(' + index_to_add + ')');
        if(list_item.length == 0)
        {
            $('#user_list_'+ channel_name).prepend(user_record);
        } else {
            list_item.after(user_record);
        }
    }
        
}

gc_Interface.prototype.setUserRegged = function(user_name)
{
    $('.user_regged_' + user_name).css('visibility', 'visible');
}

gc_Interface.prototype.mute = function(channel_name, user_name)
{
    $('#channel_' + channel_name + '_user_muted_' + user_name).css('visibility','visible');
    
// if self, disable input field
//if(gc_client.getUsername() == user_name)
//{
//    this.channels_muted[channel_name] = true;
//
//    if(this.current_room_id == 'room_'+channel_name)
//    {
//        $('#input').attr('disabled', true);
//    }
//}
}

gc_Interface.prototype.unmute = function(channel_name, user_name)
{
    $('#channel_' + channel_name + '_user_muted_' + user_name).css('visibility','hidden');
    
// if self, disable input field
//if(gc_client.getUsername() == user_name)
//{
//    this.channels_muted[channel_name] = false;
//
//    if(this.current_room_id == 'room_'+channel_name)
//    {
//        $('#input').removeAttr('disabled');
//    }
//}
}

// momenteel weet alleen de DOM of de user in een channel ge-mute is Oo
gc_Interface.prototype.isUserMuted = function(channel_name, user_name)
{
    return $('#channel_' + channel_name + '_user_muted_' + user_name).css('visibility') == 'visible';
}

gc_Interface.prototype.showPopup = function(popup_type, channel_name)
{   
    //console.log('queueing popup: '+ popup_type + ' channel_name: '+ channel_name);
    
    this.popup_queue.push({'popup_type':popup_type,'channel_name':channel_name});
    
    this.showNextPopup();
}

// private function: Displays the next popup in the queue when possible
gc_Interface.prototype.showNextPopup = function()
{
    if(this.popup_shown)
    {
       // another popup already showing
       return;
    }
    
    if(this.popup_queue.length == 0)
    {
        // no more popups
        return;
    }
    
    var popup_object = this.popup_queue.shift();
    this.popup_type = popup_object.popup_type;
    var channel_name = popup_object.channel_name;
    
    this.popup_shown = true;
    
    $('#popup_base').show();
    
    $('.login_field').keypress(this.popup_keypress_function);
    
    switch(this.popup_type)
    {
        case 'start':
            $('#login_popup').show();
            $('#channel_password_popup').hide();
            $('#ban_popup').hide();
            break;
        case 'password_required':
            $('.channel_password_popup_channel_name').html(channel_name);
            $('#login_popup').hide();
            $('#ban_popup').hide();
            $('#channel_password_popup').show();
            $('#channel_password_popup_password_required').show();
            $('#channel_password_popup_password_invalid').hide();
            $('#channel_password_popup_password_set').hide();
            $('#channel_password').focus();
        break;
        case 'password_invalid':
            $('.channel_password_popup_channel_name').html(channel_name);
            $('#login_popup').hide();
            $('#ban_popup').hide();
            $('#channel_password_popup').show();
            $('#channel_password_popup_password_required').hide();
            $('#channel_password_popup_password_invalid').show();
            $('#channel_password_popup_password_set').hide();
            $('#channel_password').focus();
        break;
        case 'password_set':
            $('.channel_password_popup_channel_name').html(channel_name);
            $('#login_popup').hide();
            $('#ban_popup').hide();
            $('#channel_password_popup').show();
            $('#channel_password_popup_password_required').hide();
            $('#channel_password_popup_password_invalid').hide();
            $('#channel_password_popup_password_set').show();
            $('#channel_password').focus();
        break;
        case 'ban':
            $('.channel_password_popup_channel_name').html(channel_name);
            
            $('#login_popup').hide();
            $('#channel_password_popup').hide();
            $('#ban_popup').show();
            
            gc_client.loadUnbanLists(channel_name);
        break;
    }
}

// called by gc_client
gc_Interface.prototype.setBanPopupUnbanOptions = function(channel_name, unban_list)
{
    if($('.channel_password_popup_channel_name').html() != channel_name)
    {
        // wrong channel for this popup
        //console.log('noh');
        //console.log($('.channel_password_popup_channel_name').html());
        //console.log(channel_name);
        return;
    }
    //console.log('yaay');
    // Figure out how get the match from the serv0r? USE AN EXTREME FOR LOOP OF DOOM!!
    var ips_added = new Array();
    var users_added = new Array();
    for(var i= 0; i<unban_list.length;i++)
    {
        // check if the popup hasn't closed during load
        if(!this.popup_shown)
        {
            // empty the lists (precaution, don't know if neccesary)
            $('#ip_bans').html('');
            $('#user_bans').html('');
            break;
        }

        var loop_ip = unban_list[i]['IP'];
        var loop_username = unban_list[i]['username'];
        // Compleet nieuwe username en IP
        if($.inArray(loop_ip, ips_added ) == -1 && $.inArray( loop_username , users_added ) == -1)
        {
            if(loop_username != '' && loop_ip != '')
            {
                $('#ip_bans').append($('<option></option>').attr('id', 'ip:'+loop_ip).val(loop_ip).html(loop_ip).data('usernames', [loop_username])); 
                $('#user_bans').append($('<option></option>').attr('id', 'user:'+loop_username).val(loop_username).html(loop_username).data('ips', [loop_ip])); 
                ips_added.push(loop_ip);
                users_added.push(loop_username);
                
                this.unban_ip_selectbox_selected['ip:'+loop_ip] = false;
                this.unban_username_selectbox_selected['user:'+loop_username] = false;
            } else {
                // empty username
                if(loop_username == '')
                {
                    $('#ip_bans').append($('<option></option>').attr('id', 'ip:'+loop_ip).val(loop_ip).html(loop_ip).data('usernames', [])); 
                    ips_added.push(loop_ip);
                    
                    this.unban_ip_selectbox_selected['ip:'+loop_ip] = false;
                }

                // empty ip
                if(loop_ip == '')
                {
                    $('#user_bans').append($('<option></option>').attr('id', 'user:'+loop_username).val(loop_username).html(loop_username).data('ips', [])); 
                    users_added.push(loop_username);
                    
                    this.unban_username_selectbox_selected['user:'+loop_username] = false;
                }

            }

        } else {
            // IP zat er al in
            if($.inArray(loop_ip, ips_added ) != -1)
            {
                if(loop_username != '')
                {
                    if($.inArray(loop_username, users_added ) == -1)
                    {
                        $('#user_bans').append($('<option></option>').attr('id', 'user:'+loop_username).val(loop_username).html(loop_username).data('ips', [loop_ip])); 
                        users_added.push(loop_username);
                        
                        this.unban_username_selectbox_selected['user:'+loop_username] = false;
                    } else {
                        $('#user:'+loop_username).data('ips').push(loop_ip);
                    }
                }
            }

            // username zat er al in
            if($.inArray(loop_username, users_added ) != -1)
            {
                if(loop_ip != '')
                {
                    if($.inArray(loop_ip, ips_added ) == -1)
                    {
                        $('#ip_bans').append($('<option></option>').attr('id', 'ip:'+loop_ip).val(loop_ip).html(loop_ip).data('usernames', [loop_username])); 
                        ips_added.push(loop_ip);
                        
                        this.unban_ip_selectbox_selected['ip:'+loop_ip] = false;
                    } else {
                        $('#ip:'+loop_ip).data('usernames').push(loop_username);
                    }
                }
            }
        }
    }

    $('#ip_bans option').click(this.ban_popup_list_click_callback);
    $('#user_bans option').click(this.ban_popup_list_click_callback);
}

gc_Interface.prototype.hidePopup = function()
{
    this.popup_shown = false;
    
    if(this.popup_type == 'ban')
    {
        $('#ip_bans option').unbind('click', this.ban_popup_list_click_callback);
        $('#user_bans option').unbind('click', this.ban_popup_list_click_callback);
        this.unban_ip_selectbox_selected = new Object();
        this.unban_username_selectbox_selected = new Object();
        $('#ip_bans').html('');
        $('#user_bans').html('');
    }
    
    this.popup_type = '';
    
    $('.login_field').unbind('keypress', this.popup_keypress_function);
    
    $('#channel_password').val('');
    $('.channel_password_popup_channel_name').html('');
    $('#popup_base').hide();
    
    this.showNextPopup();
}

gc_Interface.prototype.showError = function(message)
{
    alert(message);
}

gc_Interface.prototype.notify = function(page)
{
    $("#tab_" + page.getType() + '_' + page.getName()).attr('class', 'tabs_notify');
    
    if($.inArray(page, this.page_title_notifying_pages) == -1)
    {
        this.page_title_notifying_pages.push(page);
    }
    
    this.resetPageTitleNotifying();
}

gc_Interface.prototype.resetPageTitleNotifying = function()
{
    clearTimeout(this.page_title_notifying_current_timeout);
    if((this.page_title_notifying_pages).length > 0)
    {
        if(!this.page_title_notifying_active)
        {
            // were being put to active, set onclick on key press
            $(document).bind('click keydown', this.page_title_notifying_function_react);
        }
        this.page_title_notifying_active = true;
        this.page_title_notifying_function();
    } else {
        if(this.page_title_notifying_active)
        {
            // were being put to inactive, set onclick on key press
            $(document).unbind('click keydown', this.page_title_notifying_function_react);
        }
        this.page_title_notifying_active = false;
        $(document).attr("title", this.default_page_title);
        
    }
        
}

gc_Interface.prototype.scrollDown = function()
{
    if(this.current_page.getType() == 'channel')
    {
        //scroll down
        $("#room_" + this.current_page.getName()).stop().animate({
            scrollTop: $("#room_" + this.current_page.getName()).prop("scrollHeight") - $("#room_" + this.current_page.getName()).height()
        }, 225);
    }
}

// Helper functions
gc_Interface.prototype.getRoleStatus = function(role)
{
    //console.log('role: '+ role);
    var role_status = '?';
    
    switch(role)
    {
        case 0:
            role_status = '&#937;';
            break;
        case 1:
            role_status = '<img alt="Adm" src="img/star.png"></img>';
            break;
        case 2:
            role_status = '<img alt="Mod" src="img/cup.png"></img>';
            break;
        case 3:
            role_status = '&nbsp;';
            break;
        case 4:
            role_status = '<img alt="Bnd" src="img/user_delete.png"></img>';
            break;
    }
    
    return role_status;
}

gc_Interface.prototype.getRoleStatusTitle = function(role)
{
    var role_title = '';
    
    switch(role)
    {
        case 0:
            role_title = 'Quartermaster';
        break;
        case 1:
            role_title = 'Administrator';
            break;
        case 2:
            role_title = 'Moderator';
        break;
    }
    
    return role_title;
}

gc_Interface.prototype.getHasPasswordStatus = function(has_password)
{
    if(has_password)
    {
        return 'Y';
    } else {
        return 'N';
    }
}
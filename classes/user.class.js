

function s_User()
{
    this.socket = null;
    this.name = null;
    this.session_id = null;
    //this.channels = new Object();
    this.channel_users = new Object();
    
    this.id = null;
    this.regged = false;
    this.connected = false;
    this.is_root = false;
    this.show_persistent_root = false;
    
    this.channel_list_active = false;
    
    this.client_type = '';
}

s_User.prototype.setSocket = function(socket)
{
    this.socket = socket;
}

s_User.prototype.unsetSocket = function()
{
    this.socket = null;
}

s_User.prototype.setId = function(id)
{
    this.id = id;
}

s_User.prototype.getId = function()
{
    return this.id;
}

s_User.prototype.setName = function(name)
{
    this.name = name;
}

s_User.prototype.setSessionId = function(session_id)
{
    this.session_id = session_id;
}

s_User.prototype.getSocket = function()
{
    if(this.socket == null)
    {
        console.log('Warning!!! '+ this.name + '\'s socket was fetched, but no socket available!!');
    }
    return this.socket;
}

s_User.prototype.getName = function()
{
    return this.name;
}

s_User.prototype.setSessionId = function(session_id)
{
    return this.session_id;
}

/**
 * Returns true when active channels were joined
 * Returns false when there weren't any
 */
s_User.prototype.joinActiveChannels = function()
{
    
    var channel_user_found = false;
    for(var channel_name in this.channel_users)
    {
        var channel_users = this.channel_users[channel_name];
        if(channel_users.isActive())
        {
            channel_user_found = true;

            var channel = channel_users.getChannel();
            var current_user = this;
            channel.addUser(this, null, '', function(success)
            {
                switch(success)
                {
                    case 'success':
                        //console.log(current_user.getName() + ': successfull join');
                    break;
                    case 'fail':
                        //console.log(current_user.getName() + ': unable to add user');
                    break;
                    case 'password_required':
                        current_user.getSocket().emit("password_required", {"channel_name":channel.getName()});
                    break;
                    case 'password_invalid':
                        current_user.getSocket().emit("password_invalid", {"channel_name":channel.getName()});
                    break;
                }
            });
        }
    }
    
    return channel_user_found;
}


s_User.prototype.addChannelUser = function(channel_user)
{
    if(channel_user.getChannel().getName() in this.channel_users)
    {
        // channel_user already exists
        return false;
    }
    
    this.channel_users[channel_user.getChannel().getName()] = channel_user;
    return true;
}

s_User.prototype.removeChannelUser = function(channel_name)
{
    if(!(channel_name in this.channel_users))
    {
        // channel_user doesn't exists
        return false;
    }
    
    delete this.channel_users[channel_name];
    return true;
}

s_User.prototype.getChannelUsers = function()
{
    return this.channel_users
}

s_User.prototype.isRegged = function()
{
    return this.regged;
}

s_User.prototype.setRegged = function(regged)
{
    this.regged = Boolean(regged);
}

s_User.prototype.setConnected = function(connected)
{
    this.connected = connected;
}

s_User.prototype.isConnected = function()
{
    return this.connected;
}

s_User.prototype.setRoot = function(is_root)
{
    this.is_root = is_root;
}

s_User.prototype.isRoot = function()
{
    return this.is_root;
}

s_User.prototype.setShowPersistentRoot = function(show_persistent_root)
{
    this.show_persistent_root = show_persistent_root;
}

s_User.prototype.isShowPersistentRoot = function()
{
    return this.show_persistent_root;
}

s_User.prototype.emit = function(type, data)
{
    if(this.socket == null)
    {
        console.log('Warning!!! '+ this.name + 'was trying to emit '+ type + ', but didn\'t had a socket available');
        return false;
    }

    this.socket.emit(type, data);
    return true;
    
}

s_User.prototype.getIP = function()
{
    if(this.socket == null)
    {
        console.log('Warning!!! '+ this.name + 'was trying to get his IP, but didn\'t had a socket available');
        return null;
    }

    var ip = '';
    switch(this.client_type)
    {
        case 'socket':
            ip = socket.remoteAddress;
        break;
        case 'websocket':
            ip = this.socket.handshake.address.address;
        break;
    }
    return ip;
    
}

s_User.prototype.setChannelListActive = function()
{
    this.set_channel_list = true;
}

s_User.prototype.setChannelListInactive = function()
{
    this.set_channel_list = false;
}

s_User.prototype.isChannelListActive = function()
{
    return this.set_channel_list;
}

module.exports = s_User;


function s_Channel_Users(database, id, user, channel, role)
{
    this.database = database;
    this.id = id;
    this.user = user;
    this.channel = channel;
    this.role = role;
    this.show_root_status = false;
    this.muted = false;
    // user actually joined
    this.joined = false;
    
    // debug
    //this.random = Math.floor(Math.random()*100001);
    
    if(this.id == null && user.isRegged() && channel.isRegged())
    {
        // closure scope
        var current_object = this;

        //id null but user.id and channel.id are not? This should be in the database
        this.database.query()
        .insert("channels_users",
            ['user_id', 'channel_id', 'role', 'active', 'date_set'],
            [user.getId(), channel.getId(), role, 1, {value: "NOW()", escape: false}])
        .execute(function(error, result){
            if (error) {
                console.log('ERROR: ' + error);
            }
            
            current_object.setId(result.id);
        });
    }
    
}

s_Channel_Users.prototype.getId = function()
{
    return this.id;
}

s_Channel_Users.prototype.setId = function(id)
{
    this.id = id;
}

s_Channel_Users.prototype.getUser = function()
{
    return this.user;
}

s_Channel_Users.prototype.getChannel = function()
{
    return this.channel;
}

s_Channel_Users.prototype.getRole = function()
{
    return this.role;
}

s_Channel_Users.prototype.setRole = function(role)
{
    if(this.id != null && this.id > 0)
    {
        this.database.query().
        update('channels_users').
        set({ 'role': role }).
        where('id = ?', [ this.id ]).
        execute(function(error, result) {
            if (error) {
                console.log('ERROR: ' + error);
                return;
            }
            
            //console.log('role successfully updated');
        });
    }
    this.role = role;
}

s_Channel_Users.prototype.isRegged = function()
{
    if(this.id != null && this.id > 0)
    {
        return true;
    } else {
        return false;
    }
}

s_Channel_Users.prototype.isActive = function()
{
    return this.active;
}

s_Channel_Users.prototype.setActive = function(active)
{
    active = Boolean(active);
    
    if(this.id != null && this.id > 0)
    {
        this.database.query().
        update('channels_users').
        set({ 'active': active }).
        where('id = ?', [ this.id ]).
        execute(function(error, result) {
            if (error) {
                console.log('ERROR: ' + error);
                return;
            }
            
            //console.log('channel active successfully updated');
        });
    }
    this.active = active;
    
}
s_Channel_Users.prototype.isJoined = function()
{
    return this.joined;
}

s_Channel_Users.prototype.setJoined = function(joined)
{
    this.joined = Boolean(joined);   
}

s_Channel_Users.prototype.isShowRootStatus = function()
{
    return this.show_root_status;
}

s_Channel_Users.prototype.setShowRootStatus = function(show_root_status)
{
    this.show_root_status = show_root_status;
}
s_Channel_Users.prototype.mute = function()
{
    this.muted = true;
    
    if(this.id != null && this.id > 0)
    {
        this.database.query().
        update('channels_users').
        set({ 'muted': 1 }).
        where('id = ?', [ this.id ]).
        execute(function(error, result) {
            if (error) {
                console.log('ERROR: ' + error);
                return;
            }
            
            //console.log('channel muting successfully updated');
        });
    }
}
s_Channel_Users.prototype.unmute = function()
{
    this.muted = false;
    
    if(this.id != null && this.id > 0)
    {
        this.database.query().
        update('channels_users').
        set({ 'muted': 0 }).
        where('id = ?', [ this.id ]).
        execute(function(error, result) {
            if (error) {
                console.log('ERROR: ' + error);
                return;
            }
            
            //console.log('channel unmuting successfully updated');
        });
    }
}
s_Channel_Users.prototype.isMuted = function()
{
    //console.log('rand: on isMuted:' + this.random);
    return this.muted;
}

module.exports = s_Channel_Users;
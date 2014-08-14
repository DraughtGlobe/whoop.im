/* 
 * Channel
 */


function gc_Channel(client, name, topic, is_public)
{
    this.client = client;
    this.name = name;
    this.topic = topic;
    this.users = new Object();
    this.user_list = new Array();
    this.is_public = is_public;
    this.number_of_users = 0;
    
    this.page = new gc_Page('channel', name, this);
}

gc_Channel.prototype.getName = function()
{
    return this.name;
}

gc_Channel.prototype.getTopic = function()
{
    return this.topic;
}

gc_Channel.prototype.setTopic = function(topic)
{
    this.topic = topic;
}

gc_Channel.prototype.addUser = function(user, show_message)
{
    // check if exists
    if(user.name in this.users)
    {
        return false;
    }
    
    var index_to_add = this.getIndexPositionForUser(user);

    gc_client.getInterface().addUserToList(this, user, index_to_add );
    if(show_message)
    {
        gc_client.getInterface().appendSystemMessage(this.page, "<i>"+user.name+" joined</i>");
    }
    
    
    this.user_list.splice(index_to_add, 0, user);
    this.users[user.name] = user;
    this.number_of_users++;
    
    return true;
}

gc_Channel.prototype.removeUser = function(user)
{
    // check if exists
    if(user.name in this.users)
    {
        delete this.users[user.name];
        this.number_of_users--;   
        
        gc_client.getInterface().removeUserFromList(this, user);
        gc_client.getInterface().appendSystemMessage(this.page, "<i>"+user.name+" left</i>");
        
        var index = this.user_list.indexOf(user);
        this.user_list.splice(index, 1);
        
        return true;
    }
    
    return false;
}


gc_Channel.prototype.changeUserRole = function(user_name, role)
{
    //console.log('changeUserRole: role: '+role + ' user.name: '+ user_name + 'index_to_add: '+ index_to_add);
    this.users[user_name].role = role;
    
    // put it in an object
    var user = {'name':user_name, 'role':role};
    
    // get the index to remove
    var index_to_remove = gc_client.getInterface().getIndexOfUserInList(this.name, user_name);
    //console.log('ZOMG: index_to_remove: '+ index_to_remove);
    //console.log(this.user_list);
    
    // remove from our our array
    this.user_list.splice(index_to_remove, 1);
    
    // find out our new position
    var index_to_add = this.getIndexPositionForUser(user);
    
    // add it to our array
    this.user_list.splice(index_to_add, 0, user);
    
    gc_client.getInterface().setUserRole(this.name, user_name, role, index_to_remove, index_to_add);
}

gc_Channel.prototype.getUsers = function()
{
   return this.users;
}

gc_Channel.prototype.getNumberOfUsers = function()
{
    return this.number_of_users;
}

gc_Channel.prototype.sendMessage = function(message)
{
    gc_client.socket_client.emit('send_message', {"channel_name":this.name, "message":message});
}

gc_Channel.prototype.receiveMessage = function(user, message)
{
    if(message.slice(0, 4) == '/me ')
    {
        gc_client.getInterface().appendMeMessage(this, user, message.slice(4, message.length));
    } else {
        gc_client.getInterface().appendUserMessage(this, user, message);
    }
    
    if(gc_client.getUsername() != user && message.indexOf(gc_client.getUsername()) != -1)
    {
        gc_client.getInterface().notify(this.getPage());
    }
    
}

// this channel exists means we've already joined'
//gc_Channel.prototype.join = function()
//{
//    gc_client.socket_client.emit("join_channel", {"name": this.name});
//}

gc_Channel.prototype.leave = function()
{
    gc_client.socket_client.emit("leave_channel", {"name": this.name});
}

gc_Channel.prototype.isUserAdmin = function(user_name)
{
    return this.users[user_name].role == 1;
}

gc_Channel.prototype.isUserModerator = function(user_name)
{
    return this.users[user_name].role == 2;
}

gc_Channel.prototype.isUserVisitor = function(user_name)
{
    return (this.users[user_name].role == 3);
}

gc_Channel.prototype.getPage = function()
{
    return this.page;
}

gc_Channel.prototype.isPublic = function()
{
    return this.is_public;
}

gc_Channel.prototype.setPublic = function()
{
    this.is_public = true;
}
gc_Channel.prototype.setPrivate = function()
{
    this.is_public = false;
}

/*
 * helper functions
 */
gc_Channel.prototype.getIndexPositionForUser = function(user)
{
    //console.log('getIndexPositionForUser: ' + user.name)
    var index_to_add = -1;

    if(this.user_list.length > 0)
    {
        //Found at: http://stackoverflow.com/questions/3464815/insert-item-in-javascript-array-and-sort
        index_to_add = 0;
        var low = 0, high = this.user_list.length;
        var mid = -1, c = 0;
        while(low < high)   {
           mid = parseInt((low + high)/2);
           c = this.usernameOrderer(this.user_list[mid], user);
           if(c < 0)   {
              low = mid + 1;
           }else if(c > 0) {
              high = mid;
           }else {
              index_to_add = mid;
              break;
           }
        }
        index_to_add = low;
        ///////////////////////////////////
    }
    
    //console.log(this.user_list);
    //console.log('index_to_add for user '+ user.name+': '+index_to_add)
    
    return index_to_add;
}

gc_Channel.prototype.usernameOrderer = function (user1, user2)
{
    if(user1.role > user2.role)
    {
        //console.log('1'+user2.name + 'stands above' + user1.name);
        return 1;
    }else if(user1.role < user2.role)   {
        //console.log('2'+user1.name + 'stands above' + user2.name);
        return -1;
    } else {
        if(user1.name.localeCompare(user2.name) == 1)
        {
            //console.log('3'+user1.name + 'stands above' + user2.name);
        } else if(user1.name.localeCompare(user2.name) == -1)
        {
            //console.log('4'+user1.name + 'stands above' + user2.name); 
        } else {
            //console.log('5'+user1.name + 'equals' + user2.name)
        }
        // http://stackoverflow.com/questions/2167602/optimum-way-to-compare-strings-in-javascript
        return user1.name.localeCompare(user2.name);
    } 
}

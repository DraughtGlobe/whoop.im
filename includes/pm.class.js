/* 
 * PM
 */


function gc_PM(client, user_name)
{
    this.client = client;
    this.user_name = user_name;
    
    this.page = new gc_Page('pm', user_name, this);
}

gc_PM.prototype.getUsername = function()
{
    return this.user_name;
}

gc_PM.prototype.sendMessage = function(message)
{
    gc_client.socket_client.emit('send_pm', {"user_name":this.user_name, "message":message});
    
    // receive our own messages
    this.receiveMessage(this.client.getUsername(), message)
}

gc_PM.prototype.receiveMessage = function(user, message)
{
    if(message.slice(0, 4) == '/me ')
    {
        gc_client.getInterface().appendPMMeMessage(this, user, message.slice(4, message.length));
    } else {
        gc_client.getInterface().appendPMMessage(this, user, message);
    }
    
    if(gc_client.getUsername() != user)
    {
        gc_client.getInterface().notify(this.getPage());
    }
}

gc_PM.prototype.receiveMessageFailed = function(user_name, message)
{
    var short_message = message;
    if(message.length > 20)
    {
        short_message = message.substr(0, 10) + '...' + message.substr(message.length - 10);
    }
    
    var system_message = 'Couldn\'t send the following message, user ' + user_name + ' not online: "' + short_message + '"';

    gc_client.getInterface().appendSystemMessage(this.getPage(), system_message);
}

gc_PM.prototype.leave = function()
{
    // Server doesn't care'
    //gc_client.socket_client.emit("leave_pm", {"name": this.user_name});
}

gc_PM.prototype.getPage = function()
{
    return this.page;
}
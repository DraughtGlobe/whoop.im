/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function DBQueue(connection)
{
    this.connection = connection;
    this.queue = new Array();
}

DBQueue.prototype.query = function(query, param, callback)
{
    if(this.connection.is_active)
    {
        connection.query(query, params, callback);
    } else {
        // queue for later
        this.queue.push({'query':query, 'param':param, 'callback':callback});
    }
}

DBQueue.prototype.connectionSetActive = function()
{
    connection.is_active = true;
    
    // proccess zhe queue!
    while (this.queue[0]) {
        // check if connection is still active
        if(connection.is_active)
        {
            connection.query(this.queue[0].query, this.queue[0].params, this.queue[0].callback);
            this.queue.splice(0, 1);
        } else {
            // connection set to inactive
            break;
        }
        
    }
}

DBQueue.prototype.connectionSetInActive = function()
{
    connection.is_active = false;
}


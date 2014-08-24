/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function DBQueue(connection)
{
    this.connection = connection;
    this.queue = new Array();
    this.is_active = false;
};

DBQueue.prototype.setConection = function(connection)
{
    this.connection = connection;
};

DBQueue.prototype.query = function(query, params, callback)
{
    if(this.is_active)
    {
        connection.query(query, params, callback);
    } else {
        // queue for later
        this.queue.push({'query':query, 'param':params, 'callback':callback});
    }
};

DBQueue.prototype.setActive = function()
{
    this.is_active = true;
    
    // proccess zhe queue!
    while (this.queue[0]) {
        // check if connection is still active
        if(this.is_active)
        {
            connection.query(this.queue[0].query, this.queue[0].params, this.queue[0].callback);
            this.queue.splice(0, 1);
        } else {
            // connection set to inactive
            break;
        }
        
    }
};

DBQueue.prototype.setInactive = function()
{
    this.is_active = false;
};

module.exports = DBQueue;
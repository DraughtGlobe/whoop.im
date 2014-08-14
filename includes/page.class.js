/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

function gc_Page(type, name, channel, text)
{
    this.type = type;
    this.name = name;
    // when type = 'channel'
    this.channel = channel;
    // when type = 'text'
    this.text = text;
    
    this.active = true;
}

gc_Page.prototype.getType = function()
{
    return this.type;
}

gc_Page.prototype.getName = function()
{
    return this.name;
}

gc_Page.prototype.getChannel = function()
{
    return this.channel;
}

// alias
gc_Page.prototype.getPM = function()
{
    return this.channel;
}

gc_Page.prototype.getText = function()
{
    return this.text;
}

gc_Page.prototype.setInactive = function()
{
    this.active = false;
}

gc_Page.prototype.isActive = function()
{
    return this.active;
}
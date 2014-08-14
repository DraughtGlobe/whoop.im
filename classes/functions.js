// prerequisites
md5 = require('./md5.class.js');

module.exports.validateEmail = function(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

/* 
 * Helper and static functions
 */
module.exports.checkNickInuse = function(database, username, user_list, callback)
{
    // first check users given
    if(username in user_list.getUsers())
    {
        callback(true);
    } else {
        // check DB
        database.query('Select id from users where username = ?', [username], function(error, rows, columns){
            if (error) {
                console.log('ERROR: ' + error);
                
                // we got an error, just say nick is taken
                callback(true);
                
                return;
            }
            // Do something with rows & columns
            if(rows.length > 0)
            {
                // nick taken in db
                callback(true);
            } else {
                // nick not taken
                //console.log('nick not found in db')
                callback(false);
            }
        });
        
    }
}

module.exports.register = function(database, user, password, email, callback)
{
    // check if an correct email address has been entered.
    if(!module.exports.validateEmail(email))
    {
        // invalid email (TODO: errors)
        callback(false);
        return;
    }
    
    //console.log('REGISTER VALUES: ');
    //console.log(username);
    //console.log(md5.hex_md5('ehjfb74t43' + password));
    //console.log(email);
    //console.log(ip_address);
    
    // username already check since we are already connected. Insert into db
    database.query('Insert into users (username, password, email, date_joined, date_logged, ip_joined, ip_logged) VALUES (?, ?, ?, NOW(), NOW(), ?, ?)', 
    [user.getName(), md5.hex_md5('ehjfb74t43' + password), email, user.getIP(), user.getIP()], 
    function(error, result){
        if (error) {
            console.log('ERROR: ' + error);
            
            // we got an error, we failed :-(
            callback(false);
            
            return;
        }
                
        // the resulting id
        user.setRegged(true);
        user.setId(result.id);
        
        // get all current channel_users and register them with the specific channel
        var channel_users =  user.getChannelUsers();
        for(var user_name in channel_users)
        {
                // we know the user is persistent, check if the channel is
                if(channel_users[user_name].getChannel().isRegged())
                {

                    database.query('insert into channels_users (user_id, channel_id, role, active, date_set) VALUES (?, ?, ?, ?, NOW())', 
                    [user.getId(), channel_users[user_name].getChannel().getId(), channel_users[user_name].getRole(), 1], 
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
    
    return;
}


module.exports.login = function(database, user_list, user, password, callback)
{   
    //console.log('called login function');
    
    // check credentials
    database.query('Select id, password, is_root from users where username = ?', [user.getName()], function(error, rows, columns){
        if (error) {
            console.log('ERROR: ' + error);
            
            // we got an error, we failed :-(
            callback(false, 0);
            
            return;
        }
        
        // Do something with rows & columns
        if(rows.length > 0)
        {
            if(rows[0].password == md5.hex_md5('ehjfb74t43' + password) )
            {
                // the resulting id
                //console.log('id of user logging in: '+ rows[0].id);

                user.setRegged(true);
                user.setId(rows[0].id);         
                user.setRoot(Boolean(rows[0].is_root));

                database.query('update users set ip_logged = ?, date_logged = NOW() where id = ?', [user.getIP(), rows[0].id], function(error, result) {
                    if (error) {
                        console.log('ERROR: ' + error);
                    }
                });
                
                            
                // TODO get current user_channels?


                // Success
                callback(true);
                
            } else {
                // No user found
                //console.log('logging in: user ' + user.getName() + '. Incorrect password')
                callback(false);
            }
        } else {    
            // No user found
            //console.log('logging in: user ' + user.getName() + ' not found')
            callback(false);
            
            // CLEANUP: unset the user form the userlist, this user doesn't exists. And we don't want our list to get cluttered up with false login attempts
            delete user_list.users[user.getName()]
        }
        
    });
}
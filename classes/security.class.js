

module.exports.checker = {
    username: function(input)
    {
        if( typeof(input) != 'string' )
        {
            return false;
        }
        if(input.length > 0 && input.length <= 32 && testSpecialChars(input))
        {
            return true;
        } else {
            return false;
        }
    },
    userPassword: function(input)
    {
        if( typeof(input) != 'string' )
        {
            return false;
        }
        
        if(input.length >= 6 && input.length <= 128)
        {
            return true;
        } else {
            return false;
        }
    },
    channelName: function(input)
    {
        if( typeof(input) != 'string' )
        {
            return false;
        }
        
        if(input.length >= 4 && input.length <= 32 && testSpecialChars(input))
        {
            return true;
        } else {
            return false;
        }
    },
    channelPassword: function(input)
    {
        if( typeof(input) != 'string' )
        {
            return false;
        }
        
        if(input.length >= 6 && input.length <= 128)
        {
            return false;
        } else {
            return true;
        }
    },
    email: function(input)
    {
        if( typeof(input) != 'string' )
        {
            return false;
        }
        /*
         * Found at: http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
         */
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
       if(re.test(input))
        {
            return true;
        } else {
            return false;
        }
    },
    role: function(input)
    {
        if( typeof(input) != 'string' && typeof(input) != 'number')
        {
            return false;
        }
        
        input = parseInt(input);
        
        switch(input)
        {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
                return true;
            break;
            default:
                return false;
            break;
        }
    },
    ipBans: function(input)
    {
        if(!(input instanceof Array ))
        {
            return false;
        }
        
        for(var i = 0,input_length=input.length; i <  input_length; i++)
        {
            if(!fnValidateIPAddress(input[i]))
            {
                consuela.log(input[i] + ' is no valid IP');
                return false;
            }
        }
        
        return true;
        
    },
    userBans: function(input)
    {
        if(!(input instanceof Array) )
        {
            return false;
        }
        
        for(var i = 0,input_length=input.length; i <  input_length; i++)
        {
            if(!module.exports.checker.username(input[i]))
            {
                return false;
            }
        }
        
        return true;
    }
    
};

module.exports.escape = {
    
    bool:function(input)
    {
        if(typeof input == 'undefined')
        {
            return false;
        }
        
        return Boolean(input);
    },
    channelMessage: function(input)
    {
        if( typeof(input) != 'string' )
        {
            return '';
        }
        
        return escapeHtml(input).substr(0, 1024);
    },
    pmMessage: function(input)
    {
        if( typeof(input) != 'string' )
        {
            return '';
        }
        
        return escapeHtml(input).substr(0,1024);
    },
    channelTopic: function(input)
    {
        if( typeof(input) != 'string' )
        {
            return '';
        }
        return escapeHtml(input).substr(0, 512);
    },
    safeTextTitle: function(input)
    {
        if( typeof(input) != 'string' )
        {
            return '';
        }
        return escapeHtml(input);
    }
}

/*
checker.
s_Security.checker.username
s_Security.checker.userPassword
s_Security.checker.channelName
s_Security.checker.channelPassword
s_Security.checker.email (returns bool)
s_Security.checker.role
s_Security.checker.ipBans
s_Security.checker.userBans

escape.
s_Security.escape.bool
s_Security.escape.channelMessage
s_Security.escape.pMMessage
s_Security.escape.channelTopic
s_Security.escape.textTitle

*/

// helper function
// Found at: http://stackoverflow.com/questions/1787322/htmlspecialchars-equivalent-in-javascript
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function testSpecialChars(unsafe)
{
    return !(/[`~!@#$%^&*()|+\=?;:'",.<>\{\}\[\]\\\/\s]/gi.test(unsafe));
}

// http://www.guyfromchennai.com/?p=83
/******* Validate IP Address IPv4 *********/
function fnValidateIPAddress(ipaddr) {
    //Remember, this function will validate only Class C IP.
    //change to other IP Classes as you need
    ipaddr = ipaddr.replace( /\s/g, "") //remove spaces for checking
    var re = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/; //regex. check for digits and in
                                          //all 4 quadrants of the IP
    if (re.test(ipaddr)) {
        //split into units with dots "."
        var parts = ipaddr.split(".");
        //if the first unit/quadrant of the IP is zero
        if (parseInt(parseFloat(parts[0])) == 0) {
            return false;
        }
        //if the fourth unit/quadrant of the IP is zero
        if (parseInt(parseFloat(parts[3])) == 0) {
            return false;
        }
        //if any part is greater than 255
        for (var i=0; i<parts.length; i++) {
            if (parseInt(parseFloat(parts[i])) > 255){
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}
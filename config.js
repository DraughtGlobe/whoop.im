
/*
 * Config settings
 */
module.exports = {
    // database information
    'db_config': {
        "host": "localhost",
        "user": "woopwoop",
        "password": "U4pknGbSb8avcusVN3uMBW8v",
        "database": "woopwoop",
        "salt":"ehjfb74t43",
        'pepper':"",
    },
    // set debug mode
    'debug_mode': {
        // true, false OR 'file'
        'set':true,
        // when 'set' is 'file', check the following path for a file.
        // When the contents of the file is '1', debug mode is set
        'debug_file':'/etc/whoop.im/debug'
    },
    // http settings
    'http': {
        // port
        'port':'8000',
         // listen on that ip only
        'ip': undefined
    }
};

/*
 * Config settings
 */
module.exports = {
    // database information
    'db_config': {
        "host": "localhost",
        "user": "woopwoop",
        "password": "U4pknGbSb8avcusVN3uMBW8v",
        "database": "woopwoop"
    },
    // set debug mode
    'debug_mode': {
        // true, false OR 'file'
        'set':'file',
        // when 'set' is 'file', check the following path for a file.
        // When the contents of the file is '1', debug mode is set
        'debug_file':'/etc/whoop.im/debug'
    },
    // http settings
    'http': {
        // port
        'port':'80',
         // listen on that ip only
        'ip': undefined
    }
};
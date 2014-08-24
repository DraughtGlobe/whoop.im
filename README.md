Whoop.im
========

IRC-like chat in your web-browser! Including server written in nodejs!

Features
========
- Roles: Root, Admin, Moderator, normal user
- Multiple channels
- Channel list that gets updated on-the-fly
- Muting
- Kicking
- Banning
- Channel topics
- Setting channels public / private
- Setting passwords on channels
- Registering your username, so that you can login with it and be automatically connected to the channels you were in before the last disconnect
- Registering your channels, so your role within your channels will be preserved ( and the channel won't dissappear after everyone left )
- Message limit over a small period of time to prevent spamming ( does not affect Root users )
- Private messaging
- Text Pages

Any connected ( registered or not ) user can create a channel and be admin of it by joining a non-existing channel

Root users (aka Ninja's) can only be set manually in the database by setting 'is_root' to 1 

Type /help for the commands


Setup
========

- Currently depends on a MySQL server. Adjust config.js to your needs and import the db/woopwoop.sql file
- Also check the includes/client_config.js file
- npm install mysql
- npm install socket.io
- node main.node.js
- Browse to the server with the port in config.js using a browser.

If you have imported the woopwoop.sql file you will have a 'Root' user account: AdminAccount/AdminAccountPassword. However: I recommend changing the salt in the config.js to a new one for security reasons. In that case the password will become invalid and you'll have to change the current password in the database manually: You need the MD5 of your salt + the password + your pepper concatenated.

Debug mode
=======
Currently has a 'debug_mode' in config.js which is set to false by default. When set to true, it will compile the client assets using the Google Closure Compiler to one file. You will have to change the Javascript inclusions in pages/main.page.html to:

    <script type="text/javascript" src="js/socket.io.js"></script>
    <script type="text/javascript" src="js/js.js"></script>

This feature is the only thing that the debug mode option currently does.
To recompile 'js.js' after making changes to one of the js files in the 'includes' folder, Make sure 'debug_mode' is set to false, then call 'node main.node.js --compile_assets' once.

Legal
======
Currently includes a copy of JQuery and a compiled version of the Google Closure Compiler. These fall under their own respective licenses

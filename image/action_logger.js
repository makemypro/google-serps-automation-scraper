

exports.actionLogger = function(action_type, initial_url, new_url, was_successful){
    console.log("actionLogger:", action_type, initial_url, new_url, was_successful);
    // const redis = require('redis');
    // const client = redis.createClient(port, host);
    // client.on('connect', function() {
    //   console.log('Connected!');
    // });
    //
    // client.set('framework', 'ReactJS'); // OR
    // client.set(['framework', 'ReactJS']);

};

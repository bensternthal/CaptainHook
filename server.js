'use strict';

var Conf = require('./lib/conf');
var Hapi = require('hapi');
var Git = require('git-exec');
var SlackBot = require('slackbots');
var path = require('path');

// Create a server with a host and port
var server = new Hapi.Server();
var bot = new SlackBot({
  token: Conf.get('slackbot:api_token'),
  name: 'captainhook'
});


server.connection({
  host: Conf.get('domain'),
  port: Conf.get('port')
});

// Add the route to receive a webhook request
server.route({
  method: 'POST',
  path: '/webhook-receiver',
  config: {
    payload: {
      parse: false
    }
  },
  handler: function(request, reply) {
    reply().code(204);
    pullRepo(request);
  }
});

// Add the route to receive a webhook request
server.route({
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    console.log('here');
    reply('I am here');
  }
});

// Function to do pull
function pullRepo(request) {
  var payload = JSON.parse(request.payload);
  var repoName = payload.repository.name;
  var repo = new Git(Conf.get(repoName + ':filePath'));

  // update repository.. think about somehow sanitizing input
  repo.exec('pull', null, function(err, stdout) {
    //This should be less hardcoded.
    bot.postMessageToChannel('general', 'Devpatch Updated With Latest Code');
  });
}


// Start the server
server.start(function() {
  console.log('Server running at:', server.info.uri);
});
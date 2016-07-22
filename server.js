'use strict';

var Conf = require('./lib/conf');
var Hapi = require('hapi');
var Git = require('git-exec');
var SlackBot = require('slackbots');
var path = require('path');

// Create a server with a host and port
var server = new Hapi.Server();

// Create & Configure Slackbot
var bot = new SlackBot({
  token: Conf.get('slackbot:api_token'),
  name: 'captainhook'
});
var channel = Conf.get('slackbot:channel');
var params = {icon_emoji: ':heart_eyes_cat:'};

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

// Test Route.. are you alive!
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
    if (err) {
      console.log('Error: ' + err + '/n Stdout: ' + stdout);
    } else {
      bot.postMessageToChannel(channel, 'Devpatch Updated With Latest Code', params);
    }
  });
}


// Start the server
server.start(function() {
  console.log('Server running at:', server.info.uri);
});

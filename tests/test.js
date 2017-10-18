var MyLambdaFunction = require('../src/index.js');

var event = 
{
    "session": {
      "new": true,
      "sessionId": "amzn1.echo-api.session.[unique-value-here]",
      "attributes": {},
      "user": {
        "userId": "amzn1.ask.account.[unique-value-here]"
      },
      "application": {
        "applicationId": "amzn1.ask.skill.9f38e666-f9d0-4970-892d-5b2793cef971"
      }
    },
    "version": "1.0",
    "request": {
      "locale": "en-US",
      "timestamp": "2016-10-27T18:21:44Z",
      "type": "LaunchRequest",
      "requestId": "amzn1.echo-api.request.[unique-value-here]"
    },
    "context": {
      "AudioPlayer": {
        "playerActivity": "IDLE"
      },
      "System": {
        "device": {
          "supportedInterfaces": {
            "AudioPlayer": {}
          }
        },
        "application": {
          "applicationId": "amzn1.ask.skill.9f38e666-f9d0-4970-892d-5b2793cef971"
        },
        "user": {
          "userId": "amzn1.ask.account.[unique-value-here]"
        }
      }
    }
  };

  var context = {
    'succeed': function (data) {
        console.log(JSON.stringify(data, null,'\t') );

    },
    'fail': function (err) {
        console.log('context.fail occurred');
        console.log(JSON.stringify(err, null,'\t') );
    }

};

function callback(error, data) {
    if(error) {
        console.log('error: ' + error);
    } else {
        console.log(data);
    }
}

MyLambdaFunction['handler'] (event, context, callback);
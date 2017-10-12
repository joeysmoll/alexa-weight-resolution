'use strict';
var Alexa = require('alexa-sdk');

//enter app_id
const APP_ID = 'amzn1.ask.skill.9f38e666-f9d0-4970-892d-5b2793cef971';

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);

    alexa.dynamoDBTableName = 'weightTable';

    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function() {
        if (Object.keys(this.attributes).length === 0) {
            this.attributes['setStartingWeight'] = null;
            this.emit('LaunchIntent');
        } else {
            //route to record weight intent
        }
    },

    'LaunchIntent': function() {
        this.emit(':ask', 'Hello, I am Weight Bot. I noticed you have not set up a starting weight. Your starting weight will be used to track long term weight changes. Please say the number of pounds you currently weigh.');
    },

    'RecordStartingWeight': function() {
        var startPounds = this.event.request.intent.slots.StartWeight.value;
        var startDecimal = this.event.request.intent.slots.StartWeightDecimal.value;
        if (startDecimal == null) {
            this.attributes["startingWeight"] = parseInt(this.event.request.intent.slots.StartWeight.value);
            console.log('starting weight: ' + startWeight);

            //change to :ask and add yes/no to confirm weight.
            this.emit(':tell', 'Your starting weight is ' + this.attributes["startingWeight"] + '-pounds.');
        } else {
            this.attributes["startingWeight"] = parseFloat(this.event.request.intent.slots.StartWeight.value + "." + this.event.request.intent.slots.StartWeightDecimal.value);
            console.log('starting weight: ' + this.attributes["startingWeight"]);

            //change to :ask and add yes/no to confirm weight.
            this.emit(':tell', 'It looks like your starting weight is ' + this.attributes["startingWeight"] + '-pounds.');
        }
    }

};
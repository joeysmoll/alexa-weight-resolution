'use strict';
var Alexa = require('alexa-sdk');

//enter app_id
const APP_ID = 'amzn1.ask.skill.9f38e666-f9d0-4970-892d-5b2793cef971';

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);

    alexa.dynamoDBTableName = 'weightTable';

    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers, recordWeightHandlers);
    alexa.execute();
};

var STATES = {
    RECORDWEIGHT: '_RECORDWEIGHTMODE'
};

var handlers = {
    //when skill is launched with no intents
    'LaunchRequest': function() {
        if (Object.keys(this.attributes).length === 0) {
            this.attributes['setStartingWeight'] = null;
            this.emit('LaunchIntent');
        } else {
            //route to record weight intent
            this.emit('LaunchIntent');
        }
    },

    'LaunchIntent': function() {
        if (this.attributes['setStartingWeight'] == null) {
            this.emit(':ask', 'Hello, I am Weight Bot. I noticed you have not set up a starting weight. Your starting weight will be used to track long term weight changes. Please say the number of pounds you currently weigh.');
        } else {
            this.handler.state = STATES.RECORDWEIGHT;
            this.emit(':ask', 'How much do you weight today?');
        }
    },

    'RecordStartingWeight': function() {
        var startDecimal = this.event.request.intent.slots.StartWeightDecimal.value;
        if (startDecimal == null) {
            this.attributes["startingWeight"] = parseInt(this.event.request.intent.slots.StartWeight.value);
            console.log('starting weight: ' + this.attributes["startingWeight"]);

            this.emit(':ask', 'Your starting weight is ' + this.attributes["startingWeight"] + '-pounds. Is this correct?');
        } else {
            this.attributes["startingWeight"] = parseFloat(this.event.request.intent.slots.StartWeight.value + "." + this.event.request.intent.slots.StartWeightDecimal.value);
            console.log('starting weight: ' + this.attributes["startingWeight"]);

            this.emit(':ask', 'It sounds like your starting weight is ' + this.attributes["startingWeight"] + '-pounds. Is this correct?');
        }
    },

    'AMAZON.YesIntent': function() {
        this.attributes['setStartingWeight'] = true;
        this.emit(':tell', 'Your starting weight of ' + this.attributes["startingWeight"] + ' pounds has been saved.')
    },

    'AMAZON.NoIntent': function() {
        this.emit(':ask', 'Please say the number of pounds you currently weigh.');
    }
};

var recordWeightHandlers = Alexa.CreateStateHandler(STATES.RECORDWEIGHT, {

    //start with different intent?
    // 'LaunchWeight': function() {
    //     this.attributes['Weight'] = null;
    //     this.emit(':ask', 'How much do you weight today?');
    // },

    'RecordWeight': function() {
        this.attributes['Weight'] = this.event.request.intent.slots.Weight.value;
        //this.attributes['Weight'] = 150;
        this.emit(':tell', 'Today you weigh, ' + this.attributes['Weight']);
    }
});
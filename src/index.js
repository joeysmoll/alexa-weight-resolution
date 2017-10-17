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

var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1; //January is 0!
var monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
var yyyy = today.getFullYear();
if (dd < 10) {
    dd = '0' + dd
}
if (mm < 10) {
    mm = '0' + mm
}
var currentDay = mm + '/' + (dd - 1) + '/' + yyyy;


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
            this.emitWithState('LaunchWeight');
            //this.emit(':ask', 'How much do you weight today?');
        }
    },

    'RecordStartingWeight': function() {
        var startDecimal = this.event.request.intent.slots.StartWeightDecimal.value;
        this.attributes['startWeightDate'] = currentDay;
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
        this.emit(':tell', 'Your starting weight of ' + this.attributes["startingWeight"] + ' pounds has been saved.');
    },

    'AMAZON.NoIntent': function() {
        this.emit(':ask', 'Please say the number of pounds you currently weigh.');
    }
};

var recordWeightHandlers = Alexa.CreateStateHandler(STATES.RECORDWEIGHT, {
            //start with different intent?
            'LaunchWeight': function() {
                //this.attributes['Weight'] = null;
                this.emit(':ask', 'How much do you weigh today?');
            },

            'RecordWeight': function() {
                var weightDecimal = this.event.request.intent.slots.WeightDecimal.value;
                if (weightDecimal == null) {
                    this.attributes['Weight'] = this.event.request.intent.slots.Weight.value;
                    this.emit(':ask', 'Today you weigh, ' + this.attributes['Weight'] + " pounds. Is this correct?");
                } else {
                    this.attributes["Weight"] = parseFloat(this.event.request.intent.slots.Weight.value + "." + this.event.request.intent.slots.WeightDecimal.value);
                    this.emit(':ask', 'It sounds like today you weigh, ' + this.attributes['Weight'] + " pounds. Is this correct?");
                }
            },

            'AMAZON.YesIntent': function() {
                if (this.attributes['startingWeight'] >= this.attributes['Weight']) {
                    this.attributes['weightChange'] = Math.round((this.attributes['startingWeight'] - this.attributes['Weight']) * 10) / 10;
                    this.emit(':tell', 'You have lost ' + this.attributes['weightChange'] + ' pounds since ' + this.attributes['startWeightDate']);
                    //this.emit(':tell', 'You have lost ' + this.attributes['weightChange'] + 'pounds since ' + <say-as interpret-as = "date"> this.attributes['startWeightDate'] </say-as>);
                    }
                    else {
                        this.attributes['weightChange'] = Math.round((this.attributes['Weight'] - this.attributes['startingWeight']) * 10) / 10;
                        this.emit(':tell', 'You have gained ' + this.attributes['weightChange'] + ' pounds since ' + this.attributes['startWeightDate']);
                    }
                    this.handler.state = null;
                },

                'AMAZON.NoIntent': function() {
                    this.emit(':ask', 'Please say the number of pounds you currently weigh.');
                }
            });
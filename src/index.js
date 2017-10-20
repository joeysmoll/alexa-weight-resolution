'use strict';
var Alexa = require('alexa-sdk');
var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';

//enter app_id
const APP_ID = 'amzn1.ask.skill.9f38e666-f9d0-4970-892d-5b2793cef971';

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.dynamoDBTableName = 'weightTable';
    alexa.appId = APP_ID;
    //alexa.registerHandlers(handlers, recordWeightHandlers);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

// var STATES = {
//     RECORDWEIGHT: '_RECORDWEIGHTMODE'
// };

var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1; //January is 0!
var yyyy = today.getFullYear();
if (dd < 10) {
    dd = '0' + dd
}
if (mm < 10) {
    mm = '0' + mm
}
var currentDay = mm + '/' + (dd - 1) + '/' + yyyy;

function getLastWeek(){
    var today = new Date();
    var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    return lastWeek ;
}
var lastWeek = getLastWeek();
var lastWeekMonth = lastWeek.getMonth() + 1;
var lastWeekDay = lastWeek.getDate();
var lastWeekYear = lastWeek.getFullYear();
var lastWeekDisplay = lastWeekMonth + "/" + lastWeekDay + "/" + lastWeekYear;

var todayWeight = undefined;

var handlers = {
    //when skill is launched with no intents
    'LaunchRequest': function() {
        if (Object.keys(this.attributes).length === 0) {
            this.attributes['setStartingWeight'] = null;
            this.attributes['weightData'] = {weight:[], date:[]};
            this.emit('LaunchIntent');
        } else {
            //route to record weight intent
            this.emit('LaunchIntent');
        }
    },

    'LaunchIntent': function() {
        if (this.attributes['setStartingWeight'] == null) {
            this.emit(':ask', 'Hello, I am Weight Bot, your weight tracking companion. Its time to set up a starting weight. Your starting weight will be used to track long term weight changes. Please say the number of pounds you currently weigh.');
        } else {
            //this.handler.state = STATES.RECORDWEIGHT;
            //this.emitWithState('LaunchWeight');
            this.emit(':ask', 'How much do you weight today?');
        }
    },

    'RecordStartingWeight': function() {
        var startDecimal = this.event.request.intent.slots.StartWeightDecimal.value;
        
        if (startDecimal == null && this.attributes['setStartingWeight'] == null) {
            this.attributes['startWeightDate'] = currentDay;
            this.attributes["startingWeight"] = parseInt(this.event.request.intent.slots.StartWeight.value);
            console.log('starting weight: ' + this.attributes["startingWeight"]);
            this.emit(':ask', 'Your starting weight is ' + this.attributes["startingWeight"] + '-pounds. Is this correct?');
        } else if (startDecimal != null && this.attributes['setStartingWeight'] == null){
            this.attributes['startWeightDate'] = currentDay;
            this.attributes["startingWeight"] = parseFloat(this.event.request.intent.slots.StartWeight.value + "." + this.event.request.intent.slots.StartWeightDecimal.value);
            console.log('starting weight: ' + this.attributes["startingWeight"]);
            this.emit(':ask', 'It sounds like your starting weight is ' + this.attributes["startingWeight"] + '-pounds. Is this correct?');
        } else if(startDecimal == null && this.attributes['setStartingWeight'] == true){
            todayWeight = parseInt(this.event.request.intent.slots.StartWeight.value);
            this.emit(':ask', 'Your weight today is ' + todayWeight + '-pounds. Is this correct?');
        } else{
            todayWeight = parseFloat(this.event.request.intent.slots.StartWeight.value + "." + this.event.request.intent.slots.StartWeightDecimal.value);
            this.emit(':ask', 'It sounds like your weight today is ' + todayWeight + '-pounds. Is this correct?');
        }
    },

    'AMAZON.YesIntent': function() {
        this.attributes['message'] = null;
        if (this.attributes['setStartingWeight'] == null){
            this.attributes['setStartingWeight'] = true;
            this.attributes['weightData'].weight.push(this.attributes["startingWeight"]);
            this.attributes['weightData'].date.push(currentDay);
            this.emit(':tell', 'Your starting weight of ' + this.attributes["startingWeight"] + ' pounds has been saved.');
        } else {
            //push daily weight
            this.attributes['lastWeekWeight'] = this.attributes['weightData'].weight[this.attributes['weightData'].date.indexOf(lastWeekDisplay)];
            //this.attributes['lastWeekWeight'] = this.attributes['weightData'].weight[this.attributes['weightData'].date.indexOf(currentDay)];
            //this.attributes['lastWeekWeight'] = 140;
            this.attributes['weightData'].weight.push(todayWeight);
            this.attributes['weightData'].date.push(currentDay);
            var weightChange = undefined;
            if(todayWeight <= this.attributes["startingWeight"]) {
                weightChange = Math.round((this.attributes['startingWeight'] - todayWeight) * 10) / 10;
                this.attributes['message'] = 'Great, you have lost ' + weightChange + ' pounds since ' + this.attributes['startWeightDate'];
                // if(this.attributes['lastWeekWeight'] != null && this.attributes['lastWeekWeight'] >= todayWeight){
                //     var weekWeightLoss = this.attributes['lastWeekWeight'] - todayWeight;
                //     this.attributes['message'] += '. And lost ' + weekWeightLoss + ' pounds since last week.'; 
                // }else if (this.attributes['lastWeekWeight'] != null && todayWeight > this.attributes['lastWeekWeight']){
                //     var weekWeightGain = todayWeight - this.attributes['lastWeekWeight'];
                //     this.attributes['message'] += '. And gained ' + weekWeightGain + ' pounds since last week.'; 
                // }
                // this.emit(':tell', this.attributes['message']);
                //this.emit(':tell', 'Great, you have lost ' + weightChange + ' pounds since ' + this.attributes['startWeightDate'] + '. And 7 days ago was ' + lastWeekDisplay);
                
            } else {
                weightChange = Math.round((todayWeight - this.attributes['startingWeight']) * 10) / 10;
                this.attributes['message'] = 'Uh oh, looks like you have gained ' + weightChange + ' pounds since ' + this.attributes['startWeightDate'];
                // if(this.attributes['lastWeekWeight'] != null && this.attributes['lastWeekWeight'] >= todayWeight){
                //     var weekWeightLoss = this.attributes['lastWeekWeight'] - todayWeight;
                //     this.attributes['message'] += '. And lost ' + weekWeightLoss + ' pounds since last week.'; 
                // }else if (this.attributes['lastWeekWeight'] != null && todayWeight > this.attributes['lastWeekWeight']){
                //     var weekWeightGain = todayWeight - this.attributes['lastWeekWeight'];
                //     this.attributes['message'] += '. And gained ' + weekWeightGain + ' pounds since last week.'; 
                // }
                // this.emit(':tell', this.attributes['message']);
                //this.emit(':tell', 'Uh oh, looks like you have gained ' + weightChange + ' pounds since ' + this.attributes['startWeightDate'] + '. And 7 days ago was ' + lastWeekDisplay);
            }
            if(this.attributes['lastWeekWeight'] != null && this.attributes['lastWeekWeight'] >= todayWeight){
                var weekWeightLoss = this.attributes['lastWeekWeight'] - todayWeight;
                this.attributes['message'] += '. And lost ' + weekWeightLoss + ' pounds since last week.'; 
            }else if (this.attributes['lastWeekWeight'] != null && todayWeight > this.attributes['lastWeekWeight']){
                var weekWeightGain = todayWeight - this.attributes['lastWeekWeight'];
                this.attributes['message'] += '. And gained ' + weekWeightGain + ' pounds since last week.'; 
            }
            this.emit(':tell', this.attributes['message']);
        }        
    },

    'AMAZON.NoIntent': function() {
        this.emit(':ask', 'Please say the number of pounds you currently weigh.');
    }
};

// var recordWeightHandlers = Alexa.CreateStateHandler(STATES.RECORDWEIGHT, {
//             //start with different intent?
//             'LaunchWeight': function() {
//                 //this.attributes['Weight'] = null;
//                 this.emit(':ask', 'How much do you weigh today?');
//             },

//             'RecordWeight': function() {
//                 var weightDecimal = this.event.request.intent.slots.WeightDecimal.value;
//                 if (weightDecimal == null) {
//                     this.attributes['Weight'] = this.event.request.intent.slots.Weight.value;
//                     this.emit(':ask', 'Today you weigh, ' + this.attributes['Weight'] + " pounds. Is this correct?");
//                 } else {
//                     this.attributes["Weight"] = parseFloat(this.event.request.intent.slots.Weight.value + "." + this.event.request.intent.slots.WeightDecimal.value);
//                     this.emit(':ask', 'It sounds like today you weigh, ' + this.attributes['Weight'] + " pounds. Is this correct?");
//                 }
//             },

//             'AMAZON.YesIntent': function() {
//                 if (this.attributes['startingWeight'] >= this.attributes['Weight']) {
//                     this.attributes['weightData'] = {weight:this.attributes['Weight'], date:this.attributes['startWeightDate']};
//                     //this.attributes['testObject'] = this.attributes['weightData'].placeholderWeight;
//                     this.attributes['weightChange'] = Math.round((this.attributes['startingWeight'] - this.attributes['Weight']) * 10) / 10;
//                     this.emit(':tell', 'Great, You have lost ' + this.attributes['weightChange'] + ' pounds since ' + this.attributes['startWeightDate']);
//                     //this.emit(':tell', 'You have lost ' + this.attributes['weightChange'] + 'pounds since ' + <say-as interpret-as = "date"> this.attributes['startWeightDate'] </say-as>);
//                     }
//                     else {
//                         this.attributes['weightChange'] = Math.round((this.attributes['Weight'] - this.attributes['startingWeight']) * 10) / 10;
//                         this.emit(':tell', 'Uh oh, You have gained ' + this.attributes['weightChange'] + ' pounds since ' + this.attributes['startWeightDate']);
//                     }
//                     //this.handler.state = null;
//                 },

//                 'AMAZON.NoIntent': function() {
//                     this.emit(':ask', 'Please say the number of pounds you currently weigh.');
//                 }
//             });
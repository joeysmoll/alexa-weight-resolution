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
    alexa.registerHandlers(handlers);
    alexa.execute();
};

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
            //this.attributes['weightData'] = {weight:[], date:[]};
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
            this.emit(':ask', 'How much do you weigh today?');
        }
    },

    'RecordWeight': function() {
        var weightDecimal = this.event.request.intent.slots.WeightDecimal.value;
        //this.attributes['weightData'] = {weight:[], date:[]};
        if (weightDecimal == null && this.attributes['setStartingWeight'] == null) {
            this.attributes['weightData'] = {weight:[], date:[]};
            this.attributes['startWeightDate'] = currentDay;
            this.attributes["startingWeight"] = parseInt(this.event.request.intent.slots.Weight.value);
            console.log('starting weight: ' + this.attributes["startingWeight"]);
            this.emit(':ask', 'It sounds like your starting weight is ' + this.attributes["startingWeight"] + '-pounds. Is this correct?');
        } else if (weightDecimal != null && this.attributes['setStartingWeight'] == null){
            this.attributes['weightData'] = {weight:[], date:[]};
            this.attributes['startWeightDate'] = currentDay;
            this.attributes["startingWeight"] = parseFloat(this.event.request.intent.slots.Weight.value + "." + this.event.request.intent.slots.WeightDecimal.value);
            console.log('starting weight: ' + this.attributes["startingWeight"]);
            this.emit(':ask', 'It sounds like your starting weight is ' + this.attributes["startingWeight"] + '-pounds. Is this correct?');
        } else if(weightDecimal == null && this.attributes['setStartingWeight'] == true){
            todayWeight = parseInt(this.event.request.intent.slots.Weight.value);
            this.emit(':ask', 'It sounds like your weight today is ' + todayWeight + '-pounds. Is this correct?');
        } else{
            todayWeight = parseFloat(this.event.request.intent.slots.Weight.value + "." + this.event.request.intent.slots.WeightDecimal.value);
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
            } else {
                weightChange = Math.round((todayWeight - this.attributes['startingWeight']) * 10) / 10;
                this.attributes['message'] = 'It looks like you have gained ' + weightChange + ' pounds since ' + this.attributes['startWeightDate'];
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
    },

    'RepeatWeight': function(){
        var lastWeightDate = this.attributes['weightData'].date.slice(-1)[0];
        this.emit(':tell', 'Your starting weight recorded on ' + this.attributes['startWeightDate'] + ' was ' + this.attributes["startingWeight"] + ' pounds. Your last recorded weight on ' + lastWeightDate + ' was ' + this.attributes['weightData'].weight.slice(-1)[0] + ' pounds.');
    },

    'ResetWeightBot': function(){
        this.emit(':ask', 'Resetting weight bot will clear your weight data and will prompt you for your new starting weight. Please say, confirm reset to reset weight bot.');
    },

    'ConfirmReset': function(){
        delete this.attributes['setStartingWeight'];
        this.attributes['setStartingWeight'] == null;
        this.emit('LaunchIntent');
    },

    'AMAZON.HelpIntent': function(){
        this.emit(':tell', 'To quickly store your weight, you can say something like. Alexa, tell weight bot, one hundred and seventy-five pounds, or, Alexa, tell weight bot, my weight today is one hundred and seventy-five point five pounds. To hear your starting weight and your last recorded weight you can say. How much do I weigh? If the skill has not been launched yet, you can say. Alexa, ask weight bot, what is my weight? You can also reset your weight information by saying, reset weight bot.');
    }
};
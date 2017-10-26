'use strict';
var Alexa = require('alexa-sdk');
var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
var VoiceLabs = require("voicelabs")('78c45990-b922-11a7-0b4c-02ddc10e4a8b');
var moment = require('moment-timezone');

const APP_ID = 'amzn1.ask.skill.9f38e666-f9d0-4970-892d-5b2793cef971';

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.dynamoDBTableName = 'weightTable';
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

// var today = new Date();
// var dd = today.getDate();
// var mm = today.getMonth() + 1; //January is 0!
// var yyyy = today.getFullYear();
// if (dd < 10) {
//     dd = '0' + dd
// }
// if (mm < 10) {
//     mm = '0' + mm
// }
// var currentDay = mm + '/' + (dd - 1) + '/' + yyyy;

// function getLastWeek(){
//     var today = new Date();
//     var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
//     return lastWeek ;
// }
// var lastWeek = getLastWeek();
// var lastWeekMonth = lastWeek.getMonth() + 1;
// var lastWeekDay = lastWeek.getDate();
// var lastWeekYear = lastWeek.getFullYear();
// var lastWeekDisplay = lastWeekMonth + "/" + lastWeekDay + "/" + lastWeekYear;

var currentDay = moment().tz("America/Los_angeles").format('L');
var lastWeekDisplay = moment().subtract(7, 'days').tz("America/Los_Angeles").format('L');

var todayWeight = undefined;

var handlers = {
    'LaunchRequest': function() {
        if (Object.keys(this.attributes).length === 0) {
            this.attributes['setStartingWeight'] = null;
            this.emit('LaunchIntent');
        } else {
            this.emit('LaunchIntent');
        }
    },

    'LaunchIntent': function() {
        if (this.attributes['setStartingWeight'] == null) {
            var speechText = 'Hello, I am Weight Bot, your weight tracking assistant. Its time to set up a starting weight. Your starting weight will be used to track long term weight changes. Please say the number of pounds you currently weigh.';
            VoiceLabs.track(this.event.session, 'LaunchIntent', null, speechText, (error, response) => {
                console.log(error);
                this.emit(':ask', speechText);
            });
        } else {
            var speechText = 'How much do you weigh today?';
            VoiceLabs.track(this.event.session, 'LaunchIntent', null, speechText, (error, response) => {
                this.emit(':ask', speechText);
            });
        }
    },

    'RecordWeight': function() {
        var weightDecimal = this.event.request.intent.slots.WeightDecimal.value;
        if (weightDecimal == null && this.attributes['setStartingWeight'] == null) {
            this.attributes['weightData'] = {weight:[], date:[]};
            this.attributes['startWeightDate'] = currentDay;
            this.attributes["startingWeight"] = parseInt(this.event.request.intent.slots.Weight.value);
            var speechText = 'It sounds like your starting weight is ' + this.attributes["startingWeight"] + '-pounds. Is this correct?';
            VoiceLabs.track(this.event.session, 'RecordWeight', this.attributes["startingWeight"], speechText, (error, response) => {
                this.emit(':ask', speechText);
            });
        } else if (weightDecimal != null && this.attributes['setStartingWeight'] == null){
            this.attributes['weightData'] = {weight:[], date:[]};
            this.attributes['startWeightDate'] = currentDay;
            this.attributes["startingWeight"] = parseFloat(this.event.request.intent.slots.Weight.value + "." + this.event.request.intent.slots.WeightDecimal.value);
            var speechText = 'It sounds like your starting weight is ' + this.attributes["startingWeight"] + '-pounds. Is this correct?';
            VoiceLabs.track(this.event.session, 'RecordWeight', this.attributes["startingWeight"], speechText, (error, response) => {
                this.emit(':ask', speechText);
            });
        } else if(weightDecimal == null && this.attributes['setStartingWeight'] == true){
            todayWeight = parseInt(this.event.request.intent.slots.Weight.value);
            var speechText = 'It sounds like your weight today is ' + todayWeight + '-pounds. Is this correct?';
            VoiceLabs.track(this.event.session, 'RecordWeight', todayWeight, speechText, (error, response) => {
                this.emit(':ask', speechText);
            });
        } else{
            todayWeight = parseFloat(this.event.request.intent.slots.Weight.value + "." + this.event.request.intent.slots.WeightDecimal.value);
            var speechText = 'It sounds like your weight today is ' + todayWeight + '-pounds. Is this correct?';
            VoiceLabs.track(this.event.session, 'RecordWeight', todayWeight, speechText, (error, response) => {
                this.emit(':ask', speechText);
            });
        }
    },

    'AMAZON.YesIntent': function() {
        this.attributes['message'] = null;
        if (this.attributes['setStartingWeight'] == null){
            this.attributes['setStartingWeight'] = true;
            this.attributes['weightData'].weight.push(this.attributes["startingWeight"]);
            this.attributes['weightData'].date.push(currentDay);
            var speechText = 'Your starting weight of ' + this.attributes["startingWeight"] + ' pounds has been saved. When recording your weight in the future you can quickly record your weight by saying something along the lines of. Alexa, tell weight bot, one hundred and seventy-five point two pounds. Once I have enough weight data, I will tell you how much weight you have lost, or gained, since last week. You can also say help, after opening weight bot, to get a list of commands you can use with weight bot.';
            VoiceLabs.track(this.event.session, 'AMAZON.YesIntent', 'Yes', speechText, (error, response) => {
                this.emit(':tell', speechText);
            });
        } else {
            //push daily weight
            this.attributes['lastWeekWeight'] = this.attributes['weightData'].weight[this.attributes['weightData'].date.indexOf(lastWeekDisplay)];
            //this.attributes['lastWeekWeight'] = 138;
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
                var weekWeightLoss = Math.round((this.attributes['lastWeekWeight'] - todayWeight) * 10) / 10;
                this.attributes['message'] += '. And lost ' + weekWeightLoss + ' pounds since last week.'; 
            }else if (this.attributes['lastWeekWeight'] != null && todayWeight > this.attributes['lastWeekWeight']){
                var weekWeightGain = Math.round((todayWeight - this.attributes['lastWeekWeight']) * 10) / 10;
                this.attributes['message'] += '. And gained ' + weekWeightGain + ' pounds since last week.'; 
            }
            var speechText = this.attributes['message'];
            VoiceLabs.track(this.event.session, 'AMAZON.YesIntent', 'Yes', speechText, (error, response) => {
                this.emit(':tell', speechText);
            });
        }        
    },

    'AMAZON.NoIntent': function() {
        var speechText = 'Please say the number of pounds you currently weigh.';
        VoiceLabs.track(this.event.session, 'AMAZON.NoIntent', 'No', speechText, (error, response) => {
            this.emit(':ask', speechText);
        }); 
    },

    'RepeatWeight': function(){
        var lastWeightDate = this.attributes['weightData'].date.slice(-1)[0];
        var speechText = 'Your starting weight recorded on ' + this.attributes['startWeightDate'] + ' was ' + this.attributes["startingWeight"] + ' pounds. Your last recorded weight on ' + lastWeightDate + ' was ' + this.attributes['weightData'].weight.slice(-1)[0] + ' pounds.';
        VoiceLabs.track(this.event.session, 'RepeatWeight', 'What is my weight?', speechText, (error, response) => {
            this.emit(':tell', speechText);
        });
    },

    'ResetWeightBot': function(){
        var speechText = 'Resetting weight bot will clear your weight data and will prompt you for your new starting weight. Please say. confirm reset. this will reset weight bot.';
        VoiceLabs.track(this.event.session, 'ResetWeightBot', 'Reset Weight Bot', speechText, (error, response) => {
            this.emit(':ask', speechText);
        }); 
    },

    'ConfirmReset': function(){
        delete this.attributes['setStartingWeight'];
        this.attributes['setStartingWeight'] == null;
        var speechText = 'LaunchIntent';
        VoiceLabs.track(this.event.session, 'ConfirmReset', 'Confirm Reset', speechText, (error, response) => {
            this.emit(speechText);
        }); 
    },

    'AMAZON.HelpIntent': function(){
        var speechText = 'To quickly store your weight, you can say. Alexa, tell weight bot, one hundred and seventy-five pounds, or. Alexa, tell weight bot, my weight today is one hundred and seventy-five point five pounds. To hear your starting weight, and your last recorded weight, you can say. Alexa, ask weight bot, how much do I weigh? To reset your weight information, you can say, reset weight bot.';
        VoiceLabs.track(this.event.session, 'AMAZON.HelpIntent', 'Help', speechText, (error, response) => {
            this.emit(':tell', speechText);
        }); 
    }
};
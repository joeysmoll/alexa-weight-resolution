'use strict';
var Alexa = require('alexa-sdk');
var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
var VoiceLabs = require("voicelabs")('5932f730-c638-11a7-364a-02f814b60257');
var moment = require('moment-timezone');

const APP_ID = 'amzn1.ask.skill.50d6ce6e-518e-4262-ab46-cf367abd30a0';

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.dynamoDBTableName = 'resolutionTable';
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var currentDay = moment().tz("America/Los_angeles").format('L');
var lastWeekDisplay = moment().subtract(7, 'days').tz("America/Los_Angeles").format('L');

var todayWeight = undefined;

var lossIntro = ['Awesome, ', 'Keep it up, ', 'Oh heck yeah, ', 'Holy moley, ', 'Your killin it, ', 'Look at you, ', 'You make me proud, ', 'Good job, ', 'Fan-freakin-tastic, ', "I bet your feeling good, ", "This brings a smile to speaker, "];

var tip = [
    'Learn about carbs with a low gly-seemik index, like beans and rolled oats. These foods have a smaller impact on insulin and blood sugar levels compared to other carbs.',
    "Find a diet that's right for you. The Snake diet is a fasting focused diet that yields the quickest results, but also requires a lot of willpower.",
    "Find a diet that's right for you. The slow carb diet by Tim Ferris is an effective diet that focuses on eating foods with a low gly-seemik index.",
    "Find a diet that's right for you. The ketogenic diet is a fat based diet that minimizes carbohydrate intake.",
    "Find a diet that's right for you. The paleo diet focuses on avoiding grains, dairy, and processed food.",
    "Find a diet that's right for you. A plant based diet includes, fruits, vegetables, whole grains and nuts, and it avoids foods like meat, dairy, eggs and processed foods.",
    "Find a diet that's right for you. Intermittent fasting emphasizes eating all your daily calories within a 1 to 8 hour window.",
    "Avoid drinking your calories and resort to water.",
    "Prioritize diet over exercise, but don't exclude exercise.",
    "Understand the differences between carbs, fats, and protein, also known as macros. This will assist you with meal planning.",
    "Although it might be out of the question, try reducing caffeine intake from coffee and tea. Caffeine raises cortisol levels and causes your body to increase insulin production",
    "Increase your dietary fiber to 25 to 30 grams a day. Fiber is typically found in healthy whole foods like fruits and vegetables and makes your body feel more satiated.",
    "Cut back on processed sugars. Try something like date sugar that is still a whole food, and has a lower gly-seemik index.",
    "Although it requires some will, cold showers and baths have profound fat burning effects.",
    "Weigh yourself everyday. It will make you more conscious on how diet and exercise is affecting your weight. Don't worry about small day to day weight fluctuations, but how you're trending in the long term.",
    "Do not get demoralized by weight fluctuations or weight loss plateaus. When losing weight there will be times where your body starts retaining more water. Keep up your routine, and the water weight will eventually be shed.",
    "Measure your waist, biceps, and thighs. On some days, you might not see a difference on the scale, but it will likely show up in your measurements.",
    "Ease in to a new workout routine, and focus on form to prevent injury.",
    "Calculate your body mass index.",
    "Calculate your body fat percentage.",
    "Reduce use of Artificial sweetners. Although they have no calories these sweetners will increase insulin productiion blood sugar levels.",
    "Drink ice water. It's considered a negative calorie drink since your body burns calories to heat the water up to body temperature.",
    "Eat celery. It's a near to zero calorie food, high in fiber which helps boost your metabolism.",
    "Try to get a good sleep. Poor sleep has a negative affect on your bodies metabolism.",
    "Eat spicy foods. Capsaicin, which is found in spicy food, has been known to increase the bodies metabolism."
];

var handlers = {
    'LaunchRequest': function() {
        if (Object.keys(this.attributes).length === 0) {
            this.attributes['setGoalWeight'] = null;
            this.emit('LaunchIntent');
        } else {
            this.emit('LaunchIntent');
        }
    },

    'LaunchIntent': function() {
        if (this.attributes['setGoalWeight'] == null) {
            var speechText = "Welcome to Weight Resolution. I'm <emphasis level='reduced'>so freakin</emphasis>  excited to be on this journey with you. It will be my job to give you feedback on your weight loss as you close in on your goal. Let's get started. What is your goal weight for the new year?";
            //var speechText = 'Hello, I am Weight Bot, your weight tracking assistant. Its time to set up a starting weight. Your starting weight will be used to track long term weight changes. Please say the number of pounds you currently weigh.';
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
        var weightDecimal = 0;
        this.attributes['message'] = null;
        if (this.attributes['setGoalWeight'] == null) {
            this.attributes['setGoalWeight'] = true;
            weightDecimal += parseInt(this.event.request.intent.slots.WeightDecimal.value); 
            this.attributes["goalWeight"] = parseFloat(this.event.request.intent.slots.Weight.value + "." + weightDecimal);
            this.attributes['weightData'] = {weight:[], date:[]};
            this.attributes['weightData'].weight.push(this.attributes["goalWeight"]);
            this.attributes['weightData'].date.push(currentDay);
            var speechText = 'Your goal weight of ' + this.attributes["goalWeight"] + ' pounds has been saved. If I heard your weight wrong. Please say, correct weight. If its correct, lets move on to your starting weight. What is your current weight?';
            VoiceLabs.track(this.event.session, 'RecordWeight', this.attributes["goalWeight"], speechText, (error, response) => {
                this.emit(':ask', speechText);
            }); 
        } else if(this.attributes['weightData'].weight.length == 1){
            weightDecimal += parseInt(this.event.request.intent.slots.WeightDecimal.value);
            this.attributes["startWeight"] = parseFloat(this.event.request.intent.slots.Weight.value + "." + weightDecimal);
            this.attributes['startWeightDate'] = currentDay;
            this.attributes['weightData'].weight.push(this.attributes["startWeight"]);
            this.attributes['weightData'].date.push(currentDay);
            var speechText = "Your starting weight of " + this.attributes["startWeight"] + " pounds has been saved. If I ever hear your weight wrong. Please open Weight Resolution, and say correct weight. I'll see you tomorrow and give you an update on your progress.";
            VoiceLabs.track(this.event.session, 'RecordWeight', this.attributes["startWeight"], speechText, (error, response) => {
                this.emit(':tell', speechText);
            });
        } else{
            weightDecimal += parseInt(this.event.request.intent.slots.WeightDecimal.value);
            todayWeight = parseFloat(this.event.request.intent.slots.Weight.value + "." + weightDecimal);
            this.attributes['weightData'].weight.push(todayWeight);
            this.attributes['weightData'].date.push(currentDay);
            var weightChange = undefined;
            var goalDiff = undefined;
            if(todayWeight <= this.attributes["startWeight"] && todayWeight > this.attributes["goalWeight"]) {
                weightChange = Math.round((this.attributes['startWeight'] - todayWeight) * 10) / 10;
                goalDiff =  Math.round((todayWeight - this.attributes["goalWeight"]) * 10) / 10;
                this.attributes['message'] = todayWeight + " pounds. " + lossIntro[Math.floor(Math.random() * 6)] + "you've lost " + weightChange + " pounds and you're " + goalDiff + " pounds from your goal."
                if( (Math.floor(Math.random() * 6) < 2) ){
                    this.attributes['message'] += " And now for a random tip. " + tip[Math.floor(Math.random() * 24)];
                }   
            } else if(todayWeight >= this.attributes["startWeight"]) {
                weightChange = Math.round((todayWeight - this.attributes['startWeight']) * 10) / 10;
                goalDiff =  Math.round((todayWeight - this.attributes["goalWeight"]) * 10) / 10;
                this.attributes['message'] = todayWeight + " pounds. You need to step it up, you've gained " + weightChange + ' pounds since ' + this.attributes['startWeightDate'] + ". You've got " + goalDiff + " pounds to go.";
            } else if(todayWeight <= this.attributes["goalWeight"]){
                this.attributes['message'] = todayWeight + " pounds. <prosody rate='slow'><say-as interpret-as='spell-out'>OMG</say-as></prosody>, you've reached your goal! Congratualations! What an exciting day! Its up to you, but if you would like to continue this weight loss journey, I would recommend resetting Weight Resolution, and set a new goal weight. To do this, open weight resolution and say. reset weight resolution.";
            }
            var speechText = this.attributes['message'];
            VoiceLabs.track(this.event.session, 'RecordWeight', todayWeight, speechText, (error, response) => {
                this.emit(':tell', speechText);
            });
        }
    },

    'CorrectWeight': function(){
        var speechText = 'Lets correct your last recorded weight of ' + this.attributes['weightData'].weight[this.attributes['weightData'].weight.length - 1] + ' pounds. What is your weight today?';
        this.attributes['weightData'].weight.pop();
        this.attributes['weightData'].date.pop();
        VoiceLabs.track(this.event.session, 'CorrectWeight', 'Correct Weight', speechText, (error, response) => {
            this.emit(':ask', speechText);
        }); 
    },

    'RepeatWeight': function(){
        var lastWeightDate = this.attributes['weightData'].date.slice(-1)[0];
        var speechText = 'Your starting weight recorded on ' + this.attributes['startWeightDate'] + ' was ' + this.attributes["startWeight"] + ' pounds. Your last recorded weight on ' + lastWeightDate + ' was ' + this.attributes['weightData'].weight.slice(-1)[0] + ' pounds.';
        VoiceLabs.track(this.event.session, 'RepeatWeight', 'What is my weight?', speechText, (error, response) => {
            this.emit(':tell', speechText);
        });
    },

    'ResetWeightResolution': function(){
        var speechText = 'Resetting weight resolution will clear your weight data and will prompt you for your new goal weight and starting weight. Please say. confirm reset. this will reset weight resolution.';
        VoiceLabs.track(this.event.session, 'ResetWeightResolution', 'Reset Weight Resolution', speechText, (error, response) => {
            this.emit(':ask', speechText);
        }); 
    },

    'ConfirmReset': function(){
        delete this.attributes['setGoalWeight'];
        this.attributes['setGoalWeight'] == null;
        var speechText = 'LaunchIntent';
        VoiceLabs.track(this.event.session, 'ConfirmReset', 'Confirm Reset', speechText, (error, response) => {
            this.emit(speechText);
        }); 
    },

    'AMAZON.StopIntent': function(){
        var speechText = 'Goodbye';
        VoiceLabs.track(this.event.session, 'AMAZON.StopIntent', 'Stop', speechText, (error, response) => {
            this.emit(':tell', speechText);
        }); 
    },

    'AMAZON.CancelIntent': function(){
        var speechText = 'Goodbye';
        VoiceLabs.track(this.event.session, 'AMAZON.CancelIntent', 'Cancel', speechText, (error, response) => {
            this.emit(':tell', speechText);
        }); 
    },

    'SessionEndedRequest': function() {
        console.log(`Session ended: ${this.event.request.reason}`);
    },

    'AMAZON.HelpIntent': function(){
        var speechText = 'Need help? To record your weight, you can say the number of pounds you currently weigh, such as, one hundred and ninety-five point 5 pounds. To correct an incorrectly recorded weight, say. correct weight. To find out your starting weight, and your last recorded weight, you can say. What is my weight? To reset your weight data, you can say. Reset weight resolution. Please say the phrase associated with the action you would like to take.';
        VoiceLabs.track(this.event.session, 'AMAZON.HelpIntent', 'Help', speechText, (error, response) => {
            this.emit(':ask', speechText);
        }); 
    }
};
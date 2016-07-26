/**
 * Created by haggais on 7/20/16.
 */

var express = require('express');
var bodyParser = require('body-parser');
var builder = require('botbuilder');

var app = express();
app.use(bodyParser.json());

var FacebookConnector = require('../connectors/FacebookConnector');
var fb = new FacebookConnector({
    validation_token: "<< validation token >>",
    page_access_token: "<< page access token >>"
});

app.get('/fb', fb.challenge());
app.post('/fb', fb.listen());

var bot = new builder.UniversalBot(fb);
bot.dialog('/', [
    function (session) {
        builder.Prompts.text(session, "Hello... What's your name?");
    },
    function (session, results) {
        session.userData.name = results.response;
        builder.Prompts.number(session, "Hi " + results.response + ", How many years have you been coding?");
    },
    function (session, results) {
        session.userData.coding = results.response;
        builder.Prompts.choice(session, "What language do you use to develop in Node?", ["JavaScript", "CoffeeScript", "TypeScript"]);
    },
    function (session, results) {
        session.userData.language = results.response.entity;
        session.send("Got it... " + session.userData.name +
            " you've been programming for " + session.userData.coding +
            " years and use " + session.userData.language + ".");
    }
]);

var port = 3978
app.listen(port, function () {
    console.log('helloFB app is listening on port ' + port);
});
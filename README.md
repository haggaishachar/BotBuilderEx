# BotBuilderEx

The BotBuilderEx is a set of extensions for the Microsoft BotBuilder Node SDK (https://github.com/Microsoft/BotBuilder/tree/master/Node).

Connectors:
* FacebookConnector - enable a direct connector to Facebook
* LivePersonConnector - enable a direct connector to LivePerson in order to build 'bot agents'

Recognizers:
* NaturalRecognizer - a 100% open sourced text classification for intent identification using the Natural(https://github.com/NaturalNode/natural#classifiers) library


## Usage example:

    var express = require('express');
    var bodyParser = require('body-parser');
    var builder = require('botbuilder');
    var builderex = require('botbuilderex');

    var app = express();
    app.use(bodyParser.json());

    var fb = new builderex.connectors.FacebookConnector({
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
            builder.Prompts.choice(session, "What is your preferred programming language for Node?", ["JavaScript", "CoffeeScript", "TypeScript"]);
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


More examples can be found in the examples directory
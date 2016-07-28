var mb = require('botbuilder').Message;
var async = require('async');
var request = require('request');

const thumb_up_stickers = [369239383222810, 369239263222822, 369239343222814];

var FacebookConnector = (function () {
    function FacebookConnector(settings) {
        this.validation_token = settings.validation_token;
        this.getPageInfo = settings.getPageInfo;
        this.users = {};
    }
    FacebookConnector.prototype.getUserProfile = function (page_access_token, user_id, cb) {
        var user = this.users[user_id];
        if (user) { return cb(null, user) }

        var fields = 'first_name,last_name,profile_pic,locale,timezone,gender';
        var url = 'https://graph.facebook.com/v2.6/' + user_id + '?fields=' + fields + '&access_token=' + page_access_token;
        var _this = this;
        request(url, function (err, resp) {
            var body = JSON.parse(resp.body);
            if (resp.statusCode != 200) {
                return cb(body.error || 'error');
            }

            var user = body;
            user.id = user_id;
            _this.users[user_id] = user;
            cb(null, user);
        })
    }
    FacebookConnector.prototype.challenge = function() {
        var _this = this;
        return function (req, res) {
            if (req.query['hub.verify_token'] === _this.validation_token) {
                res.send(req.query['hub.challenge']);
            } else {
                console.error('Error, wrong validation token');
                res.send('Error, wrong validation token');
            }
        }
    }
    FacebookConnector.prototype.listen = function () {
        var _this = this;
        return function (req, res) {
            res.send('ok'); // respond quickly, or FB will send the message again and again

            var messaging_events = req.body.entry[0].messaging;
            for (var i = 0; i < messaging_events.length; i++) {
                var event = req.body.entry[0].messaging[i];
                if (event.delivery || event.read) continue;
                if (event.message && event.message.is_echo) continue;

                var page_id = event.recipient.id;
                var user_id = event.sender.id;
                var text = event.message ? event.message.text : null;
                var attachments = event.message ? event.message.attachments : null;
                var postback = event.postback ? event.postback.payload : null;
                var optin = event.optin;
                var sticker_id = event.message && event.message.sticker_id ? event.message.sticker_id : null;
                if (thumb_up_stickers.indexOf(sticker_id) > -1) text = 'thumb up'

                var page = null;
                async.waterfall([
                    function (cb) {
                        _this.getPageInfo(page_id, cb);
                    },
                    function (_page, cb) {
                        page = _page;
                        _this.getUserProfile(page.page_access_token, user_id, cb);
                    },
                    function (user) {
                        // todo: take care of the other inputs as well

                        var msg = new mb()
                            .address({channelId: 'facebook', user: user, source: page, conversation: {id: user_id}})
                            .timestamp()
                            .text(text)
                            .attachments(attachments);

                        _this.handler(msg.toMessage());
                    }
                ], function (err) {
                    if (err) throw err;
                })
            }
        }
    }
    FacebookConnector.prototype.onEvent = function (handler) {
        this.handler = handler;
    };
    FacebookConnector.prototype.send = function (messages, done) {
        async.eachSeries(messages, this.postMessage, done);
    }
    FacebookConnector.prototype.postMessage = function (msg, cb) {
        // todo: this needs to be aligned with the BotBuilder cards + FB specific transformation

        if (msg.text) var message = { text: msg.text };
        if (msg.attachment) var message = { attachment: msg.attachment };
        if (!message) return cb('no message');

        var o = {
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: msg.address.source.page_access_token
            },
            method: "POST",
            json: {
                recipient: {id: msg.address.user.id},
                message: message
            }
        }

        request(o, cb);
    }
    FacebookConnector.prototype.startConversation = function (address, cb) {
        cb('startConversation, not impl');
    };
    return FacebookConnector;
})();

module.exports = FacebookConnector;

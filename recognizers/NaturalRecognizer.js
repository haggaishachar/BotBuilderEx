var request = require('request');
var natural = require('natural');

var NaturalRecognizer = (function () {
    function NaturalRecognizer(filename, stemmer) {
        var _this = this;
        if (filename) {
            natural.LogisticRegressionClassifier.load(filename, stemmer, function (err, classifier) {
                _this.classifier = classifier;
            });
        }
    }
    NaturalRecognizer.prototype.train = function (intents, output, cb) {
        var classifier = new natural.LogisticRegressionClassifier();
        Object.keys(intents).forEach(function (intent) {
            var utterances = intents[intent];
            utterances.forEach(function (utterance) {
                classifier.addDocument(utterance, intent);
            })
        })

        classifier.train();
        this.classifier = classifier;
        classifier.save(output, cb);
    }
    NaturalRecognizer.prototype.recognize = function (context, cb) {
        var result = { score: 0.0, intent: null };
        if (context && context.message && context.message.text) {
            var utterance = context.message.text;
            var locale = context.message.textLocale || '*';

            var classifications = this.classifier.getClassifications(utterance);
            if (classifications && classifications.length) {
                result.intent = classifications[0].label;
                result.score = classifications[0].value;
            }
            cb(null, result);
        }
    };
    return NaturalRecognizer;
})();

module.exports = NaturalRecognizer;
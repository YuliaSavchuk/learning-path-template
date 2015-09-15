﻿define(['plugins/router', 'templateSettings', 'data/dataContext', 'eventManager', 'progress/progressContext', 'constants'],
    function (router, templateSettings, dataContext, eventManager, progressContext, constants) {

        var actor = null;
        var activity = null;
        var subscriptions = [];
        var currentUser = ko.observable();
        var attemptId = progressContext.get().attemptId;

        // enable state of xApi module. Will be false if xApi was switched off (skiped).
        var enabled = ko.observable(templateSettings.xApi.enabled);

        var xApi = {
            currentUser: currentUser,
            enabled: enabled,

            init: init,
            startReporting: startReporting,
            stopReporting: stopReporting,
            restart: restart
        };

        return xApi;

        function init() {
            // configure xapi wrapper to use specified lrs.
            var lrsConfiguration = {
                endpoint: templateSettings.xApi.lrs.uri,
                user: templateSettings.xApi.lrs.credentials.username,
                password: templateSettings.xApi.lrs.credentials.password
            };

            ADL.XAPIWrapper.changeConfig(lrsConfiguration);

            // configure global xapi error handler
            ADL.xhrRequestOnError = onXapiError;
        }

        function startReporting(name, email) {
            currentUser({ username: name, email: email });
            enabled(true);

            // initialize actor for current learner. Will be used for all statements.
            actor = new ADL.XAPIStatement.Agent('mailto:' + email, name);

            // initialize activity for current learnerer path. Will be used for all statements.
            activity = new ADL.XAPIStatement.Activity(document.URL.replace(/#.*$/, ""), dataContext.learningPath.title);

            // subscribe for learner path events
            subscriptions.push(eventManager.subscribeForEvent(eventManager.events.learningPathStarted).then(onLearningPathStarted));
            subscriptions.push(eventManager.subscribeForEvent(eventManager.events.learningPathFinished).then(onLearningPathFinished));
        }

        function clearSubscriptions() {
            _.each(subscriptions, function (subscription) {
                if (subscription && subscription.off) {
                    subscription.off();
                }
            });
            subscriptions = [];
        }

        function stopReporting() {
            enabled(false);
            clearSubscriptions();
        }

        function restart() {
            currentUser(null);
            clearSubscriptions();
        }

        function onLearningPathStarted() {
            // send started statement
            var startedVerb = new ADL.XAPIStatement.Verb("http://adlnet.gov/expapi/verbs/launched", "started");
            var startedStatement = getActivityStatement(startedVerb);
            sendStatementIfAllowed(startedStatement);
        }

        function onLearningPathFinished() {
            // send passed/failed statement
            var resultScore = dataContext.learningPath.getScore();
            var resultVerb = resultScore === 100 ? ADL.verbs.passed : ADL.verbs.failed;
            var resultStatement = getActivityStatement(resultVerb);
            resultStatement.result = { score: resultScore };
            sendStatementIfAllowed(resultStatement);

            // send stopped statement
            var finishedVerb = new ADL.XAPIStatement.Verb("http://adlnet.gov/expapi/verbs/exited", "stopped");
            var finishedStatement = getActivityStatement(finishedVerb);
            sendStatementIfAllowed(finishedStatement);
        }

        function sendStatementIfAllowed(statement) {
            if (_.contains(templateSettings.xApi.allowedVerbs, statement.verb.display["en-US"])) {
                ADL.XAPIWrapper.sendStatement(statement);
            }
        }

        function getActivityStatement(verb) {
            var activityStatement = new ADL.XAPIStatement(actor, verb, activity);
            activityStatement.context = {
                registration: attemptId,
                extensions: {}
            };
            activityStatement.timestamp = (new Date()).toISOString();
            activityStatement.context.extensions[constants.xApi.extenstionKeys.learningPathId] = dataContext.learningPath.id;
            return activityStatement;
        }

        function onXapiError(xhr, method, url, callback, callbackargs) {
            setTimeout(function () {
                router.navigate('xapierror');
            }, 0);
        }
    });
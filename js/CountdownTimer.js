'use strict';

var CountdownTimer = function (timerElement, timeLimitInSeconds, handleAnswers) {
    var initialTimeLimit = timeLimitInSeconds;
    var timerCounter = timeLimitInSeconds;
    var intervalObj = null;

    function start() {
        if (!intervalObj) {
            timerCounter = initialTimeLimit;

            intervalObj = setInterval(function () {
                timerCounter -= 0.1;

                if (timerCounter <= 0) {
                    timerCounter = 0;
                    clearInterval(intervalObj);
                    handleAnswers();
                }

                timerElement.innerHTML = timerCounter.toFixed(1);
            }, 100)
        }
    }

    function stop() {
        if (intervalObj) {
            clearInterval(intervalObj);
            intervalObj = null;
        }
    }

    function deductTime(seconds) {
        if (timerCounter <= 0) {
            timerCounter = 0;
        } else {
            timerCounter -= seconds;
        }
    }

    function getTimerCounter() {
        return timerCounter;
    }

    return {
        start: start,
        stop: stop,
        deductTime: deductTime,
        getTimerCounter: getTimerCounter
    }
};
'use strict';
var PointSystem = function () {
    var TIME_LEFT_POINTS_MULTIPLIER = 10;

    var points = 0;
    var currentHighScore = '';

    function getPoints() {
        return points;
    }

    function getHighScore(endlessMode) {
        if (endlessMode) {
            currentHighScore = localStorage.getItem('highScore_endless');
        } else {
            currentHighScore = localStorage.getItem('highScore_normal');
        }

        return currentHighScore || 0;
    }

    function addPoints(currentPoints, isSeconds, answersInARowMultiplier) {
        if (isSeconds) {
            currentPoints = convertSecondsToPoints(currentPoints);
        }

        return points += (currentPoints * answersInARowMultiplier);
    }

    function convertSecondsToPoints(seconds) {
        return Math.round(seconds) * TIME_LEFT_POINTS_MULTIPLIER;
    }

    // Sets a new high score returns true if the player has beaten the old one.
    function saveHighScore(endlessMode) {
        if (points > currentHighScore) {

            if (endlessMode) {
                localStorage.setItem('highScore_endless', points);
            } else {
                localStorage.setItem('highScore_normal', points);
            }
        }
    }

    function reset() {
        points = 0;
    }

    return {
        getPoints: getPoints,
        getHighScore: getHighScore,
        addPoints: addPoints,
        saveHighScore: saveHighScore,
        reset: reset
    }
};
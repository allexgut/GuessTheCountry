'use strict';

var game = (function () {
    var gameObj = this;

    // constants

    var GAME_DOM_ELEMENTS = {
        answersInARow: document.getElementById('answers-in-a-row'),
        countryFlag: document.getElementById('current-country-flag'),
        countryName: document.getElementById('current-country-name'),
        gameModeButton: document.getElementById('endless-mode'),
        gameWrapper: document.getElementById('game-wrapper'),
        gameOverWrapper: document.getElementById('game-over-wrapper'),
        gameOverHighScore: document.getElementById('game-over-high-score'),
        highScore: document.getElementById('high-score'),
        howToPlayButton: document.getElementById('how-to-play'),
        howToPlayWrapper: document.getElementById('how-to-play-wrapper'),
        inccorectAnswers: document.getElementById('incorrect-answers'),
        incorrectAnswersWrapper: document.getElementById('incorrect-answers-wrapper'),
        multiplier: document.getElementById('multiplier'),
        multiplierWrapper: document.getElementById('multiplier-wrapper'),
        points: document.getElementById('points'),
        preloaderProgressBar: document.getElementById('preloader-progress-bar'),
        preloaderPercentages: document.getElementById('preloader-percentages'),
        progressWrapper: document.getElementById('progress-wrapper'),
        progressTotal: document.getElementById('progress-total'),
        progressCurrent: document.getElementById('progress-current'),
        restartGameButton: document.getElementById('restart-game'),
        startGameCountdown: document.getElementById('start-game-countdown'),
        startGameButton: document.getElementById('start-game'),
        timer: document.getElementById('timer'),
        tutorialWrapper: document.getElementById('tutorial-wrapper'),
        yourScore: document.getElementById('game-over-your-score')
    };

    var START_TIMER_SECONDS = 10.1;
    var WRONG_CHARACTER_PENALTY_IN_POINTS = 2;
    var CORRECT_ANSWER_POINTS = 10;
    var MAX_WRONG_ANSWERS_COUNT = 3;
    var ANSWERS_IN_A_ROW_BONUS_COUNT = 3;

    var AUDIO_EFFECTS = {
        rightAnswer: new Audio('sounds/right_answer.mp3'),
        wrongAnswer: new Audio('sounds/wrong_answer.mp3'),
        wrongCharacter: new Audio('sounds/wrong_character.mp3')
    }


    // variables
    var allCountries = [];
    var countries = [];
    var currentCountryIndex = -1;
    var currentCharacterIndex = 0;
    var currentCountryObj = {};
    var endlessMode = false;
    var wrongAnswersCount = 0;

    var answersInARowMultiplier = 1;
    var answersInARowCounter = 0;

    var countdownTimer = new CountdownTimer(GAME_DOM_ELEMENTS.timer, START_TIMER_SECONDS, handleAnswers);
    var pointSystem = new PointSystem();

    // methods
    function init() {
        var request = new XMLHttpRequest();
        request.open('GET', 'countries.json');

        request.onload = function () {
            if (request.status === 200) {
                allCountries = JSON.parse(request.responseText);
                var imageCounter = 0;

                for (var i = 0; i < allCountries.length; i++) {
                    var img = new Image();
                    img.onload = function () {
                        imageCounter += 1;
                        var currPercentage = Math.round((imageCounter / allCountries.length) * 100) + '%';

                        GAME_DOM_ELEMENTS.preloaderProgressBar.style.width = currPercentage;
                        GAME_DOM_ELEMENTS.preloaderPercentages.innerHTML = currPercentage;

                        if (imageCounter === allCountries.length) {
                            setTimeout(function () {
                                document.getElementsByTagName("body")[0].className += ' loaded';
                            }, 1000);
                        }
                    }

                    img.src = allCountries[i]['imageUrl'];

                }

                shuffle(allCountries);
                countries = allCountries.slice(0, 10);

                document.addEventListener('keydown', keyDownHandler, false);
                GAME_DOM_ELEMENTS.progressTotal.innerHTML = '/' + countries.length;
                GAME_DOM_ELEMENTS.progressCurrent.innerHTML = currentCountryIndex + 1;
                GAME_DOM_ELEMENTS.timer.innerHTML = (START_TIMER_SECONDS - 0.1).toFixed(1);
                GAME_DOM_ELEMENTS.startGameButton.addEventListener('click', startGame, false);
                GAME_DOM_ELEMENTS.restartGameButton.addEventListener('click', function () { location.reload(); }, false);
                GAME_DOM_ELEMENTS.howToPlayButton.addEventListener('click', showTutorial, false);
                GAME_DOM_ELEMENTS.gameModeButton.addEventListener('click', changeGameMode, false);
                GAME_DOM_ELEMENTS.highScore.innerHTML = pointSystem.getHighScore(endlessMode);
                GAME_DOM_ELEMENTS.multiplier.innerHTML = answersInARowMultiplier;
            } else {
                console.log(request.statusText);
            }
        };

        request.send();
    }

    function startGame() {
        showGameUiElements();
        pointSystem.reset();

        var n = 3;
        GAME_DOM_ELEMENTS.startGameCountdown.innerHTML = n;

        setTimeout(countDown, 1000);

        // Countdown before game start
        function countDown() {
            n--;
            if (n > 0) {
                GAME_DOM_ELEMENTS.startGameCountdown.innerHTML = n;
                setTimeout(countDown, 1000);
            } else {
                GAME_DOM_ELEMENTS.startGameCountdown.innerHTML = '';
                GAME_DOM_ELEMENTS.countryFlag.style.display = 'block';
                loadNewCountry();
                countdownTimer.start();
            }
        }
    }

    function gameOver() {
        GAME_DOM_ELEMENTS.gameOverWrapper.style.top = 0;
        document.removeEventListener('keydown', keyDownHandler, false);

        pointSystem.saveHighScore(endlessMode);
        GAME_DOM_ELEMENTS.gameOverHighScore.innerHTML = pointSystem.getHighScore(endlessMode)
        GAME_DOM_ELEMENTS.yourScore.innerHTML = pointSystem.getPoints();

        countdownTimer.stop();
    }

    function showGameUiElements() {
        if (!endlessMode) {
            GAME_DOM_ELEMENTS.multiplierWrapper.style.display = 'none';
            GAME_DOM_ELEMENTS.incorrectAnswersWrapper.style.display = 'none';
        } else {
            GAME_DOM_ELEMENTS.progressWrapper.style.display = 'none';
        }

        GAME_DOM_ELEMENTS.gameWrapper.style.display = 'block';
        GAME_DOM_ELEMENTS.startGameButton.style.display = 'none';
        GAME_DOM_ELEMENTS.howToPlayButton.style.display = 'none';
        GAME_DOM_ELEMENTS.tutorialWrapper.style.display = 'none';
        GAME_DOM_ELEMENTS.howToPlayWrapper.style.display = 'none';
        GAME_DOM_ELEMENTS.gameModeButton.style.display = 'none';
    }

    function handleAnswers() {
        if (endlessMode) {
            wrongAnswersCount++;

            if (answersInARowMultiplier > 1) {
                answersInARowMultiplier--;
                GAME_DOM_ELEMENTS.multiplier.innerHTML = answersInARowMultiplier;
            }

            GAME_DOM_ELEMENTS.inccorectAnswers.innerHTML = MAX_WRONG_ANSWERS_COUNT - wrongAnswersCount;

            if (wrongAnswersCount === MAX_WRONG_ANSWERS_COUNT) {
                gameOver();
            } else {
                AUDIO_EFFECTS.wrongAnswer.play();
                loadNewCountry();

                countdownTimer.stop();
                countdownTimer.start();
            }

        } else {
            gameOver();
        }
    }

    function loadNewCountry() {
        currentCountryIndex++;

        if (currentCountryIndex === countries.length) {
            return gameOver();
        }

        GAME_DOM_ELEMENTS.progressCurrent.innerHTML = currentCountryIndex;
        currentCountryObj = countries[currentCountryIndex];
        currentCharacterIndex = 0;

        var currentCountryFlagUrl = currentCountryObj['imageUrl'];
        var currentCountryName = currentCountryObj['name'];

        // Create an array with the same amount of underscores, wrapped in spans, as the letter count.
        var currentCountryDashes = Array(currentCountryName.length + 1).join("<span>_</span>");

        GAME_DOM_ELEMENTS.countryName.innerHTML = currentCountryDashes;
        GAME_DOM_ELEMENTS.countryFlag.src = currentCountryFlagUrl;

        GAME_DOM_ELEMENTS.countryName.childNodes[0].className = 'currentLetter';
    }

    function keyDownHandler(e) {
        var currentCountryName = currentCountryObj['name'];

        if (e.which <= 90 && e.which >= 65 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            var currentCharacter = String.fromCharCode(e.which);

            // check if the currently pressed letter is the right one
            if (currentCharacter.toLowerCase() == currentCountryName[currentCharacterIndex].toLowerCase()) {
                GAME_DOM_ELEMENTS.countryName.childNodes[currentCharacterIndex].innerHTML = currentCharacter;
                GAME_DOM_ELEMENTS.countryName.childNodes[currentCharacterIndex].className = '';
                currentCharacterIndex++;

                // if the player has reached the end of the word,  he's guessed it
                if (currentCharacterIndex == currentCountryName.length) {
                    countryGuessed();
                } else {
                    GAME_DOM_ELEMENTS.countryName.childNodes[currentCharacterIndex].className = 'currentLetter';
                }
            } else {
                incorrectCharacter();
            }
        }
    }

    function countryGuessed() {
        AUDIO_EFFECTS.rightAnswer.play();
        countdownTimer.stop();

        // I set a 200ms timeout so that the country doesn't immediately disappear after the user has guessed it.
        setTimeout(function () {
            if (endlessMode) {
                answersInARowCounter++;

                if (answersInARowCounter === ANSWERS_IN_A_ROW_BONUS_COUNT) {
                    answersInARowCounter = 0;

                    answersInARowMultiplier++;
                    GAME_DOM_ELEMENTS.multiplier.innerHTML = answersInARowMultiplier;
                }
            }

            pointSystem.addPoints(countdownTimer.getTimerCounter(), true, answersInARowMultiplier);
            pointSystem.addPoints(CORRECT_ANSWER_POINTS, false, answersInARowMultiplier);
            GAME_DOM_ELEMENTS.points.innerHTML = pointSystem.getPoints();

            loadNewCountry();
            countdownTimer.start();
        }, 200);
    }

    function incorrectCharacter() {
        AUDIO_EFFECTS.wrongCharacter.play();
        countdownTimer.deductTime(WRONG_CHARACTER_PENALTY_IN_POINTS);
    }

    function changeGameMode() {
        if (!endlessMode) {
            endlessMode = true;
            countries = allCountries;
            GAME_DOM_ELEMENTS.highScore.innerHTML = pointSystem.getHighScore(endlessMode);

            GAME_DOM_ELEMENTS.gameModeButton.className = 'pressed';
        } else {
            endlessMode = false;
            GAME_DOM_ELEMENTS.highScore.innerHTML = pointSystem.getHighScore(endlessMode);

            shuffle(allCountries);
            countries = allCountries.slice(0, 10);
            GAME_DOM_ELEMENTS.gameModeButton.className = '';
        }
    }

    function showTutorial() {
        GAME_DOM_ELEMENTS.howToPlayButton.style.display = 'none';
        GAME_DOM_ELEMENTS.howToPlayWrapper.style.display = 'block';
        GAME_DOM_ELEMENTS.tutorialWrapper.style.display = 'none';
        GAME_DOM_ELEMENTS.answersInARow.innerHTML = ANSWERS_IN_A_ROW_BONUS_COUNT;

    }

    /**
    * This block of code is not mine. (I didn't invent a shuffle algorithm :D) 
    * I found it here: http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
    *
    * Shuffles array in place.
    * @param {Array} a items The array containing the items.
    */
    function shuffle(a) {
        var j, x, i;
        for (i = a.length; i; i -= 1) {
            j = Math.floor(Math.random() * i);
            x = a[i - 1];
            a[i - 1] = a[j];
            a[j] = x;
        }
    }

    return {
        init: init
    }
})();
let currentState = 'start';
let goalText = '';
let timeInMinutes = 0;
let endTime = 0;



document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('startButton').addEventListener('click', startGoal);
    document.getElementById('exitButton').addEventListener('click', exitGoal);
    document.getElementById('newGoalButton').addEventListener('click', resetToStart);

    const lockLogo = document.getElementById('lockLogo');
    const startButton = document.getElementById('startButton');

    startButton.addEventListener('mouseenter', function() {
        lockLogo.classList.add('unlocked');
    });

    startButton.addEventListener('mouseleave', function() {
        lockLogo.classList.remove('unlocked');
    });

    chrome.storage.local.get(['goalText', 'endTime'], function(result) {
        if (result.goalText && result.endTime) {
            goalText = result.goalText;
            endTime = result.endTime;
            updateActivePage();
        }
    });
});


function startGoal() {
    goalText = document.getElementById('goalInput').value;
    timeInMinutes = parseFloat(document.getElementById('timeInput').value);
    
    if (goalText && timeInMinutes > 0) {
        endTime = Date.now() + timeInMinutes * 60 * 1000;
        chrome.storage.local.set({ goalText: goalText, endTime: endTime });
        chrome.runtime.sendMessage({action: "setTimer", endTime: endTime});
        updateActivePage();
    } else {
        alert('Please enter a valid goal and time.');
    }
}

function updateActivePage() {
    setPageState('active');
    document.getElementById('activeGoal').textContent = `${goalText}`;
    updateTimer();
}

function updateTimer() {
    let timeLeft = Math.max(0, endTime - Date.now());
    let minutes = Math.floor(timeLeft / 60000);
    let seconds = Math.floor((timeLeft % 60000) / 1000);
 
    document.getElementById('timeLeft').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (timeLeft > 0) {
        setTimeout(updateTimer, 1000);
    }
}

function exitGoal() {
    chrome.storage.local.remove(['goalText', 'endTime']);
    chrome.runtime.sendMessage({action: "clearTimer"});
    resetToStart();
}

function showPopup(message) {
    setPageState('popup');
    document.getElementById('popupMessage').textContent = message;
}

function closePopup() {
    setPageState('active');
}

function showEndPage() {
    setPageState('end');
    document.getElementById('completionMessage').textContent = `"${goalText}" completed!`;
}

function resetToStart() {
    setPageState('start');
    document.getElementById('goalInput').value = '';
    document.getElementById('timeInput').value = '';
}

function setPageState(state) {
    currentState = state;
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(`${state}Page`).classList.add('active');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "timerEnded") {
        showEndPage();
    }
});
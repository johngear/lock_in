// this page runs when the User opens the Extension

let currentState = 'start';
let goalText = '';
let timeInMinutes = 0;
let endTime = 0;
let timerInterval;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners

    // If they are clicked, functions will be called
    document.getElementById('startButton').addEventListener('click', startGoal);
    document.getElementById('exitButton').addEventListener('click', exitGoal);
    document.getElementById('newGoalButton').addEventListener('click', resetToStart);

    // Check if there's an active goal
    chrome.storage.local.get(['goalText', 'endTime'], function(result) {
        if (result.goalText && result.endTime) {
            goalText = result.goalText;
            endTime = result.endTime;
            updateActivePage();
        }
    });
});

// Start our goal
function startGoal() {
    
    // Get the goal from the input box
    goalText = document.getElementById('goalInput').value;
    
    // timeInMinutes = parseInt(document.getElementById('timeInput').value); // old logic here
    timeInMinutes = parseFloat(document.getElementById('timeInput').value);
    
    if (goalText && timeInMinutes > 0) {
        endTime = Date.now() + timeInMinutes * 60 * 1000;
        chrome.storage.local.set({ goalText: goalText, endTime: endTime });
        updateActivePage();
    } else {
        alert('Please enter a valid goal and time.');
    }
}

function updateActivePage() {
    setPageState('active');
    document.getElementById('activeGoal').textContent = `Getting "${goalText}" done`;
    updateTimer();

    // runs update timer every second
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    let timeLeft = Math.max(0, endTime - Date.now());
    let minutes = Math.floor(timeLeft / 60000);
    let seconds = Math.floor((timeLeft % 60000) / 1000);
 
    document.getElementById('timeLeft').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        
        // perhaps this cannot run
        showEndPage();
    }
}

function showChromeNotification(message) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "images/icon128.png",
      title: "Focus Bot Reminder",
      message: message
    });
  }

function exitGoal() {
    clearInterval(timerInterval);
    chrome.storage.local.remove(['goalText', 'endTime']);
    // change the state back to start
    resetToStart();
}

function showPopup(message) {
    setPageState('popup');
    document.getElementById('popupMessage').textContent = message;
    alert('get back on track');
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

// Communication with background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showPopup") {
        showPopup(request.message);
    }
});



async function fetchData(goalText) {

    const CEREBRAS_API_KEY = ''
  
    const requestData = {
      model: "llama3.1-8b",
      stream: false,
      messages: [{"content": goalText, "role": "user"}],
      prompt: "",
      temperature: 0,
      stop_sequence: "",
      max_tokens: -1,
      seed: 0,
      top_p: 1
    };
  
    try {
      const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CEREBRAS_API_KEY}`
        },
        body: JSON.stringify(requestData)
      });
  
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
  
      const record = await res.json();
      console.log("API Response:", record);
      console.log(record.choices[0].message.content);

    //   document.getElementById('apiReturn').textContent = `response ${record.choices[0].message.content}`;
  
      if (record.choices && record.choices.length > 0) {
        return record.choices[0].message.content;
      } else {
        throw new Error("No response generated.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }
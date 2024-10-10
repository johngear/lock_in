// Global variable to store the user's goal
let userGoal = '';

// Initialize userGoal when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ userGoal: '' });
});

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    checkFocus(tab.url);
  });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    checkFocus(tab.url);
    // Check relevance and send message to content script
    chrome.storage.local.get('userGoal', (data) => {
      if (data.userGoal) {
        chrome.tabs.sendMessage(tabId, { 
          action: "checkRelevance",
          goal: data.userGoal
        });
      }
    });
  }
});

// Check if the current URL is relevant to the user's goal
function checkFocus(url) {
  chrome.storage.local.get('userGoal', (data) => {
    if (data.userGoal && !isRelevantToTask(url, data.userGoal)) {
      notifyUser();
    }
  });
}

// Determine if the URL is relevant to the user's goal
function isRelevantToTask(url, goal) {
  // This is a placeholder function. In a real implementation,
  // you would use more sophisticated logic to determine if a URL is relevant to the goal.

  // TODO: Add the output of our cURL request here. 
  // Implement logic based on the cURL response:
  // - If the response begins with "Nothing", do nothing
  // - If "Nudge", then call notifyUser()
  // - If "Ask", then prompt the user for input

  // For now, we're using a simple string inclusion check
  return url.toLowerCase().includes(goal.toLowerCase());
}

// Send notification to the user
function notifyUser() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: "remind"});
  });
}

// Get all open tabs
function getAllOpenTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      resolve(tabs.map(tab => ({
        title: tab.title,
        url: tab.url
      })));
    });
  });
}

// Get recent browsing history
function getRecentHistory(maxResults = 10) {
  return new Promise((resolve) => {
    chrome.history.search({text: '', maxResults: maxResults}, (historyItems) => {
      resolve(historyItems.map(item => ({
        title: item.title,
        url: item.url,
        visitTime: new Date(item.lastVisitTime)
      })));
    });
  });
}

// Listen for messages from the popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.action) {
    case "getOpenTabs":
      getAllOpenTabs().then(tabs => sendResponse({tabs: tabs}));
      return true;  // Indicates we wish to send a response asynchronously
    case "getRecentHistory":
      getRecentHistory().then(history => sendResponse({history: history}));
      return true;  // Indicates we wish to send a response asynchronously
    case "setGoal":
      userGoal = request.goal;
      chrome.storage.local.set({ userGoal: userGoal });
      break;
  }
});


// THIS MAYB WORKS THIS MAYB WORKS 

function sendMessageToActiveTab(message, isTimerExpired = false) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "showMessage",
        message: message,
        isTimerExpired: isTimerExpired
      });
    }
  });
}

// Function to handle API calls for task reminders
async function getTaskReminderMessage(goal) {
  // Implement your API call here
  // For now, we'll return a placeholder message
  return `Hey, get back on track for your task: "${goal}"`;
}

// Use this function when you need to show a task reminder
async function showTaskReminder(goal) {
  const message = await getTaskReminderMessage(goal);
  sendMessageToActiveTab(message);
}

// Use this function when the timer expires
function notifyTimerExpired() {
  sendMessageToActiveTab("Your time is up! Great job focusing on your task.", true);
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "timerExpired") {
    notifyTimerExpired();
  } else if (request.action === "checkFocus") {
    showTaskReminder(request.goal);
  }
});

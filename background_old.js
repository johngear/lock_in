let userTask = '';

// listen for the user task that will b input via the box
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ userTask: '' });
});

// listens for the active tab that the user is on
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    checkFocus(tab.url);
  });
});

// seems like a different case where the tab can change and we want to update this
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    checkFocus(tab.url);
  }
});

// this function will ultimately check if the new URL is relevant to the GOAL
// and it will notify the user if it suspects it is not
function checkFocus(url) {
  chrome.storage.local.get('userTask', (data) => {
    if (data.userTask && !isRelevantToTask(url, data.userTask)) {
      notifyUser();
    }
  });
}

// determine if the user  
function isRelevantToTask(url, task) {
  // This is a placeholder function. In a real implementation,
  // you would use more sophisticated logic to determine if a URL is relevant to the task.

  // TODO add the output of our cURL request here. 

  // something like
  // if the begining if Nothing, do nothing
  // if Nudge, then nudge
  // if Ask, then Ask

  return url.toLowerCase().includes(task.toLowerCase());
}

// send notification to the user
function notifyUser() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: "remind"});
  });
}

// New function to get all open tabs
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

// New function to get recent history
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

// Example usage of these functions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getOpenTabs") {
    getAllOpenTabs().then(tabs => sendResponse({tabs: tabs}));
    return true;  // Indicates we wish to send a response asynchronously
  } else if (request.action === "getRecentHistory") {
    getRecentHistory().then(history => sendResponse({history: history}));
    return true;
  }
});



// tbh i still do not fully understand what is happeneing below this but we need it for the
// notifications to pop up 

let userGoal = '';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ userGoal: '' });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getOpenTabs") {
    chrome.tabs.query({}, (tabs) => {
      sendResponse({tabs: tabs.map(tab => ({title: tab.title, url: tab.url}))});
    });
    return true;
  } else if (request.action === "setGoal") {
    userGoal = request.goal;
    chrome.storage.local.set({ userGoal: userGoal });
  }
});
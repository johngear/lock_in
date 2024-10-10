let timerInterval;
let endTime;
let goalText = '';
const CEREBRAS_API_KEY = 'csk-py9ptvh6eyy434evke2tc39t58p3dx6v3r9epkjx5txvhpyv'
let isTimerActive = false;

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['endTime'], function(result) {
        if (result.endTime) {
            endTime = result.endTime;
            startTimer();
        }
    });
});

function initializeUserGoal() {
    chrome.storage.local.get(['goalText'], function(result) {
      goalText = result.goalText || 'No goal set';
    });
  }

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(checkTimer, 1000);
    initializeUserGoal();
    isTimerActive = true;
}

function checkTimer() {
    let timeLeft = Math.max(0, endTime - Date.now());
    
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        chrome.runtime.sendMessage({action: "timerEnded"});
        showChromeNotification("Focus Bot","Time's up!");
        isTimerActive = false;
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "setTimer") {
        endTime = request.endTime;
        chrome.storage.local.set({endTime: endTime});
        startTimer();
    } else if (request.action === "clearTimer") {
        isTimerActive = false;
    }
});

function showChromeNotification(title, message) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "images/new_icon128.png",
      title: title,
      message: message
    });
}

chrome.tabs.onActivated.addListener((activeInfo) => {
    if (isTimerActive) {
        console.log("isTimerActive is true");
        chrome.tabs.query({}, (tabs) => {
            const openTabUrls = tabs.map(tab => tab.url);
            chrome.tabs.get(activeInfo.tabId, (activeTab) => {
                fetchData(activeTab.url, openTabUrls.join(','));
            });
        });
    }
});

async function fetchData(currentURL,openUrls) {


    let prompt = `You are a productivity assistant. You will receive the following:
            - a USER GOAL that is being achieved over X minutes
            - the current URL of the user
            - a list of all URLs that are open in Chrome
            
            You will be called each time the Current URL changes.

            You will respond with one of the following:
            - Nudge. and a short message. If the current URL the user just clicked on does not seem relevant to the goal. This will trigger a little popup (so you have to start with "Nudge") and show the message, which encourages the user to get back on task. Twitter and Reddit are always bad. Pages with chrome:// are good. Chatgpt and Claude are good. Example "Hey you just clicked on URL, why don't you get back to your GOAL USER GAVE".
            - Nothing. We don't want to bother our user, since this is for productivity. So if they seem to be working on their goal, you don't need to return anything!
            
            User Goal: ${goalText}
            Current URL: ${currentURL}
            All URLs: ${openUrls}`
    // console.log(prompt);
    const requestData = {
      model: "llama3.1-70b",
      stream: false,
      messages: [{"content": prompt, "role": "user"}],
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

      console.log(`currentURL: ${currentURL}`);
      console.log(record.choices[0].message.content);
      
  
      if (record.choices && record.choices.length > 0) {

        if (record.choices[0].message.content.startsWith("Nudge")){

            showChromeNotification("Nudge", record.choices[0].message.content.slice(6))
        }

      } else {
        throw new Error("No response generated.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }
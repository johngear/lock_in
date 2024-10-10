let timerInterval;
let endTime;

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['endTime'], function(result) {
        if (result.endTime) {
            endTime = result.endTime;
            startTimer();
        }
    });
});

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(checkTimer, 1000);
}

function checkTimer() {
    let timeLeft = Math.max(0, endTime - Date.now());
    
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        chrome.runtime.sendMessage({action: "timerEnded"});
        showChromeNotification("Time's up!");
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "setTimer") {
        endTime = request.endTime;
        chrome.storage.local.set({endTime: endTime});
        startTimer();
    }
});

function showChromeNotification(message) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "images/icon128.png",
      title: "Focus Bot Reminder",
      message: message
    });
}
  
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
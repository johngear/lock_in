// CAN BE INJECTED INTO EVERY WEB PAGE
// This is how we will send the Pop Up messages for Out of Time, and Get Back on Task



// this is listening to the Background Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showMessage") {
    showMessage(request.message);
  }
});


function showMessage(message) {
  const popupDiv = document.createElement('div');
  popupDiv.innerHTML = `
    <div style="position: fixed; top: 10px; right: 10px; z-index: 9999; background-color: white; border: 2px solid black; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.5); color: black;">
      <h2>Focus Bot Reminder</h2>
      <p>${message}</p>
      <button id="closeMessagePopup">Close</button>
    </div>
  `;
  document.body.appendChild(popupDiv);

  popupDiv.querySelector('#closeMessagePopup').addEventListener('click', () => {
    popupDiv.remove();
  });
}

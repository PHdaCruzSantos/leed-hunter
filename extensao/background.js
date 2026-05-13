chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

//para visualizar informações de saida de outros arquivos pelo dev tools do background no navegador
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "DEBUG_LOG") {
    console.log("LOG DO SCRAPER:", message.dados);
  }
});
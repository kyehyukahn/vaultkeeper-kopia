const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kopiaUI", {
  selectDirectory: function (onSelected) {
    ipcRenderer.invoke("select-dir").then((v) => {
      onSelected(v);
    });
  },
  browseDirectory: function (path) {
    ipcRenderer.invoke("browse-dir", path);
  },
});

// VaultKeeper bridge — htmlui(renderer) ↔ Electron main 통신용.
// 로그인 상태의 backend API Key 를 main 으로 전달 → electron-updater 의
// requestHeaders 주입 + 트레이 "Check For Updates Now" 활성/비활성 토글.
contextBridge.exposeInMainWorld("vaultkeeper", {
  setApiKey: function (apiKey) {
    if (typeof apiKey === "string" && apiKey) {
      ipcRenderer.send("vaultkeeper:set-api-key", apiKey);
    }
  },
  clearApiKey: function () {
    ipcRenderer.send("vaultkeeper:clear-api-key");
  },
});

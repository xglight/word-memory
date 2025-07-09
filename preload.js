const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('wordMemoryAPI', {
  // 获取当前单词表
  getWordCurrentList: async () => ipcRenderer.invoke('getWordCurrentList'),
  // 修改单词表
  updateWordList: async (wordList) => ipcRenderer.invoke('updateWordList', wordList),
  // 获取单词列表
  getWords: async () => ipcRenderer.invoke('getWords'),
})

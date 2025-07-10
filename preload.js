const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('wordMemoryAPI', {
  // 获取全部单词表
  getWordLists: async () => ipcRenderer.invoke('getWordLists'),
  // 获取当前单词表
  getWordCurrentList: async () => ipcRenderer.invoke('getWordCurrentList'),
  // 修改当前单词表
  setCurrentWordList: async (wordList) => ipcRenderer.invoke('setCurrentWordList', wordList),
  // 获取单词列表
  getWords: async (page = 0, pageSize = 20) => ipcRenderer.invoke('getWords', page, pageSize),
  // 获取 config
  getConfig: async () => ipcRenderer.invoke('getConfig'),
  // 朗读单词
  speak: async (text, voiceType = 'en') => ipcRenderer.invoke('speak', { text, voiceType }),
  // 标记为收藏
  changeLove: async (word) => ipcRenderer.invoke('changeLove', word),
  // 标记为简单
  changeEasy: async (word) => ipcRenderer.invoke('changeEasy', word),
  // 标记为困难
  changeHard: async (word) => ipcRenderer.invoke('changeHard', word),
})

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})
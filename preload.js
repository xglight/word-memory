const { contextBridge, ipcRenderer } = require('electron')

// 拦截所有链接点击，通过主进程在外部浏览器打开
document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', (e) => {
    let target = e.target
    // 向上查找a标签
    while (target && target.tagName !== 'A' && target !== document.body) {
      target = target.parentElement
    }

    if (target && target.tagName === 'A' && target.href) {
      e.preventDefault()
      e.stopPropagation()
      ipcRenderer.invoke('open-external', target.href).catch(err => {
        console.error('打开外部链接失败:', err)
      })
    }
  })
})

contextBridge.exposeInMainWorld('wordMemoryAPI', {
  // 最小化窗口
  minimize: async () => ipcRenderer.invoke('window:minimize'),
  // 最大化窗口
  maximize: async () => ipcRenderer.invoke('window:maximize'),
  // 关闭窗口
  close: async () => ipcRenderer.invoke('window:close'),
  // 切换主题
  toggle: async () => ipcRenderer.invoke('dark-mode:toggle'),
  // 切换系统主题
  system: async () => ipcRenderer.invoke('dark-mode:system'),
  // 切换到亮色
  light: async () => ipcRenderer.invoke('dark-mode:light'),
  // 切换到暗色
  dark: async () => ipcRenderer.invoke('dark-mode:dark'),
  // 获取当前主题
  getMode: async () => ipcRenderer.invoke('dark-mode:getMode'),
  // 获取全部单词表
  getWordLists: async () => ipcRenderer.invoke('getWordLists'),
  // 获取当前单词表
  getWordCurrentList: async () => ipcRenderer.invoke('getWordCurrentList'),
  // 修改当前单词表
  setCurrentWordList: async (wordList) => ipcRenderer.invoke('setCurrentWordList', wordList),
  // 修改单词表状态
  toggleWordListState: async (wordList, visible) => ipcRenderer.invoke('toggleWordListState', wordList),
  // 获取单词列表
  getWords: async (searchTerm = '', page = 0, pageSize = 20) => ipcRenderer.invoke('getWords', searchTerm, page, pageSize),
  // 获取 config
  getConfig: async () => ipcRenderer.invoke('getConfig'),
  //修改 word
  setWord: async (word) => ipcRenderer.invoke('setWord', { word }),
  // 修改 definition
  setDefinition: async (definition) => ipcRenderer.invoke('setDefinition', { definition }),
  // 修改 sound-type
  setSoundType: async (type) => ipcRenderer.invoke('setSoundType', { type }),
  // 修改默认主题
  setDefaultTheme: async (theme) => ipcRenderer.invoke('setDefaultTheme', { theme }),
  // 朗读单词
  speak: async (text, voiceType = 'en') => ipcRenderer.invoke('speak', { text, voiceType }),
  // 标记为收藏
  changeLove: async (word) => ipcRenderer.invoke('changeLove', word),
  // 标记为简单
  changeEasy: async (word) => ipcRenderer.invoke('changeEasy', word),
  // 标记为困难
  changeHard: async (word) => ipcRenderer.invoke('changeHard', word),
  // 搜索单词
})
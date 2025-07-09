const { ipcMain } = require('electron')
const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')
const fs = require('fs')

wordListPath = '.\\wordlist'

let currentWordList = 'example'

let words

function readWords() {
    const filePath = path.join(wordListPath, "words.json")
    const data = fs.readFileSync(filePath, 'utf-8')
    words = JSON.parse(data)
}

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html')
}

ipcMain.handle('getWordList', () => {
    return currentWordList
})

ipcMain.on('setWordList', (event, wordList) => {
    currentWordList = wordList
})

ipcMain.handle('getWords', () => {
    console.log(currentWordList)
    const filePath = path.join(wordListPath, currentWordList + '.json')
    const data = fs.readFileSync(filePath, 'utf-8')
    const wordList = JSON.parse(data)
    let result = []
    for (let i = 0; i < wordList.length; i++)
        result.push(words[wordList[i]])
    return result
})

app.whenReady().then(() => {
    readWords()
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
const { ipcMain } = require('electron')
const { app, BrowserWindow } = require('electron/main')
const { exec } = require('child_process')
const path = require('node:path')
const fs = require('fs/promises')
const ESPEAK_PATH = path.join(__dirname, 'espeak', 'bin', 'espeak.exe')

wordListPath = '.\\wordlist'

let currentWordList = 'example'

let words, config

async function init() {
    await readConfig()
    await readWords()
}

async function readConfig() {
    try {
        const data = await fs.readFile("config.json", 'utf-8')
        config = JSON.parse(data)
    } catch (e) {
        console.log(e);
        config = {
            "words": {
                "size": 14,
                "color": "#000000",
                "highlightColor": "#2196F3",
                "definition": "none",
                "sound": "none"
            },
            "wordLists": {
                "path": "wordList",
                "default": "example.json"
            }
        }
        await fs.writeFile("config.json", JSON.stringify(config, null, 2))
    }
    currentWordList = config.wordLists.default
    wordListPath = config.wordLists.path
}

async function readWords() {
    try {
        const filePath = path.join(wordListPath, "words.json")
        const loveFilePath = path.join(wordListPath, "love.json")
        const easyFilePath = path.join(wordListPath, "easy.json")
        const data = await fs.readFile(filePath, 'utf-8')

        words = JSON.parse(data)

        let loveData = JSON.parse(await fs.readFile(loveFilePath, 'utf-8'))
        let easyData = JSON.parse(await fs.readFile(easyFilePath, 'utf-8'))

        if (!loveData || typeof loveData !== 'object') {
            loveData = { name: '收藏单词', words: [] }
        }
        if (!easyData || typeof easyData !== 'object') {
            easyData = { name: '标记为简单单词', words: [] }
        }

        const loveSet = new Set(loveData.words)
        const easySet = new Set(easyData.words)

        for (const [word, info] of Object.entries(words)) {
            if (info.love) loveSet.add(word)
            else loveSet.delete(word)
            if (info.easy) easySet.add(word)
            else easySet.delete(word)
        }

        loveData.words = Array.from(loveSet)
        easyData.words = Array.from(easySet)

        await fs.writeFile(loveFilePath, JSON.stringify(loveData, null, 2))
        await fs.writeFile(easyFilePath, JSON.stringify(easyData, null, 2))
    } catch (e) {
        console.log(e);
    }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        titleBarStyle: 'hidden',
        ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html')
}

ipcMain.handle('getWordLists', async () => {
    const files = await fs.readdir(wordListPath)
    const wordLists = []
    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.endsWith('.json') && file !== 'words.json') {
            const data = await fs.readFile(path.join(wordListPath, file), 'utf-8')
            const name = JSON.parse(data).name
            const value = file.replace('.json', '')
            wordLists.push({ "value": value, "name": name })
        }
    }
    return wordLists
})

ipcMain.handle('getWordCurrentList', () => {
    return currentWordList
})

ipcMain.on('setWordList', (event, wordList) => {
    currentWordList = wordList
})

ipcMain.handle('updateWordList', async (event, wordList) => {
    currentWordList = wordList
    config.wordLists.default = wordList
    await fs.writeFile("config.json", JSON.stringify(config, null, 2))
    return true
})

ipcMain.handle('getWords', async (event, page = 0, pageSize = 20) => {
    const filePath = path.join(wordListPath, currentWordList + '.json')
    const data = await fs.readFile(filePath, 'utf-8')
    const wordList = JSON.parse(data).words
    let result = []
    const start = page * pageSize
    const end = Math.min(start + pageSize, wordList.length)
    for (let i = start; i < end; i++) {
        result.push(words[wordList[i]])
    }
    return {
        words: result,
        total: wordList.length,
        page,
        pageSize
    }
})

ipcMain.handle('getConfig', () => {
    return config
})

ipcMain.handle('speak', async (event, text) => {
    exec(`${ESPEAK_PATH} -s ${config.sound.speed} "${text}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing espeak:`, error)
            throw error
        }
    })
})

ipcMain.handle('changeLove', async (event, word) => {
    const loveFilePath = path.join(wordListPath, 'love.json')
    const wordsFilePath = path.join(wordListPath, 'words.json')

    try {
        const data = JSON.parse(await fs.readFile(wordsFilePath, 'utf-8'))

        const loveRaw = await fs.readFile(loveFilePath, 'utf-8')
        let loveData = JSON.parse(loveRaw)
        if (!loveData || typeof loveData !== 'object') {
            loveData = { name: '收藏单词', words: [] }
        }

        const loveSet = new Set(loveData.words)
        const isLoved = !!data[word].love
        if (isLoved) {
            loveSet.delete(word)
            data[word].love = false
            words[word].love = false
        } else {
            loveSet.add(word)
            data[word].love = true
            words[word].love = true
        }
        loveData.words = Array.from(loveSet)

        await fs.writeFile(loveFilePath, JSON.stringify(loveData, null, 2))
        await fs.writeFile(wordsFilePath, JSON.stringify(data, null, 2))

        return true
    } catch (error) {
        console.error('Error in changeLove:', error)
        throw error
    }
})



ipcMain.handle('changeEasy', async (event, word) => {
    const easyFilePath = path.join(wordListPath, 'easy.json')
    const wordsFilePath = path.join(wordListPath, 'words.json')

    try {
        const data = JSON.parse(await fs.readFile(wordsFilePath, 'utf-8'))

        const easyRaw = await fs.readFile(easyFilePath, 'utf-8')
        let easyData = JSON.parse(easyRaw)
        if (!easyData || typeof easyData !== 'object') {
            easyData = { name: '标记为简单单词', words: [] }
        }

        const easySet = new Set(easyData.words)
        const isEasy = !!data[word].easy
        if (isEasy) {
            easySet.delete(word)
            data[word].easy = false
            words[word].easy = false
        } else {
            easySet.add(word)
            data[word].easy = true
            words[word].easy = true
        }
        easyData.words = Array.from(easySet)

        await fs.writeFile(easyFilePath, JSON.stringify(easyData, null, 2))
        await fs.writeFile(wordsFilePath, JSON.stringify(data, null, 2))

        return true
    } catch (error) {
        console.error('Error in changeEasy:', error)
        throw error
    }
})



app.whenReady().then(async () => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
    await init()
})


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
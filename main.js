const { ipcMain } = require('electron')
const { app, BrowserWindow } = require('electron/main')
const { exec } = require('child_process')
const { promisify } = require('util')
const path = require('node:path')
const fs = require('fs/promises')
const execAsync = promisify(exec)
const ESPEAK_PATH = path.join(__dirname, 'espeak', 'bin', 'espeak.exe')

wordListsFolder = '.\\wordlist'

let currentWordList = 'example'

let words = {}, config

async function init() {
    await readConfig()
    await readWords()
}

async function readConfig() {
    try {
        const data = await fs.readFile("config.json", 'utf-8')
        config = JSON.parse(data)
    } catch (e) {
        console.error('读取配置文件错误:', e);
        config = {
            "words": {
                "size": 14,
                "definition": "none",
                "sound": "none"
            },
            "sound": {
                "speed": 170
            },
            "wordLists": {
                "path": "wordList",
                "default": "example"
            }
        }
        await fs.writeFile("config.json", JSON.stringify(config, null, 2))
    }
    currentWordList = config.wordLists.default
    wordListsFolder = config.wordLists.path

    try {
        await fs.access(wordListsFolder)
    } catch {
        await fs.mkdir(wordListsFolder, { recursive: true })
    }
}

async function readWords() {
    try {
        const filePath = path.join(wordListsFolder, "words.json")
        const loveFilePath = path.join(wordListsFolder, "love.json")
        const easyFilePath = path.join(wordListsFolder, "easy.json")
        const data = await fs.readFile(filePath, 'utf-8')

        words = JSON.parse(data)

        let loveData = JSON.parse(await fs.readFile(loveFilePath, 'utf-8'))
        let easyData = JSON.parse(await fs.readFile(easyFilePath, 'utf-8'))

        if (!loveData || typeof loveData !== 'object') {
            loveData = { name: '收藏单词', words: [] }
        }
        if (!easyData || typeof easyData !== 'object') {
            easyData = { name: '简单单词', words: [] }
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
        width: 1000,
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
    let result = []
    for (const filename of config.wordLists.lists) {
        const wordListPath = path.join(wordListsFolder, filename + '.json')
        // 判断文件存在
        try {
            await fs.access(wordListPath)
        } catch {
            continue
        }
        try {
            const data = await fs.readFile(wordListPath, 'utf-8')
            const wordList = JSON.parse(data)
            result.push({
                name: wordList.name,
                value: filename
            })
        } catch (e) {
            coneole.log(e)
            continue
        }
    }
    return result
})

ipcMain.handle('getWordCurrentList', () => {
    return currentWordList
})

ipcMain.handle('setCurrentWordList', async (event, wordList) => {
    currentWordList = wordList
    config.wordLists.default = wordList
    await fs.writeFile("config.json", JSON.stringify(config, null, 2))
    return true
})

ipcMain.handle('getWords', async (event, page = 0, pageSize = 20) => {
    try {
        const filePath = path.join(wordListsFolder, currentWordList + '.json')
        const data = await fs.readFile(filePath, 'utf-8')
        const wordList = JSON.parse(data).words || []
        let result = []
        const start = page * pageSize
        const end = Math.min(start + pageSize, wordList.length)
        for (let i = start; i < end; i++) {
            const word = wordList[i]
            if (word && words[word]) {
                result.push(words[word])
            }
        }
        return {
            words: result,
            total: wordList.length,
            page,
            pageSize
        }
    } catch (error) {
        console.error('获取单词列表错误:', error)
        return {
            words: [],
            total: 0,
            page,
            pageSize
        }
    }
})

ipcMain.handle('getConfig', () => {
    return config
})

ipcMain.handle('speak', async (event, params) => {
    try {
        const text = typeof params === 'string' ? params : params.text
        const voiceType = typeof params === 'string' ? 'en' : (params.voiceType || 'en')
        await execAsync(`${ESPEAK_PATH} -v ${voiceType} -s ${config.sound.speed} "${text}"`)
        return { success: true }
    } catch (error) {
        console.error('语音合成错误:', error)
        return {
            success: false,
            error: error.message
        }
    }
})

ipcMain.handle('changeLove', async (event, word) => {
    const loveFilePath = path.join(wordListsFolder, 'love.json')
    const wordsFilePath = path.join(wordListsFolder, 'words.json')

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
    const easyFilePath = path.join(wordListsFolder, 'easy.json')
    const wordsFilePath = path.join(wordListsFolder, 'words.json')

    try {
        const data = JSON.parse(await fs.readFile(wordsFilePath, 'utf-8'))

        const easyRaw = await fs.readFile(easyFilePath, 'utf-8')
        let easyData = JSON.parse(easyRaw)
        if (!easyData || typeof easyData !== 'object') {
            easyData = { name: '简单单词', words: [] }
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

ipcMain.handle('changeHard', async (event, word) => {
    const wordsFilePath = path.join(wordListsFolder, 'words.json')
    const hardFilePath = path.join(wordListsFolder, 'hard.json')
    try {
        const data = JSON.parse(await fs.readFile(wordsFilePath, 'utf-8'))

        const hardRaw = await fs.readFile(hardFilePath, 'utf-8')
        let hardData = JSON.parse(hardRaw)
        if (!hardData || typeof hardData !== 'object') {
            hardData = { name: '困难单词', words: [] }
        }

        const hardSet = new Set(hardData.words)
        const isHard = !!data[word].hard
        if (isHard) {
            hardSet.delete(word)
            data[word].hard = false
            words[word].hard = false
        } else {
            hardSet.add(word)
            data[word].hard = true
            words[word].hard = true
        }
        hardData.words = Array.from(hardSet)

        await fs.writeFile(hardFilePath, JSON.stringify(hardData, null, 2))
        await fs.writeFile(wordsFilePath, JSON.stringify(data, null, 2))

        return true
    } catch (error) {
        console.error('Error in changeHard:', error)
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
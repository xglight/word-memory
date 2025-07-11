const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron/main')
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
                "definition": "none"
            },
            "sound": {
                "speed": 175,
                "type": "en"
            },
            "wordLists": {
                "path": "wordlist",
                "default": "college_entrance_examination",
                "lists": [
                    "love",
                    "easy",
                    "hard",
                    "college_entrance_examination"
                ]
            },
            "theme": {
                "mode": "system"
            }
        }
        await fs.writeFile("config.json", JSON.stringify(config, null, 2))
    }

    currentWordList = config.wordLists.default
    wordListsFolder = config.wordLists.path

    if (config.theme.mode !== 'light' && config.theme.mode !== 'dark' && config.theme.mode !== 'system')
        config.theme.mode = 'system'
    else nativeTheme.themeSource = config.theme.mode

    if (config.sound.speed < 50 || config.sound.speed > 300)
        config.sound.speed = 175

    if (config.sound.type !== 'en' && config.sound.type !== 'zh' && config.sound.type !== 'en-us')
        config.sound.type = 'en'

    try {
        await fs.access(wordListsFolder)
    } catch {
        await fs.mkdir(wordListsFolder, { recursive: true })
    }

    await fs.writeFile("config.json", JSON.stringify(config, null, 2))
}

async function readWords() {
    const filePath = path.join(wordListsFolder, "words.json")
    const loveFilePath = path.join(wordListsFolder, "love.json")
    const easyFilePath = path.join(wordListsFolder, "easy.json")

    try {
        // 并行读取所有文件
        const [wordsData, loveData, easyData] = await Promise.all([
            fs.readFile(filePath, 'utf-8').catch(() => '{}'),
            fs.readFile(loveFilePath, 'utf-8').catch(() => '{"name":"收藏单词","words":[]}'),
            fs.readFile(easyFilePath, 'utf-8').catch(() => '{"name":"简单单词","words":[]}')
        ])

        // 解析JSON数据
        words = JSON.parse(wordsData)
        const love = typeof JSON.parse(loveData) === 'object' ? JSON.parse(loveData) : { name: '收藏单词', words: [] }
        const easy = typeof JSON.parse(easyData) === 'object' ? JSON.parse(easyData) : { name: '简单单词', words: [] }

        // 处理单词状态
        const loveSet = new Set(love.words)
        const easySet = new Set(easy.words)

        Object.entries(words).forEach(([word, info]) => {
            if (info.love) loveSet.add(word)
            else loveSet.delete(word)
            if (info.easy) easySet.add(word)
            else easySet.delete(word)
        })

        // 准备写入数据
        const newLoveData = { ...love, words: Array.from(loveSet) }
        const newEasyData = { ...easy, words: Array.from(easySet) }

        // 并行写入文件
        await Promise.all([
            fs.writeFile(loveFilePath, JSON.stringify(newLoveData, null, 2)),
            fs.writeFile(easyFilePath, JSON.stringify(newEasyData, null, 2))
        ])
    } catch (e) {
        console.error('读取单词数据失败:', e)
        throw e // 抛出错误让调用者处理
    }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 600,
        frame: false,
        ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'src', 'word_memory.ico')
    })

    win.loadFile('index.html')
}

ipcMain.handle('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
})
ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    win?.isMaximized() ? win.unmaximize() : win.maximize()
})
ipcMain.handle('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
})

ipcMain.handle('dark-mode:toggle', async () => {
    if (nativeTheme.shouldUseDarkColors) {
        nativeTheme.themeSource = 'light'
    } else {
        nativeTheme.themeSource = 'dark'
    }
    return nativeTheme.shouldUseDarkColors
})

ipcMain.handle('dark-mode:system', async () => {
    nativeTheme.themeSource = 'system'
})

ipcMain.handle('dark-mode:light', () => {
    nativeTheme.themeSource = 'light'
})

ipcMain.handle('dark-mode:dark', () => {
    nativeTheme.themeSource = 'dark'
})

ipcMain.handle('dark-mode:getMode', () => {
    return nativeTheme.shouldUseDarkColors
})

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

ipcMain.handle('setDefinition', async (event, definition) => {
    config.words.definition = definition.definition
    await fs.writeFile("config.json", JSON.stringify(config, null, 2))
})

ipcMain.handle('setSoundType', async (event, type) => {
    config.sound.type = type.type
    await fs.writeFile("config.json", JSON.stringify(config, null, 2))
})

ipcMain.handle('setDefaultTheme', async (event, mode) => {
    config.theme.mode = mode.theme
    nativeTheme.themeSource = mode.theme
    await fs.writeFile("config.json", JSON.stringify(config, null, 2))
})

ipcMain.handle('speak', async (event, params) => {
    try {
        const text = typeof params === 'string' ? params : params.text
        const voiceType = typeof params === 'string' ? 'en' : (params.voiceType || config.sound.type)
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
    app.quit()
})
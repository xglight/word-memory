document.addEventListener('DOMContentLoaded', async () => {
    // 获取DOM元素
    const wordCard = document.getElementById('word-card')
    const wordElement = document.getElementById('word')
    const definitionElement = document.getElementById('definition')
    const wordListSelect = document.getElementById('wordlist-selector')
    const wordIndexElement = document.getElementById('word-index')
    const phoneticElement = document.getElementById('phonetic')
    const prevBtn = document.getElementById('prev-btn')
    const nextBtn = document.getElementById('next-btn')
    const flipBtn = document.getElementById('flip-btn')
    const copyBtn = document.getElementById('copy-btn')
    const speakBtn = document.getElementById('speak-btn')
    const lovebtn = document.getElementById('favorite-btn')
    const easyBtn = document.getElementById('easy-btn')

    // 加载单词列表
    let words = []
    let config
    let currentIndex = 0

    async function init() {
        await loadConfig()
        await loadWordLists()
        await loadWordList()
    }

    async function loadConfig() {
        config = await window.wordMemoryAPI.getConfig()
    }

    async function loadWords() {
        try {
            console.log('Loading words...')
            words = await window.wordMemoryAPI.getWords()
            showCurrentWord()
        } catch (err) {
            console.error('Failed to load words:', err)
            wordElement.textContent = '无单词数据'
        }
    }

    async function loadWordLists() {
        try {
            console.log('Loading word lists...')
            const wordLists = await window.wordMemoryAPI.getWordLists()
            // 动态创建单词列表选项
            for (let i = 0; i < wordLists.length; i++) {
                const option = document.createElement('option')
                option.value = wordLists[i].value
                option.textContent = wordLists[i].name
                wordListSelect.appendChild(option)
            }
        } catch (err) {
            console.error('Failed to load word lists:', err)
        }
    }

    async function loadWordList() {
        const currentList = await window.wordMemoryAPI.getWordCurrentList()
        console.log('Current list:', currentList)
        wordListSelect.value = currentList
        await loadWords()
    }

    // 初始加载
    await init()

    // 处理单词列表切换
    wordListSelect.addEventListener('change', async () => {
        try {
            console.log('Attempting to change word list to:', wordListSelect.value)
            const success = await window.wordMemoryAPI.updateWordList(wordListSelect.value)
            if (!success) {
                console.error('Failed to update word list in main process')
                return
            }
            console.log('Word list updated in main process')
            currentIndex = 0
            await loadWordList()
            console.log('Word list reloaded successfully')
        } catch (err) {
            console.error('Failed to change word list:', err)
            // 恢复之前的选择值
            const currentList = await window.wordMemoryAPI.getWordCurrentList()
            wordListSelect.value = currentList
        }
    })

    // 显示当前单词
    function showCurrentWord() {
        if (words.length === 0) {
            wordElement.textContent = '无单词数据'
            wordIndexElement.textContent = '0/0'
            phoneticElement.textContent = ''
            definitionElement.textContent = ''
            lovebtn.classList.remove('active')
            easyBtn.classList.remove('active')
            definitionElement.style.display = 'none'
            return
        }

        const word = words[currentIndex]

        console.log(word)

        wordElement.textContent = word.word
        // 拼接 definition
        let definition = ''
        for (let i = 0; i < word.definition.length; i++)
            definition += word.definition[i]

        definitionElement.style.display = 'block'
        definitionElement.textContent = definition

        phoneticElement.textContent = word.phonetic

        // 更新单词序号显示
        wordIndexElement.textContent = `${currentIndex + 1}/${words.length}`

        // 默认隐藏释义
        definitionElement.style.display = config.words.definition

        flipBtn.textContent = definitionElement.style.display === 'none' ? '显示释义' : '隐藏释义'

        // 更新按钮状态
        if (word.love) {
            lovebtn.classList.add('active')
        } else {
            lovebtn.classList.remove('active')
        }

        if (word.easy) {
            easyBtn.classList.add('active')
        } else {
            easyBtn.classList.remove('active')
        }
    }

    // 单词卡片翻转（显示/隐藏释义）
    flipBtn.addEventListener('click', () => {
        const show = definitionElement.style.display === 'none'
        definitionElement.style.display = show ? 'block' : 'none'
        flipBtn.textContent = show ? '隐藏释义' : '显示释义'
    })

    // 上一个单词
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--
            showCurrentWord()
        }
    })

    // 下一个单词
    nextBtn.addEventListener('click', () => {
        if (currentIndex < words.length - 1) {
            currentIndex++
            showCurrentWord()
        }
    })

    // 朗读单词
    speakBtn.addEventListener('click', async () => {
        try {
            const word = words[currentIndex].word
            await window.wordMemoryAPI.speak(word)

            // 显示反馈
            const originalTitle = speakBtn.getAttribute('title')
            speakBtn.setAttribute('title', '朗读中...')
            setTimeout(() => {
                speakBtn.setAttribute('title', originalTitle)
            }, 2000)

            // 动画反馈
            speakBtn.style.transform = 'scale(1.2)'
            setTimeout(() => {
                speakBtn.style.transform = 'scale(1)'
            }, 300)
        } catch (err) {
            console.error('朗读失败:', err)
            speakBtn.setAttribute('title', '朗读失败')
            setTimeout(() => {
                speakBtn.setAttribute('title', '朗读单词')
            }, 2000)
        }
    })

    // 复制单词
    copyBtn.addEventListener('click', async () => {
        try {
            const word = words[currentIndex].word
            await navigator.clipboard.writeText(word)

            // 显示反馈
            const originalTitle = copyBtn.getAttribute('title')
            copyBtn.setAttribute('title', '已复制!')
            setTimeout(() => {
                copyBtn.setAttribute('title', originalTitle)
            }, 2000)

            // 动画反馈
            copyBtn.style.transform = 'scale(1.2)'
            setTimeout(() => {
                copyBtn.style.transform = 'scale(1)'
            }, 300)
        } catch (err) {
            console.error('复制失败:', err)
        }
    })

    //收藏
    lovebtn.addEventListener('click', async () => {
        try {
            await window.wordMemoryAPI.changeLove(words[currentIndex].word)
            // 切换active样式
            lovebtn.classList.toggle('active')
            words[currentIndex].love = !words[currentIndex].love
            // 添加点击动画
            lovebtn.style.transform = 'scale(1.2)'
            setTimeout(() => {
                lovebtn.style.transform = 'scale(1)'
            }, 300)
        } catch (err) {
            console.error('收藏失败:', err)
            lovebtn.style.animation = 'shake 0.5s'
            setTimeout(() => {
                lovebtn.style.animation = ''
            }, 500)
        }
    })

    //简单
    easyBtn.addEventListener('click', async () => {
        try {
            await window.wordMemoryAPI.changeEasy(words[currentIndex].word)
            // 切换active样式
            easyBtn.classList.toggle('active')
            words[currentIndex].easy = !words[currentIndex].easy
            // 添加点击动画
            easyBtn.style.transform = 'scale(1.2)'
            setTimeout(() => {
                easyBtn.style.transform = 'scale(1)'
            }, 300)
        } catch (err) {
            console.error('简单失败:', err)
            easyBtn.style.animation = 'shake 0.5s'
            setTimeout(() => {
                easyBtn.style.animation = ''
            }, 500)
        }
    })
})

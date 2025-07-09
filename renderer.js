document.addEventListener('DOMContentLoaded', async () => {
    // 获取DOM元素
    const wordCard = document.getElementById('word-card')
    const wordElement = document.getElementById('word')
    const definitionElement = document.getElementById('definition')
    const prevBtn = document.getElementById('prev-btn')
    const nextBtn = document.getElementById('next-btn')
    const flipBtn = document.getElementById('flip-btn')

    // 加载单词列表
    let words = []
    let currentIndex = 0

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

    // 初始加载
    loadWords()

    // 显示当前单词
    function showCurrentWord() {
        if (words.length === 0) return

        const word = words[currentIndex]
        wordElement.textContent = word.word
        // 拼接 definition
        let definition = ''
        for (let i = 0; i < word.definition.length; i++)
            definition += word.definition[i]
        definitionElement.textContent = definition

        // 默认隐藏释义
        definitionElement.style.display = 'none'
    }

    // 单词卡片翻转（显示/隐藏释义）
    flipBtn.addEventListener('click', () => {
        const show = definitionElement.style.display === 'none'
        definitionElement.style.display = show ? 'block' : 'none'
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

})

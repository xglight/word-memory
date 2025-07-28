document.addEventListener('DOMContentLoaded', async () => {
    const inputBox = document.getElementById('input-box');
    // 获取DOM元素
    const minimizeBtn = document.getElementById('minimize-btn')
    const maximizeBtn = document.getElementById('maximize-btn')
    const closeBtn = document.getElementById('close-btn')
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
    const lovebtn = document.getElementById('favorite-btn')
    const easyBtn = document.getElementById('easy-btn')
    const hardBtn = document.getElementById('hard-btn')
    const speakBtn = document.getElementById('speak-btn')
    const voiceTypeSelect = document.getElementById('voice-type')
    const lightBtn = document.getElementById('light-mode-btn')
    const darkBtn = document.getElementById('dark-mode-btn')
    const wordSearch = document.getElementById('word-search')
    const showWordBtn = document.getElementById('show-word-btn')

    // 加载单词列表
    let words = []
    let config
    let currentIndex = 0
    let currentPage = 0
    const pageSize = 20
    let totalWords = 0
    let currentMode
    let searchText = ''

    async function init() {
        await loadConfig()
        await loadWordLists()
        await loadWordList()
        await loadViceTypes()
        await loadCurrentMode()
        await settingInit()
    }

    async function loadConfig() {
        config = await window.wordMemoryAPI.getConfig()
    }

    async function loadWords() {
        try {
            console.log('Loading words...')
            const response = await window.wordMemoryAPI.getWords(searchText, currentPage, pageSize)
            words = response.words
            totalWords = response.total
            showCurrentWord()
            updatePageSelector()
        } catch (err) {
            console.error('Failed to load words:', err)
            wordElement.textContent = '无单词数据'
        }
    }

    function updatePageSelector() {
        const pageSelector = document.getElementById('page-selector')
        if (!pageSelector) return

        const totalPages = Math.ceil(totalWords / pageSize)
        pageSelector.innerHTML = ''

        for (let i = 0; i < totalPages; i++) {
            const option = document.createElement('option')
            option.value = i
            option.textContent = `第${i + 1}节`
            if (i === currentPage) option.selected = true
            pageSelector.appendChild(option)
        }
    }

    async function loadWordLists() {
        try {
            console.log('Loading word lists...')
            // 清空
            wordListSelect.innerHTML = ''

            const wordLists = await window.wordMemoryAPI.getWordLists()

            // 动态创建单词列表选项
            for (let i = 0; i < wordLists.length; i++) {
                if (wordLists[i].enable === false) continue
                const option = document.createElement('option')
                option.value = wordLists[i].value
                option.textContent = wordLists[i].name
                wordListSelect.appendChild(option)
            }

            // 更新单词表管理界面
            await updateWordListManagement()
        } catch (err) {
            console.error('Failed to load word lists:', err)
        }
    }

    // 新增：更新单词表管理界面的函数
    async function updateWordListManagement() {
        try {
            const wordLists = await window.wordMemoryAPI.getWordLists()
            const currentList = await window.wordMemoryAPI.getWordCurrentList()
            const wordlistTable = document.querySelector('.wordlist-table')

            if (!wordlistTable) {
                console.error('Wordlist table not found')
                return
            }

            // 清空现有表格内容
            wordlistTable.innerHTML = `
                <thead>
                    <tr>
                        <th>单词表名称</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${wordLists.map(list => {
                const isCurrentList = list.value === currentList
                const isEnabled = list.enable

                return `
                            <tr>
                                <td>${list.name}${isCurrentList ? ' (当前)' : ''}</td>
                                <td>
                                    <span class="status-badge ${isEnabled ? 'enabled' : 'disabled'}">
                                        ${isEnabled ? '启用' : '禁用'}
                                    </span>
                                </td>
                                <td>
                                    <button class="table-button load-btn" data-list="${list.value}" 
                                        ${!isEnabled ? 'disabled' : ''} 
                                        title="${!isEnabled ? '禁用的单词表无法加载' : '加载此单词表'}">
                                        加载
                                    </button>
                                    <button class="table-button state-btn" data-list="${list.value}" 
                                        ${isCurrentList ? 'disabled' : ''} 
                                        title="${isCurrentList ? '当前启用的单词表无法禁用' : (isEnabled ? '禁用' : '启用') + '此单词表'}">
                                        ${isEnabled ? '禁用' : '启用'}
                                    </button>
                                    <button class="table-button edit-btn" data-list="${list.value}" title="编辑此单词表">编辑</button>
                                </td>
                            </tr>
                        `
            }).join('')}
                </tbody>
            `

            // 添加事件监听器
            addWordListEventListeners()
        } catch (err) {
            console.error('Failed to update word list management:', err)
        }
    }

    // 新增：添加单词表事件监听器
    function addWordListEventListeners() {
        // 加载按钮事件
        document.querySelectorAll('.load-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                // 检查按钮是否被禁用
                if (e.target.disabled) {
                    return
                }

                try {
                    const list = e.target.dataset.list
                    console.log('正在加载单词表:', list)
                    await window.wordMemoryAPI.setCurrentWordList(list)
                    console.log('单词表加载成功')
                    await loadWordList()

                    // 显示成功反馈
                    e.target.textContent = '已加载'
                    e.target.style.backgroundColor = 'var(--success-color)'
                    setTimeout(() => {
                        e.target.textContent = '加载'
                        e.target.style.backgroundColor = ''
                    }, 1000)

                    // 重新更新单词表管理界面以反映当前状态
                    await updateWordListManagement()
                } catch (err) {
                    console.error('加载单词表失败:', err)
                    e.target.style.animation = 'shake 0.5s'
                    setTimeout(() => {
                        e.target.style.animation = ''
                    }, 500)
                }
            })
        })

        // 状态切换按钮事件
        document.querySelectorAll('.state-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                // 检查按钮是否被禁用
                if (e.target.disabled) {
                    return
                }

                try {
                    const list = e.target.dataset.list
                    console.log('切换单词表状态:', list)
                    const enable = await window.wordMemoryAPI.toggleWordListState(list)
                    console.log('单词表状态更新:', enable ? '启用' : '禁用')

                    // 重新加载单词列表选择器
                    await loadWordLists()

                    // 重新更新单词表管理界面以反映新状态
                    await updateWordListManagement()
                } catch (err) {
                    console.error('切换单词表状态失败:', err)
                    e.target.style.animation = 'shake 0.5s'
                    setTimeout(() => {
                        e.target.style.animation = ''
                    }, 500)
                }
            })
        })

        // 编辑按钮事件
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const listValue = e.target.dataset.list
                try {
                    const wordLists = await window.wordMemoryAPI.getWordLists()
                    const currentList = wordLists.find(l => l.value === listValue)
                    if (!currentList) {
                        alert('未找到该单词表')
                        return
                    }

                    const data = await window.wordMemoryAPI.getWordListFile(listValue)
                    // 渲染到自定义弹窗
                    const overlay = document.getElementById('wordlist-edit-overlay')
                    const title = document.getElementById('wordlist-edit-title')
                    const name = document.getElementById('wordlist-edit-name')
                    const list = document.getElementById('wordlist-edit-list')

                    title.textContent = '单词表编辑'
                    name.textContent = data.name || listValue
                    list.innerHTML = ''

                        ; (data.words || []).forEach(word => {
                            const li = document.createElement('li')
                            li.textContent = word
                            list.appendChild(li)
                        })

                    overlay.classList.add('active')
                } catch (err) {
                    alert('读取单词表失败: ' + err.message)
                }
            })
        })
    }

    async function loadWordList() {
        const currentList = await window.wordMemoryAPI.getWordCurrentList()
        console.log('Current list:', currentList)
        wordListSelect.value = currentList
        await loadWords()
        await renderWordList()
        updateWordListHighlight()
    }

    async function renderWordList() {
        const wordListElement = document.getElementById('word-list')
        if (!wordListElement) {
            console.error('Word list element not found')
            return
        }

        try {
            console.log('Fetching all words...')
            // 使用分页方式获取所有单词
            let allWords = []

            const response = await window.wordMemoryAPI.getWords(searchText, currentPage, pageSize)
            console.log(`Loaded page ${currentPage} with ${response.words.length} words`)

            allWords = allWords.concat(response.words)

            console.log(`Total words loaded: ${allWords.length}`)

            // 清空现有列表
            wordListElement.innerHTML = ''

            if (allWords.length === 0) {
                console.log('No words to display')
                const emptyMsg = document.createElement('li')
                emptyMsg.textContent = '无单词数据'
                wordListElement.appendChild(emptyMsg)
                return
            }

            // 使用文档片段优化性能
            const fragment = document.createDocumentFragment()

            // 创建列表项
            allWords.forEach((word, index) => {
                const li = document.createElement('li')
                // 根据单词显示设置来决定显示内容
                if (config.words.word === 'none') {
                    li.textContent = '已隐藏'
                    li.style.color = 'var(--text-muted)'
                    li.style.fontStyle = 'italic'
                } else {
                    li.textContent = word.word
                    li.style.color = ''
                    li.style.fontStyle = ''
                }
                li.dataset.index = index

                // 高亮当前单词
                li.classList.toggle('highlight', index === currentIndex)

                // 点击事件
                li.addEventListener('click', () => {
                    currentIndex = index
                    showCurrentWord()
                    updateWordListHighlight()
                })

                fragment.appendChild(li)
            })

            wordListElement.appendChild(fragment)

            showCurrentWord()
            console.log('Word list rendered successfully')
        } catch (err) {
            console.error('Failed to render word list:', err)
            wordListElement.innerHTML = '<li style="color:red">加载单词列表失败</li>'
        }
    }

    async function loadCurrentMode() {
        currentMode = await window.wordMemoryAPI.getMode() ? 'dark' : 'light'
        console.log('Current mode:', currentMode)
        if (currentMode === 'light') {
            lightBtn.classList.add('active')
            darkBtn.classList.remove('active')
        }
        else if (currentMode === 'dark') {
            darkBtn.classList.add('active')
            lightBtn.classList.remove('active')
        }
    }

    function updateWordListHighlight() {
        const items = document.querySelectorAll('#word-list li')
        items.forEach((item, index) => {
            item.classList.toggle('highlight', index === currentIndex)
            if (index === currentIndex) {
                item.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                })
            }
        })
    }

    async function loadViceTypes() {
        console.log(config.sound.type)
        voiceTypeSelect.value = config.sound.type
    }

    // 处理节切换
    document.getElementById('page-selector').addEventListener('change', async (e) => {
        currentPage = parseInt(e.target.value)
        currentIndex = 0
        await loadWordList()
    })

    // 处理单词列表切换
    wordListSelect.addEventListener('change', async () => {
        try {
            console.log('Attempting to change word list to:', wordListSelect.value)
            const success = await window.wordMemoryAPI.setCurrentWordList(wordListSelect.value)
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
        // 清除输入框内容
        inputBox.textContent = '';
        newInput = ''

        if (words.length === 0) {
            wordElement.textContent = '无单词数据'
            wordIndexElement.textContent = '0/0'
            phoneticElement.textContent = ''
            definitionElement.textContent = ''
            lovebtn.classList.remove('active')
            easyBtn.classList.remove('active')
            definitionElement.style.display = 'none'
            updateWordListHighlight()
            return
        }

        const word = words[currentIndex]

        console.log(word)

        wordElement.textContent = word.word
        // 拼接 definition
        let definition = word.definition.join('<br>')
        definitionElement.innerHTML = definition

        // 拼接 phonetic
        let phonetic = ''
        for (let i = 0; i < word.phonetic.length; i++)
            phonetic += word.phonetic[i] + ' '
        phoneticElement.textContent = phonetic
        phoneticElement.style.display = config.words.phonetic

        // 更新单词序号显示
        wordIndexElement.textContent = `${currentIndex + 1}/${words.length}`

        // 默认释义
        definitionElement.style.display = config.words.definition
        wordElement.style.display = config.words.word
        phoneticElement.style.display = config.words.word

        flipBtn.textContent = definitionElement.style.display === 'none' ? '显示释义' : '隐藏释义'
        showWordBtn.textContent = wordElement.style.display === 'none' ? '显示单词' : '隐藏单词'
        inputBox.style.display = wordElement.style.display === 'none' ? 'block' : 'none'

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

    minimizeBtn.addEventListener('click', async () => {
        await window.wordMemoryAPI.minimize()
    })

    maximizeBtn.addEventListener('click', async () => {
        await window.wordMemoryAPI.maximize()
    })

    closeBtn.addEventListener('click', async () => {
        await window.wordMemoryAPI.close()
    })

    // 单词卡片翻转（显示/隐藏释义）
    flipBtn.addEventListener('click', () => {
        const show = definitionElement.style.display === 'none'
        definitionElement.style.display = show ? 'block' : 'none'
        flipBtn.textContent = show ? '隐藏释义' : '显示释义'
    })

    // 显示单词按钮

    showWordBtn.addEventListener('click', async () => {
        newInput = ''
        inputBox.textContent = '';
        const show = wordElement.style.display === 'none'
        wordElement.style.display = show ? 'block' : 'none'
        phoneticElement.style.display = show ? 'block' : 'none'
        showWordBtn.textContent = show ? '隐藏单词' : '显示单词'
        inputBox.style.display = show ? 'none' : 'block'

        // 更新配置并重新渲染单词列表
        config.words.word = show ? 'block' : 'none'
        await window.wordMemoryAPI.setWord(config.words.word)
        await renderWordList()
    })

    // 上一个单词
    prevBtn.addEventListener('click', async () => {
        if (currentIndex > 0) {
            currentIndex--
            showCurrentWord()
            updateWordListHighlight()
        } else if (currentPage > 0) {
            currentPage--
            currentIndex = pageSize - 1
            await loadWordList()
        }
    })

    // 下一个单词
    nextBtn.addEventListener('click', async () => {
        if (currentIndex < words.length - 1) {
            currentIndex++
            showCurrentWord()
            updateWordListHighlight()
        } else if (currentPage < Math.ceil(totalWords / pageSize) - 1) {
            currentPage++
            currentIndex = 0
            await loadWordList()
        }
    })

    // 朗读单词
    speakBtn.addEventListener('click', async () => {
        // 立即触发动画反馈
        speakBtn.style.transform = 'scale(1.1)'

        try {
            const word = words[currentIndex].word
            const voiceType = voiceTypeSelect.value

            // 显示反馈
            const originalTitle = speakBtn.getAttribute('title')
            speakBtn.setAttribute('title', '朗读中...')

            // 异步播放语音
            window.wordMemoryAPI.speak(word, voiceType)
                .catch(err => {
                    console.error('朗读失败:', err)
                    speakBtn.setAttribute('title', '朗读失败')
                })
                .finally(() => {
                    setTimeout(() => {
                        speakBtn.setAttribute('title', originalTitle)
                        speakBtn.style.transform = 'scale(1)'
                    }, 150)
                })
        } catch (err) {
            console.error('朗读错误:', err)
            speakBtn.setAttribute('title', '朗读错误')
            setTimeout(() => {
                speakBtn.setAttribute('title', '朗读单词')
                speakBtn.style.transform = 'scale(1)'
            }, 150)
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

    hardBtn.addEventListener('click', async () => {
        try {
            await window.wordMemoryAPI.changeHard(words[currentIndex].word)
            // 切换active样式
            hardBtn.classList.toggle('active')
            words[currentIndex].hard = !words[currentIndex].hard
            // 添加点击动画
            hardBtn.style.transform = 'scale(1.2)'
            setTimeout(() => {
                hardBtn.style.transform = 'scale(1)'
            }, 300)
        } catch (err) {
            console.error('困难失败:', err)
            hardBtn.style.animation = 'shake 0.5s'
            setTimeout(() => {
                hardBtn.style.animation = ''
            }, 500)
        }
    })

    lightBtn.addEventListener('click', async () => {
        if (currentMode === 'light') return
        await window.wordMemoryAPI.light()
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
        lightBtn.classList.toggle('active')
        darkBtn.classList.toggle('active')
        currentMode = 'light'
    })

    darkBtn.addEventListener('click', async () => {
        if (currentMode === 'dark') return
        await window.wordMemoryAPI.dark()
        document.documentElement.classList.remove('light')
        document.documentElement.classList.add('dark')
        lightBtn.classList.toggle('active')
        darkBtn.classList.toggle('active')
        currentMode = 'dark'
    })

    // 添加快捷键支持：左右箭头导航和功能按钮快捷键
    let isErrorState = false;
    let newInput = '';

    document.addEventListener('keydown', (event) => {
        // 如果事件目标是搜索框或其子元素，则不处理
        if (event.target.closest('#word-search')) {
            return;
        }
        // 处理字母、数字按键、退格键和回车键
        if (!event.ctrlKey && !event.altKey && !event.metaKey) {
            if (wordElement.style.display === 'block' && config.words.typing) {
                if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
                    const currentWord = words[currentIndex]?.word || '';
                    if (newInput.length <= currentWord.length) newInput += event.key;
                    let newContent = '';
                    // 构建带有颜色标记的内容
                    for (let i = 0; i < currentWord.length; i++) {
                        if (i < newInput.length) {
                            const isCorrect = currentWord[i] === newInput[i];
                            newContent += `<span style="color:${isCorrect ? 'green' : 'red'}">${newInput[i]}</span>`;
                        } else {
                            newContent += `<span style="color:white">${currentWord[i]}</span>`; // 未输入部分显示白色
                        }
                    }
                    wordElement.innerHTML = newContent;
                    event.preventDefault();
                } else if (event.key === 'Backspace') {
                    const currentWord = words[currentIndex]?.word || '';
                    newInput = newInput.slice(0, -1);
                    let newContent = '';
                    // 构建带有颜色标记的内容
                    for (let i = 0; i < currentWord.length; i++) {
                        if (i < newInput.length) {
                            const isCorrect = currentWord[i] === newInput[i];
                            newContent += `<span style="color:${isCorrect ? 'green' : 'red'}">${newInput[i]}</span>`;
                        } else {
                            newContent += `<span style="color:white">${currentWord[i]}</span>`; // 未输入部分显示白色
                        }
                    }
                    wordElement.innerHTML = newContent;
                    event.preventDefault();
                }
            } else if (config.words.dictation) {
                if (isErrorState && event.key !== 'Enter') {
                    // 错误状态下按任何键先清除内容
                    inputBox.textContent = '';
                    inputBox.style.color = '';
                    isErrorState = false;
                }
                if (event.key === 'Backspace') {
                    inputBox.textContent = inputBox.textContent.slice(0, -1);
                    event.preventDefault();
                } else if (event.key === 'Enter') {
                    // 比对输入内容与当前单词
                    const currentWord = words[currentIndex]?.word || '';
                    const isCorrect = inputBox.textContent === currentWord;
                    inputBox.style.color = isCorrect ? 'green' : 'red';
                    isErrorState = !isCorrect; // 设置错误状态
                    event.preventDefault();
                } else if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
                    inputBox.textContent += event.key;
                    inputBox.style.color = ''; // 重置颜色
                    event.preventDefault();
                }
            }
        }
        if (event.key === 'ArrowLeft') {
            prevBtn.click()
        } else if (event.key === 'ArrowRight') {
            nextBtn.click()
        } else if (event.key === ' ') {
            flipBtn.click()
        } else if (event.ctrlKey) {
            // Ctrl组合键处理
            switch (event.key.toLowerCase()) {
                case 'f':
                    lovebtn.click()
                    break
                case 'e':
                    easyBtn.click()
                    break
                case 's':
                    speakBtn.click()
                    break
                case 'h':
                    hardBtn.click()
                    break
                case 'c':
                    copyBtn.click()
                    break
                case 'i':
                    if (settingsOverlay.classList.contains('active'))
                        closeSettingsBtn.click()
                    else settingsBtn.click()
                    break
                case 'z':
                    showWordBtn.click()
                    break
            }
        } else if (event.key === 'Escape' && settingsOverlay.classList.contains('active')) {
            closeSettingsBtn.click()
            event.preventDefault()
        }
    })

    // 设置按钮点击事件
    const settingsBtn = document.getElementById('settings-btn')
    const settingsOverlay = document.getElementById('settings-overlay')
    const closeSettingsBtn = document.getElementById('close-settings-btn')
    const voiceTypeSetting = document.getElementById('voice-type-setting')
    const showDefinitionSetting = document.getElementById('show-definition')
    const lightModeSetting = document.getElementById('light-mode-setting')
    const darkModeSetting = document.getElementById('dark-mode-setting')
    const systemModeSetting = document.getElementById('system-theme-setting')
    const definationBox = document.getElementById('show-definition')
    const wordBox = document.getElementById('show-word')
    const enableTypingSetting = document.getElementById('enable-typing')
    const enableDictationSetting = document.getElementById('enable-dictation')

    // 选项卡切换功能
    function setupTabs() {
        const tabs = document.querySelectorAll('.settings-tab');
        const tabContents = document.querySelectorAll('.settings-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 移除所有选项卡的active类
                tabs.forEach(t => t.classList.remove('active'));
                // 添加当前选项卡的active类
                tab.classList.add('active');

                // 隐藏所有内容
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });

                // 显示当前选项卡对应的内容
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }

    async function settingInit() {
        setupTabs();
        try {
            // 确保config已加载
            if (!config) {
                config = await window.wordMemoryAPI.getConfig()
            }

            // 初始化语音设置
            voiceTypeSetting.value = config.sound.type

            // 初始化定义显示设置
            showDefinitionSetting.checked = config.words.definition === 'block'
            definationBox.checked = config.words.definition === 'block'
            // 初始化单词显示设置
            wordBox.checked = config.words.word === 'block'

            // 初始化打字练习设置
            enableTypingSetting.checked = config.words.typing
            // 初始化默写练习设置
            enableDictationSetting.checked = config.words.dictation

            // 初始化主题模式设置
            const currentMode = await window.wordMemoryAPI.getMode()
            if (currentMode) {
                darkModeSetting.classList.add('active')
                lightModeSetting.classList.remove('active')
            } else {
                lightModeSetting.classList.add('active')
                darkModeSetting.classList.remove('active')
            }

            console.log('设置界面初始化完成')
        } catch (err) {
            console.error('设置界面初始化失败:', err)
        }
    }

    settingsBtn.addEventListener('click', () => {
        settingsOverlay.classList.add('active')
    })

    closeSettingsBtn.addEventListener('click', () => {
        settingsOverlay.classList.remove('active')
    })

    lightModeSetting.addEventListener('click', async () => {
        await window.wordMemoryAPI.setDefaultTheme('light')
        await loadCurrentMode()
    })

    darkModeSetting.addEventListener('click', async () => {
        await window.wordMemoryAPI.setDefaultTheme('dark')
        await loadCurrentMode()
    })

    systemModeSetting.addEventListener('click', async () => {
        await window.wordMemoryAPI.setDefaultTheme('system')
        await loadCurrentMode()
    })

    definationBox.addEventListener('change', async () => {
        config.words.definition = definationBox.checked ? 'block' : 'none'
        await window.wordMemoryAPI.setDefinition(config.words.definition)
        showCurrentWord()
    })

    wordBox.addEventListener('change', async () => {
        config.words.word = wordBox.checked ? 'block' : 'none'
        await window.wordMemoryAPI.setWord(config.words.word)
        await loadWordList()
        showCurrentWord()
    })

    enableTypingSetting.addEventListener('change', async () => {
        config.words.typing = enableTypingSetting.checked
        await window.wordMemoryAPI.setEnableTyping(config.words.typing)
    })

    enableDictationSetting.addEventListener('change', async () => {
        config.words.dictation = enableDictationSetting.checked
        await window.wordMemoryAPI.setEnableDictation(config.words.dictation)
    })

    voiceTypeSetting.addEventListener('change', async () => {
        config.sound.type = voiceTypeSetting.value
        voiceTypeSelect.value = voiceTypeSetting.value
        await window.wordMemoryAPI.setSoundType(config.sound.type)
        showCurrentWord()
    })

    wordSearch.addEventListener('input', async (e) => {
        searchText = wordSearch.value.trim()
        currentPage = 0
        await loadWordList()
    })

    // 关闭单词表编辑弹窗
    document.getElementById('close-wordlist-edit-btn').addEventListener('click', () => {
        document.getElementById('wordlist-edit-overlay').classList.remove('active');
    });

    await init()
})
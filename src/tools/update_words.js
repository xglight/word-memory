const fs = require('fs').promises;
const getWordInfo = require('./get_word_info.js');

async function updateWords() {
    try {
        // 读取现有单词数据
        const data = await fs.readFile('./wordlist/words.json', 'utf8');
        const wordsData = JSON.parse(data);

        // 读取要更新的单词列表
        const wordList = await fs.readFile('./src/tools/wordlist.txt', 'utf8');
        const words = wordList.split('\n').filter(word => word.trim());

        let cnt = 0;

        // 更新每个单词的信息
        for (const wordLine of words) {
            if (cnt % 40 == 0) {
                console.log(`Updated ${cnt} words`);
                await fs.writeFile('./wordlist/words.json', JSON.stringify(wordsData, null, 2));
            }
            try {
                const wordAll = wordLine.split('[')[0].trim();
                if (!wordAll) continue;
                let wordlist = []

                if (wordAll.includes('(')) {
                    wordlist.push(wordAll.split('(')[0].trim());
                    const temp = wordAll.split('(')[1].split(')')[0].trim().split(',');
                    for (const item of temp) {
                        wordlist.push(item.trim());
                    }
                } else wordlist.push(wordAll);

                for (const word of wordlist) {
                    // 获取单词信息
                    const infoData = await getWordInfo(word);
                    const info = JSON.parse(infoData);

                    // 合并单词数据
                    wordsData[word] = {
                        ...info,
                        word: word,
                        lastReviewed: null,
                        love: false,
                        easy: false,
                        hard: false,
                        cnt: 0,
                        mystery: 0
                    };
                    // console.log(`Updated word: ${word}`);
                    cnt++;
                }
            } catch (err) {
                console.error(`Error processing word: ${wordLine}`, err);
            }
        }

        // 保存更新后的数据
        await fs.writeFile('./wordlist/words.json', JSON.stringify(wordsData, null, 2));
        console.log('Words updated successfully!');
    } catch (err) {
        console.error('Error updating words:', err);
    }
}

// 执行更新
updateWords().catch(err => console.error('Failed to update words:', err));

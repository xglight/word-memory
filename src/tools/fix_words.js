const fs = require('fs');
const path = require('path');

// 必需字段列表及其正确顺序
const REQUIRED_FIELDS = ['word', 'phonetic', 'definition', 'lastReviewed', 'love', 'easy', 'hard', 'cnt', 'mystery'];
const FIELD_ORDER = ['word', 'phonetic', 'definition', 'lastReviewed', 'love', 'easy', 'hard', 'cnt', 'mystery'];

/**
 * 修复缺失字段
 * @param {object} wordObj 单词对象
 */
function fixMissingFields(wordObj) {
    REQUIRED_FIELDS.forEach(field => {
        if (!(field in wordObj)) {
            // 设置默认值
            if (field === 'word') wordObj[field] = '';
            else if (field === 'phonetic') wordObj[field] = '';
            else if (field === 'definition') wordObj[field] = [];
            else if (field === 'lastReviewed') wordObj[field] = new Date().toISOString();
            else if (field === 'love') wordObj[field] = false;
            else if (field === 'easy') wordObj[field] = false;
            else if (field === 'hard') wordObj[field] = false;
            else if (field === 'cnt') wordObj[field] = 0;
            else if (field === 'mystery') wordObj[field] = false;
        }
    });
}

/**
 * 修复字段顺序
 * @param {object} wordObj 单词对象
 * @returns {object} 修正顺序后的单词对象
 */
function fixFieldOrder(wordObj) {
    const orderedObj = {};
    FIELD_ORDER.forEach(field => {
        if (wordObj[field] !== undefined) {
            orderedObj[field] = wordObj[field];
        }
    });
    return orderedObj;
}

/**
 * 修复definition中的括号
 * @param {Array} definitions 定义数组
 * @returns {Array} 修复后的定义数组
 */
function fixDefinitionBrackets(definitions) {
    if (!Array.isArray(definitions)) return [];
    
    return definitions.map(def => {
        if (typeof def !== 'string') return '';
        
        // 简单修复：移除不匹配的括号
        const leftBrackets = (def.match(/\[/g) || []).length;
        const rightBrackets = (def.match(/\]/g) || []).length;
        
        if (leftBrackets > rightBrackets) {
            return def.replace(/\[/g, '').replace(/\]/g, '');
        } else if (rightBrackets > leftBrackets) {
            return def.replace(/\]/g, '').replace(/\[/g, '');
        }
        return def;
    });
}

/**
 * 主修复函数
 * @param {string} reportPath 检查报告路径
 * @param {string} wordsFilePath words.json文件路径
 */
function fixWordsFile(reportPath, wordsFilePath) {
    try {
        // 读取报告和原始数据
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        const words = JSON.parse(fs.readFileSync(wordsFilePath, 'utf8'));

        // 修复有错误的单词
        for (const word in report.errors) {
            if (words[word]) {
                // 修复缺失字段
                fixMissingFields(words[word]);
                
                // 修复definition
                if (words[word].definition) {
                    words[word].definition = fixDefinitionBrackets(words[word].definition);
                }
                
                // 修复字段顺序
                words[word] = fixFieldOrder(words[word]);
            }
        }

        // 保存修复后的文件
        const fixedFilePath = wordsFilePath.replace('.json', '_fixed.json');
        fs.writeFileSync(fixedFilePath, JSON.stringify(words, null, 2));
        console.log(`Fixed words file saved to: ${fixedFilePath}`);

        return fixedFilePath;

    } catch (err) {
        console.error('Error fixing words file:', err);
        process.exit(1);
    }
}

// 使用示例
if (process.argv.length < 3) {
    console.log('Usage: node fix_words.js <report_file> [words_file]');
    console.log('Example: node fix_words.js ../reports/word_check_report_2025-07-11T013613Z.json ../wordlist/words.json');
    process.exit(0);
}

const reportFile = process.argv[2];
const wordsFile = process.argv[3] || path.join(__dirname, '../../wordlist/words.json');
fixWordsFile(reportFile, wordsFile);

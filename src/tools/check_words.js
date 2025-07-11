const fs = require('fs');
const path = require('path');

// 必需字段列表及其正确顺序
const REQUIRED_FIELDS = ['word', 'phonetic', 'definition', 'lastReviewed', 'love', 'easy', 'hard', 'cnt', 'mystery'];
const FIELD_ORDER = ['word', 'phonetic', 'definition', 'lastReviewed', 'love', 'easy', 'hard', 'cnt', 'mystery'];

/**
 * 检查单词对象的字段顺序是否正确
 * @param {object} wordObj 单词对象
 * @returns {Array} 顺序错误的字段列表
 */
function checkFieldOrder(wordObj) {
    const fields = Object.keys(wordObj);
    const errors = [];

    // 检查每个字段的位置是否符合要求
    fields.forEach((field, index) => {
        if (FIELD_ORDER[index] !== field) {
            errors.push(`Field '${field}' should be at position ${FIELD_ORDER.indexOf(field)} but is at ${index}`);
        }
    });

    return errors;
}

/**
 * 检查字符串中的中括号是否成对出现
 * @param {string} str 要检查的字符串
 * @returns {boolean} 是否成对
 */
function checkBrackets(str) {
    const leftBrackets = (str.match(/\[/g) || []).length;
    const rightBrackets = (str.match(/\]/g) || []).length;
    return leftBrackets === rightBrackets;
}

/**
 * 检查单词对象的必需字段
 * @param {object} wordObj 单词对象
 * @returns {Array} 缺失字段列表
 */
function checkRequiredFields(wordObj) {
    return REQUIRED_FIELDS.filter(field => {
        if (!(field in wordObj)) return true;
        return false;
    });
}

/**
 * 检查definition数组中的中括号
 * @param {Array} definitions 定义数组
 * @returns {Array} 包含不匹配中括号的定义索引
 */
function checkDefinitionBrackets(definitions) {
    if (!Array.isArray(definitions)) return ['definition is not an array'];

    const errors = [];
    definitions.forEach((def, index) => {
        if (typeof def !== 'string') {
            errors.push(`definition[${index}] is not a string`);
        } else if (!checkBrackets(def)) {
            errors.push(`definition[${index}] has unmatched brackets`);
        }
    });
    return errors;
}

/**
 * 主检查函数
 * @param {string} filePath words.json文件路径
 */
function checkWordsFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const words = JSON.parse(data);

        const results = {
            totalWords: 0,
            wordsWithErrors: 0,
            errors: {}
        };

        for (const [word, wordObj] of Object.entries(words)) {
            results.totalWords++;
            const errors = [];

            // 检查必需字段
            const missingFields = checkRequiredFields(wordObj);
            if (missingFields.length > 0) {
                errors.push(`Missing fields: ${missingFields.join(', ')}`);
            }

            // 检查definition中的中括号
            if (wordObj.definition) {
                const bracketErrors = checkDefinitionBrackets(wordObj.definition);
                errors.push(...bracketErrors);
            } else {
                errors.push('Missing definition field');
            }

            // 检查字段顺序
            const orderErrors = checkFieldOrder(wordObj);
            if (orderErrors.length > 0) {
                errors.push(...orderErrors);
            }

            if (errors.length > 0) {
                results.wordsWithErrors++;
                results.errors[word] = errors;
            }
        }

        // 生成报告文件名
        const reportDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(reportDir, `word_check_report_${timestamp}.json`);

        // 写入JSON报告文件
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        console.log(`Check report saved to: ${reportPath}`);

        return results;

    } catch (err) {
        console.error('Error checking words file:', err);
        process.exit(1);
    }
}

// 执行检查
const wordsFilePath = path.join(__dirname, '../../wordlist/words.json');
checkWordsFile(wordsFilePath);

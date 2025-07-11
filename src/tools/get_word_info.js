const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");

// API请求冷却时间(毫秒)
const API_COOLDOWN = 300;
// 请求超时时间(毫秒)
const REQUEST_TIMEOUT = 5000;
// 超时后冷却时间(毫秒)
const TIMEOUT_COOLDOWN = 30000;
// 最大重试次数
const MAX_RETRIES = 3;
let lastRequestTime = 0;

async function getWordInfo(word, retryCount = 0) {
    try {
        if (!word || typeof word !== 'string') {
            throw new Error('Invalid word parameter');
        }

        // 实现请求冷却
        const now = Date.now();
        const elapsed = now - lastRequestTime;
        if (elapsed < API_COOLDOWN) {
            await new Promise(resolve =>
                setTimeout(resolve, API_COOLDOWN - elapsed)
            );
        }

        const encodedWord = encodeURIComponent(word);
        const url = `https://cn.bing.com/dict/search?q=${encodedWord}`;

        // 创建AbortController实例
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, REQUEST_TIMEOUT);

        lastRequestTime = Date.now();
        const response = await fetch(url, {
            signal: controller.signal
        });

        // 清除超时定时器
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const parser = new JSDOM(html);
        const doc = parser.window.document;
        const metaDescription = doc.querySelector('meta[name="description"]');

        if (!metaDescription) {
            throw new Error('No meta description found');
        }

        const content = metaDescription.getAttribute("content") || "";
        const parts = content.split("，");

        let phoneticUs = "", phoneticEn = "", definition = [];

        for (const part of parts) {
            const trimmedPart = part.trim();
            if (trimmedPart.startsWith("美[") && trimmedPart.endsWith("]")) {
                phoneticUs = '/' + trimmedPart.substring(2, trimmedPart.length - 1) + '/';
            } else if (trimmedPart.startsWith("英[") && trimmedPart.endsWith("]")) {
                phoneticEn = '/' + trimmedPart.substring(2, trimmedPart.length - 1) + '/';
            } else if (trimmedPart.includes('；')) {
                const definitions = trimmedPart.split(' ');
                for (let i = 0; i < definitions.length; i += 2) {
                    if (definitions[i + 1]) {
                        definition.push(definitions[i] + ' ' + definitions[i + 1]);
                    }
                }
            }
        }

        console.log(`已保存 "${word}" 的词条信息`)

        return JSON.stringify({
            phoneticUs,
            phoneticEn,
            definition: definition.length ? definition : ["No definition found"]
        });

    } catch (error) {
        // 特殊处理超时错误
        if (error.name === 'AbortError') {
            console.error(`请求超时: "${word}" (尝试 ${retryCount + 1}/${MAX_RETRIES})`);

            if (retryCount < MAX_RETRIES - 1) {
                // 等待30秒后重试
                console.log(`等待 ${TIMEOUT_COOLDOWN / 1000} 秒后重试...`);
                await new Promise(resolve => setTimeout(resolve, TIMEOUT_COOLDOWN));
                return getWordInfo(word, retryCount + 1);
            }

            return JSON.stringify({
                phoneticUs: "",
                phoneticEn: "",
                definition: [`Error: 请求超时(尝试 ${MAX_RETRIES} 次均失败)`]
            });
        }

        console.error(`Error getting info for word "${word}":`, error.message);
        return JSON.stringify({
            phoneticUs: "",
            phoneticEn: "",
            definition: [`Error: ${error.message}`]
        });
    }
}

module.exports = getWordInfo;

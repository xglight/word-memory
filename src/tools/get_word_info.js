const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");

async function getWordInfo(word) {
    url = "https://cn.bing.com/dict/search?q=" + word;
    const response = await fetch(url);
    const html = await response.text();
    const parser = new JSDOM(html);
    const doc = parser.window.document;
    const metaDescription = doc.querySelector('meta[name="description"]');
    const content = metaDescription ? metaDescription.getAttribute("content") : "";
    const parts = content.split("，");

    let phoneticUs = "", phoneticEn = "", definition = [];

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part.startsWith("美[") && part.endsWith("]")) {
            phoneticUs = '/' + part.substring(2, part.length - 1) + '/';
        } else if (part.startsWith("英[") && part.endsWith("]")) {
            phoneticEn = '/' + part.substring(2, part.length - 1) + '/';
        } else if (part.includes('；')) {
            const definitions = part.split(' ');
            for (let j = 0; j < definitions.length; j += 2) {
                definition.push(definitions[j] + ' ' + definitions[j + 1]);
            }
        }
    }
    return {
        "phoneticUs": phoneticUs,
        "phoneticEn": phoneticEn,
        "definition": definition
    }
}

module.exports = getWordInfo;
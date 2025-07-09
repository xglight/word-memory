# Word Memory - 单词记忆软件

![Electron](https://img.shields.io/badge/Electron-47848F?style=flat-square&logo=electron&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)

用于桌面的单词记忆软件，帮助用户高效学习和记忆英语单词。

## 功能特点

- 📖 多单词表管理 - 支持多个单词表切换
- 🎤 单词朗读 - 使用eSpeak语音合成引擎
- 🔖 单词标记 - 可标记收藏和简单单词
- 📱 响应式界面 - 适配不同屏幕尺寸
- 🔄 数据持久化 - 自动保存学习进度和配置

## 技术栈

- **前端**: 
  - Electron 37.2.0
  - HTML/CSS/JavaScript
- **后端**:
  - Node.js
- **构建工具**:
  - electron-forge
- **语音合成**:
  - eSpeak

## 安装指南

### 开发环境

1. 克隆仓库:
   ```bash
   git clone https://github.com/your-repo/word_memory.git
   cd word_memory
   ```

2. 安装依赖:
   ```bash
   npm install
   ```

3. 启动开发服务器:
   ```bash
   npm start
   ```

### 生产环境

1. 打包应用:
   ```bash
   npm run make
   ```

2. 安装生成的安装包

## 使用说明

1. **界面概览**:
   - 顶部: 单词表选择器
   - 中部: 单词卡片(显示单词、音标和释义)
   - 底部: 控制按钮

2. **基本操作**:
   - 点击"上一个"/"下一个"按钮浏览单词
   - 点击"显示释义"切换释义显示
   - 点击扬声器图标朗读单词
   - 点击心形图标收藏单词
   - 点击对勾图标标记为简单单词

3. **单词管理**:
   - 在`wordlist`目录中添加/修改JSON格式的单词表
   - 支持多个单词表切换

## 开发指南

### 项目结构

```
.
├── main.js            # 主进程
├── renderer.js        # 渲染进程
├── preload.js         # 预加载脚本
├── index.html         # 主界面
├── index.css          # 样式文件
├── wordlist/          # 单词数据
│   ├── words.json     # 主单词表
│   ├── love.json      # 收藏单词
│   └── easy.json      # 简单单词
└── espeak/            # 语音合成引擎
```

### 数据格式

单词数据采用JSON格式，示例:
```json
{
  "apple": {
    "word": "apple",
    "definition": ["n. 苹果"],
    "phonetic": "/ˈæp.əl/",
    "love": false,
    "easy": false
  }
}
```

### 进程通信

通过预加载脚本安全暴露的API:
```javascript
window.wordMemoryAPI = {
  getWordLists(),
  getWordCurrentList(),
  updateWordList(wordList),
  getWords(),
  getConfig(),
  speak(text),
  changeLove(word),
  changeEasy(word)
}
```

## 构建与发布

使用electron-forge打包应用:

```bash
npm run make
```

生成的可执行文件位于`out/make`目录。

## 贡献指南

欢迎提交Pull Request或Issue。

## 许可证

MIT © xglight

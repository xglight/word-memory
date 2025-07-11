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
  - electron-forge 7.8.1
- **语音合成**:
  - eSpeak (包含完整语音数据)

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
   - 使用复选框标记单词状态：
      - ❤️ 心形复选框：标记/取消标记为收藏单词
      - ✅ 对勾复选框：标记/取消标记为简单单词
      - ⚠️ 感叹号复选框：标记/取消标记为困难单词
   - 标记状态会自动保存并同步到对应单词表

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
├── config.json        # 应用配置
├── forge.config.js    # 打包配置
├── src/               # 源代码目录
│   ├── tools/         # 工具函数
│   │   └── get_word_info.js # 获取单词信息
│   │   └── update_words.js # 更新单词表
│   │   └── check_words.js # 检查单词表
│   │   └── fix_words.js # 修复单词表
│   └── word_memory.ico # 应用图标
├── wordlist/          # 单词数据
│   ├── words.json     # 所有单词
│   ├── love.json      # 收藏单词
│   ├── easy.json      # 简单单词
│   ├── hard.json      # 困难单词
│   ├── ...           # 其他单词表
└── espeak/            # 语音合成引擎
    ├── bin/           # 可执行文件
    └── espeak-data/   # 语音数据
```

### 数据格式

单词数据采用JSON格式，以单词为键，包含以下字段：

```json
{
  "单词": {
    "word": "单词拼写",
    "definition": ["词性. 中文释义"],
    "phonetic": ["音表1", "音标2"],
    "lastReviewed": "日期时间",  // 最后复习时间
    "love": false,           // 是否收藏
    "easy": false,           // 是否标记为简单
    "hard": false,           // 是否标记为困难
    "cnt": 0,                // 复习次数
    "mastery": 0             // 掌握程度(0-100)
  }
}
```

#### 字段说明

| 字段         | 类型        | 必填 | 说明                      |
| ------------ | ----------- | ---- | ------------------------- |
| word         | string      | 是   | 单词拼写                  |
| definition   | array       | 是   | 释义数组                  |
| phonetic     | array       | 是   | 音标数组[美式,英式]       |
| lastReviewed | string/null | 否   | 最后复习时间(ISO格式)     |
| love         | boolean     | 否   | 是否收藏，默认false       |
| easy         | boolean     | 否   | 是否标记为简单，默认false |
| hard         | boolean     | 否   | 是否标记为困难，默认false |
| cnt          | number      | 否   | 复习次数，默认0           |
| mastery      | number      | 否   | 掌握程度(0-100)，默认0    |

#### 完整示例

```json
{
  "apple": {
    "word": "apple",
    "definition": ["n. 苹果公司；【植】苹果；【植】苹果树"],
    "phonetic": ["美: /ˈæp(ə)l/", "英: /ˈæpl/"],
    "lastReviewed": null,
    "love": false,
    "easy": false,
    "hard": false,
    "cnt": 0,
    "mastery": 0
  },
  "computer": {
    "word": "computer",
    "definition": ["n. 计算机；计算器；计算者"],
    "phonetic": ["美: /kəmˈpjutər/", "英: /kəmˈpjuːtə(r)/"],
    "lastReviewed": "2025-07-10T10:30:00Z",
    "love": true,
    "easy": false,
    "hard": false,
    "cnt": 5,
    "mastery": 75
  }
}
```

### eSpeak语音合成

项目内置完整eSpeak语音合成引擎，支持多种语言发音。通过以下API调用:

```javascript
window.wordMemoryAPI.speak(text)
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

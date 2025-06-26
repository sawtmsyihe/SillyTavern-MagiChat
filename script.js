import { getAllStickers } from './sticker-loader.js';


// 面板
const stickerButton = document.createElement('button');
stickerButton.id = 'sticker-picker-button';
stickerButton.innerHTML = '😀';
stickerButton.title = '选择表情包';

const stickerPanel = document.createElement('div');
stickerPanel.id = 'sticker-picker-panel';
stickerPanel.style.display = 'none';
stickerPanel.innerHTML = `
    <button id="add-sticker-button-internal" title="添加新表情">➕</button>
    <div id="sticker-grid"></div>
`;

const addFormPanel = document.createElement('div');
addFormPanel.id = 'add-sticker-form-panel';
addFormPanel.style.display = 'none';
addFormPanel.innerHTML = `
    <input type="text" id="new-sticker-name" class="add-sticker-input" placeholder="输入表情名称 (例如: 狗头)">
    <input type="text" id="new-sticker-url" class="add-sticker-input" placeholder="粘贴图片直链 (https://...)">
    <div id="add-sticker-buttons-container">
         <button id="save-sticker-button">保存</button>
         <button type="button" id="cancel-add-sticker-button">取消</button>
    </div>
`;

const sendForm = document.querySelector('#send_form');
if (sendForm) {
    sendForm.appendChild(stickerButton);
    document.body.appendChild(stickerPanel);
    document.body.appendChild(addFormPanel);
}

// === 第二部分：数据处理与渲染 ===

// loadStickers 函数现在变得非常简洁！
async function loadStickers() {
    const stickerGrid = document.querySelector('#sticker-grid');
    if (!stickerGrid) return;
    stickerGrid.innerHTML = '加载中...'; // 提示用户正在加载

    // 直接调用我们导入的函数！
    const uniqueStickers = await getAllStickers();

    stickerGrid.innerHTML = ''; // 清空“加载中...”
    if (uniqueStickers.length === 0) {
        stickerGrid.innerHTML = '没有表情...';
        return;
    }

    uniqueStickers.forEach(sticker => {
        const img = document.createElement('img');
        img.src = sticker.url;
        img.title = sticker.name;
        img.dataset.name = sticker.name;
        img.dataset.url = sticker.url;
        img.className = 'sticker-item';
        stickerGrid.appendChild(img);
    });
}

// saveSticker 函数保持不变
function saveSticker() {
    const LOCAL_STORAGE_KEY = 'my_user_stickers';
    const nameInput = document.querySelector('#new-sticker-name');
    const urlInput = document.querySelector('#new-sticker-url');
    const newName = nameInput.value.trim();
    const newUrl = urlInput.value.trim();

    if (!newName || !newUrl) {
        alert('名称和链接都不能为空！');
        return;
    }

    const userStickers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    userStickers.push({ name: newName, url: newUrl });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userStickers));

    alert('表情添加成功！');
    nameInput.value = '';
    urlInput.value = '';
    addFormPanel.style.display = 'none';
}

// === 第三部分：事件监听 (这部分逻辑基本不变) ===

stickerButton.addEventListener('click', (event) => {
    event.preventDefault();
    const isVisible = stickerPanel.style.display === 'block';
    stickerPanel.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
        loadStickers();
    }
});

document.body.addEventListener('click', (event) => {
    if (event.target.id === 'add-sticker-button-internal') {
        addFormPanel.style.display = 'block';
        stickerPanel.style.display = 'none';
    }
    if (event.target.id === 'save-sticker-button') {
        saveSticker();
    }
    if (event.target.id === 'cancel-add-sticker-button') {
        addFormPanel.style.display = 'none';
    }
});

stickerPanel.addEventListener('click', (event) => {
    if (event.target.className === 'sticker-item') {
        const sticker = event.target;
        const name = sticker.dataset.name;
        const url = sticker.dataset.url;
        const markdownText = `![${name}](${url})`;
        const textarea = document.querySelector('#send_textarea');
        if (textarea) {
            textarea.value += markdownText;
            textarea.focus();
        }
        stickerPanel.style.display = 'none';
    }
});

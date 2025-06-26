import { getAllStickers } from './sticker-loader.js';

// === 第一部分：创建界面元素 (这部分不变) ===
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

// === 第二部分：数据处理与渲染 (重大升级) ===

const LOCAL_STORAGE_KEY = 'my_user_stickers';

async function loadStickers() {
    const stickerGrid = document.querySelector('#sticker-grid');
    if (!stickerGrid) return;
    stickerGrid.innerHTML = '加载中...';

    // sticker-loader.js 现在帮我们处理好了数据获取和合并
    const uniqueStickers = await getAllStickers();
    const userStickerUrls = new Set(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]').map(s => s.url));

    stickerGrid.innerHTML = '';
    if (uniqueStickers.length === 0) {
        stickerGrid.innerHTML = '没有表情...';
        return;
    }
    
    uniqueStickers.forEach(sticker => {
        // 创建一个新的包裹容器
        const wrapper = document.createElement('div');
        wrapper.className = 'sticker-wrapper';

        // 创建图片元素
        const img = document.createElement('img');
        img.src = sticker.url;
        img.title = sticker.name;
        img.dataset.name = sticker.name;
        img.dataset.url = sticker.url;
        img.className = 'sticker-item';

        // 把图片放进包裹容器
        wrapper.appendChild(img);

        // 【核心逻辑】只为用户自己添加的表情创建删除按钮
        if (userStickerUrls.has(sticker.url)) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-sticker-btn';
            deleteBtn.innerHTML = '×'; // 一个乘号作为删除图标
            deleteBtn.title = '删除这个表情';
            deleteBtn.dataset.url = sticker.url; // 把URL存到按钮上，方便删除时识别
            wrapper.appendChild(deleteBtn);
        }
        
        // 把整个包裹容器添加到网格中
        stickerGrid.appendChild(wrapper);
    });
}

function saveSticker() {
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

// === 第三部分：事件监听 ===

// 主表情按钮的逻辑保持不变
stickerButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation(); 
    const isVisible = stickerPanel.style.display === 'block';
    if (!isVisible) {
        addFormPanel.style.display = 'none';
        loadStickers();
    }
    stickerPanel.style.display = isVisible ? 'none' : 'block';
});

document.body.addEventListener('click', (event) => {
    const target = event.target;
    if (target.id === 'add-sticker-button-internal') {
        addFormPanel.style.display = 'block';
        stickerPanel.style.display = 'none';
    } else if (target.id === 'save-sticker-button') {
        saveSticker();
    } else if (target.id === 'cancel-add-sticker-button') {
        addFormPanel.style.display = 'none';
    } else if (stickerPanel.style.display === 'block' && !stickerPanel.contains(target) && !stickerButton.contains(target)) {
        stickerPanel.style.display = 'none';
    } else if (addFormPanel.style.display === 'block' && !addFormPanel.contains(target)) {
        addFormPanel.style.display = 'none';
    }
});

stickerPanel.addEventListener('click', (event) => {
    const target = event.target;

    // 情况一：点击了删除按钮
    if (target.className === 'delete-sticker-btn') {
        const urlToDelete = target.dataset.url;
        if (confirm('确定要删除这个表情吗？')) {
            let userStickers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
            // 过滤掉要删除的表情
            userStickers = userStickers.filter(s => s.url !== urlToDelete);
            // 保存更新后的列表
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userStickers));
            // 重新加载面板以更新视图
            loadStickers(); 
        }
    }
    // 情况二：点击了表情图片（和以前一样）
    else if (target.className === 'sticker-item') {
        const sticker = target;
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

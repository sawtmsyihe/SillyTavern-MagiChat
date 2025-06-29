import { getAllStickers } from './sticker-loader.js';

// === 全局变量 ===
let allStickersCache = [];
let currentCategory = '全部';

// === HTML结构生成 ===
const qmbButton = document.createElement('button');
qmbButton.id = 'sawtms-qmb-button';
qmbButton.title = '快捷输入';
qmbButton.innerHTML = '🪄';
 

const qmbPanel = document.createElement('div');
qmbPanel.id = 'sawtms-qmb-panel';
qmbPanel.innerHTML = `
    <div class="sawtms-qmb-tabs-container">
        <button class="sawtms-qmb-tab active" data-tab="placeholder">占位符</button> 
        <button class="sawtms-qmb-tab" data-tab="normal">普通</button>
        <button class="sawtms-qmb-tab" data-tab="media">媒体</button>
        <button class="sawtms-qmb-tab" data-tab="voice">语音</button>
        <button class="sawtms-qmb-tab" data-tab="redpacket">红包</button>
        <button class="sawtms-qmb-tab" data-tab="system">系统</button>
        <button class="sawtms-qmb-tab" data-tab="sticker">表情包</button>
    </div>
    <div class="sawtms-qmb-content-container">
        <div id="sawtms-qmb-content-placeholder" class="sawtms-qmb-content-panel active">
             <p style="text-align: center; color: #666;">点击下方按钮<br>插入开始新对话所需的 <b>---message---</b> 占位符。</p>
        </div>
        <div id="sawtms-qmb-content-normal" class="sawtms-qmb-content-panel">
             <textarea id="sawtms-qmb-normal-content" class="sawtms-qmb-input" rows="8" placeholder="输入普通消息..."></textarea>
        </div>
        <div id="sawtms-qmb-content-media" class="sawtms-qmb-content-panel">
            <label class="sawtms-qmb-label">媒体类型:</label>
            <select id="sawtms-qmb-media-type" class="sawtms-qmb-select">
                <option>照片</option><option>图片</option><option>视频</option>
                <option>画作</option><option>定位</option><option>文件</option>
            </select>
            <label class="sawtms-qmb-label">具体描述:</label>
            <input type="text" id="sawtms-qmb-media-desc" class="sawtms-qmb-input" placeholder="输入文字描述...">
        </div>
        <div id="sawtms-qmb-content-voice" class="sawtms-qmb-content-panel">
            <label class="sawtms-qmb-label">语音时长 (秒):</label>
            <input type="number" id="sawtms-qmb-voice-duration" class="sawtms-qmb-input" value="3">
            <label class="sawtms-qmb-label">语音内容:</label>
            <input type="text" id="sawtms-qmb-voice-content" class="sawtms-qmb-input" placeholder="输入语音识别的文字...">
        </div>
        <div id="sawtms-qmb-content-redpacket" class="sawtms-qmb-content-panel">
            <label class="sawtms-qmb-label">金额:</label>
            <input type="text" id="sawtms-qmb-redpacket-amount" class="sawtms-qmb-input" placeholder="例如: 200">
            <label class="sawtms-qmb-label">留言:</label>
            <input type="text" id="sawtms-qmb-redpacket-message" class="sawtms-qmb-input" placeholder="例如: 恭喜发财">
        </div>
        <div id="sawtms-qmb-content-system" class="sawtms-qmb-content-panel">
            <div class="sawtms-system-label-container">
                <label class="sawtms-qmb-label">系统消息内容:</label>
                <button id="sawtms-insert-timestamp-btn" class="sawtms-text-btn">➕ 插入当前时间戳</button>
            </div>
            <textarea id="sawtms-qmb-system-content" class="sawtms-qmb-input" rows="5" placeholder="例如: 我拍了拍char/我领取了char的红包/时间等"></textarea>
        </div>
        <div id="sawtms-qmb-content-sticker" class="sawtms-qmb-content-panel">
            <div id="sawtms-sticker-grid">加载中...</div>
            <div id="sawtms-sticker-categories">
                <button id="sawtms-bulk-import-btn">➕</button>
            </div>
        </div>
    </div>
    <button id="sawtms-qmb-insert-button">插入消息</button>
`;



// 新增：导入面板的HTML结构
const importPanel = document.createElement('div');
importPanel.id = 'sawtms-import-panel';
importPanel.innerHTML = `
    <h3>批量导入表情包</h3>
    <p>请在下方粘贴您的表情包数据，每行一条。<br>格式为: <b>图片链接,表情名称,分类</b> (分类可选)。</p>
    <textarea id="sawtms-import-textarea" class="sawtms-import-textarea" placeholder="例如:\nhttps://example.com/happy.png,开心,日常\nhttps://example.com/sad.gif,难过,日常\nhttps://example.com/wow.jpg,震惊"></textarea>
    <div class="sawtms-import-buttons-container">
        <button id="sawtms-import-cancel-btn" class="sawtms-import-btn">取消</button>
        <button id="sawtms-do-import-btn" class="sawtms-import-btn">导入</button>
    </div>
`;


const sendForm = document.querySelector('#send_form');
if (sendForm) {
    sendForm.appendChild(qmbButton);
    document.body.appendChild(qmbPanel);
    document.body.appendChild(importPanel); // 将导入面板也添加到页面
}

// === 核心逻辑与事件监听 ===
const qmbTabs = qmbPanel.querySelectorAll('.sawtms-qmb-tab');
const qmbContentPanels = qmbPanel.querySelectorAll('.sawtms-qmb-content-panel');
const insertButton = document.getElementById('sawtms-qmb-insert-button');
const stickerGrid = document.getElementById('sawtms-sticker-grid');
const stickerCategoriesContainer = document.getElementById('sawtms-sticker-categories');

function insertText(textToInsert) {
    if (textToInsert === null || typeof textToInsert === 'undefined') return;
    const textarea = document.querySelector('#send_textarea');
    if (textarea.value.trim().length > 0) {
        textarea.value += `\n${textToInsert}`;
    } else {
        textarea.value = textToInsert;
    }
    textarea.focus();
    textarea.scrollTop = textarea.scrollHeight;
}

// 省略未变的渲染函数以保持简洁...
function renderCategories() {
    // 先找到静态的导入按钮
    const importBtn = stickerCategoriesContainer.querySelector('#sawtms-bulk-import-btn');
    // 清空容器，但保留导入按钮
    stickerCategoriesContainer.innerHTML = '';
    stickerCategoriesContainer.appendChild(importBtn);

    // 创建一个新容器来放动态分类
    const dynamicCategoriesContainer = document.createElement('div');
    dynamicCategoriesContainer.style.display = 'flex';
    dynamicCategoriesContainer.style.overflowX = 'auto';

    const categories = ['全部', ...new Set(allStickersCache.map(s => s.category || '未分类'))];
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'sawtms-category-btn';
        btn.textContent = category;
        btn.dataset.category = category;
        if (category === currentCategory) {
            btn.classList.add('active');
        }
        dynamicCategoriesContainer.appendChild(btn);
    });
    stickerCategoriesContainer.appendChild(dynamicCategoriesContainer);
}
function renderStickerGrid() {
    stickerGrid.innerHTML = '';
    const stickersToShow = currentCategory === '全部'
        ? allStickersCache
        : allStickersCache.filter(s => (s.category || '未分类') === currentCategory);

    if (stickersToShow.length === 0) {
        stickerGrid.innerHTML = '这个分类下没有表情...';
        return;
    }
    const userStickerUrls = new Set(JSON.parse(localStorage.getItem('my_user_stickers') || '[]').map(s => s.url));
    stickersToShow.forEach(sticker => {
        const wrapper = document.createElement('div');
        wrapper.className = 'sawtms-sticker-wrapper';
        const img = document.createElement('img');
        img.src = sticker.url;
        img.title = sticker.name;
        img.dataset.name = sticker.name;
        img.dataset.url = sticker.url;
        img.className = 'sawtms-sticker-item';
        wrapper.appendChild(img);
        // data: URL被认为是用户自己的表情，可以删除
        if (userStickerUrls.has(sticker.url) || sticker.url.startsWith('data:image')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'sawtms-delete-sticker-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = '删除这个表情';
            deleteBtn.dataset.url = sticker.url;
            wrapper.appendChild(deleteBtn);
        }
        stickerGrid.appendChild(wrapper);
    });
}
async function loadAndRenderStickers() {
    stickerGrid.innerHTML = '加载中...';
    try {
        allStickersCache = await getAllStickers();
        renderCategories();
        renderStickerGrid();
    } catch (error) {
        stickerGrid.innerHTML = '加载表情失败...';
        console.error('Failed to load stickers:', error);
    }
}

// ... 省略其他未变的事件监听器 ...
qmbTabs.forEach(tab => {
    tab.addEventListener('click', async (e) => {
        e.stopPropagation();
        qmbTabs.forEach(t => t.classList.remove('active'));
        qmbContentPanels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        document.getElementById(`sawtms-qmb-content-${tabName}`).classList.add('active');
        if (tabName === 'sticker') {
            await loadAndRenderStickers();
            insertButton.style.display = 'none';
        } else {
            insertButton.style.display = 'block';
        }
    });
});
insertButton.addEventListener('click', () => {
    const activeTab = qmbPanel.querySelector('.sawtms-qmb-tab.active').dataset.tab;
    let textToInsert = '';
    switch (activeTab) {
        case 'normal':
            textToInsert = `"${document.getElementById('sawtms-qmb-normal-content').value}"`; break;
        case 'media':
            textToInsert = `[${document.getElementById('sawtms-qmb-media-type').value}: ${document.getElementById('sawtms-qmb-media-desc').value}]`; break;
        case 'voice':
            textToInsert = `（语音${document.getElementById('sawtms-qmb-voice-duration').value}'：${document.getElementById('sawtms-qmb-voice-content').value}）`; break;
        case 'redpacket':
            textToInsert = `🧧${document.getElementById('sawtms-qmb-redpacket-amount').value}|${document.getElementById('sawtms-qmb-redpacket-message').value}`; break;
        case 'system':
            textToInsert = `『${document.getElementById('sawtms-qmb-system-content').value}』`; break;
        case 'placeholder':
            textToInsert = '---message---'; break;
    }
    insertText(textToInsert);
    switch (activeTab) {
        case 'normal':
            document.getElementById('sawtms-qmb-normal-content').value = ''; break;
        case 'media':
            document.getElementById('sawtms-qmb-media-desc').value = ''; break;
        case 'voice':
            document.getElementById('sawtms-qmb-voice-content').value = ''; break;
        case 'redpacket':
            document.getElementById('sawtms-qmb-redpacket-amount').value = '';
            document.getElementById('sawtms-qmb-redpacket-message').value = ''; break;
        case 'system':
            document.getElementById('sawtms-qmb-system-content').value = ''; break;
    }
});
const stickerContentPanel = document.getElementById('sawtms-qmb-content-sticker');
stickerContentPanel.addEventListener('click', (event) => {
    event.stopPropagation();
    const target = event.target;
    if (target.id === 'sawtms-bulk-import-btn') {
        importPanel.style.display = 'flex';
        return;
    }
    // --- 点击分类按钮 ---
    if (target.classList.contains('sawtms-category-btn')) {
        currentCategory = target.dataset.category;
        const allCategoryBtns = stickerCategoriesContainer.querySelectorAll('.sawtms-category-btn');
        allCategoryBtns.forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');
        renderStickerGrid();
        return;
    }
    if (target.classList.contains('sawtms-delete-sticker-btn')) {
        const urlToDelete = target.dataset.url;
        if (confirm('确定要删除这个表情吗？')) {
            let userStickers = JSON.parse(localStorage.getItem('my_user_stickers') || '[]');
            userStickers = userStickers.filter(s => s.url !== urlToDelete);
            localStorage.setItem('my_user_stickers', JSON.stringify(userStickers));
            loadAndRenderStickers();
        }
        return;
    }
    if (target.classList.contains('sawtms-sticker-item')) {
        const name = target.dataset.name || 'sticker';
        const url = target.dataset.url;
        const textToInsert = `![${name}](${url})`; 
        insertText(textToInsert);
        return;
    }
});
qmbButton.addEventListener('click', (event) => {
    event.stopPropagation();
    qmbPanel.style.display = qmbPanel.style.display === 'flex' ? 'none' : 'flex';
});
document.addEventListener('click', (event) => {
    if (qmbPanel.style.display === 'flex' && !qmbPanel.contains(event.target) && !qmbButton.contains(event.target)) {
        qmbPanel.style.display = 'none';
    }
});
const dragHandle = qmbPanel.querySelector('.sawtms-qmb-tabs-container');
function savePanelPosition(top, left) {
    localStorage.setItem('sawtms-panel-position', JSON.stringify({ top, left }));
}
function loadPanelPosition() {
    const savedPos = JSON.parse(localStorage.getItem('sawtms-panel-position'));
    if (savedPos && savedPos.top && savedPos.left) {
        qmbPanel.style.top = savedPos.top;
        qmbPanel.style.left = savedPos.left;
        qmbPanel.style.bottom = 'auto';
        qmbPanel.style.right = 'auto';
    }
}
dragHandle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const rect = qmbPanel.getBoundingClientRect();
    qmbPanel.style.top = `${rect.top}px`;
    qmbPanel.style.left = `${rect.left}px`;
    qmbPanel.style.bottom = 'auto';
    qmbPanel.style.right = 'auto';
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const onMouseMove = (moveEvent) => {
        let newLeft = moveEvent.clientX - offsetX;
        let newTop = moveEvent.clientY - offsetY;
        const maxLeft = window.innerWidth - qmbPanel.offsetWidth;
        const maxTop = window.innerHeight - qmbPanel.offsetHeight;
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
        qmbPanel.style.left = `${newLeft}px`;
        qmbPanel.style.top = `${newTop}px`;
    };
    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        savePanelPosition(qmbPanel.style.top, qmbPanel.style.left);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
});
loadPanelPosition();


// =======================================================
// 【新增】批量导入文本功能
// =======================================================
const bulkImportBtn = document.getElementById('sawtms-bulk-import-btn');
const importCancelBtn = document.getElementById('sawtms-import-cancel-btn');
const doImportBtn = document.getElementById('sawtms-do-import-btn');
const importTextarea = document.getElementById('sawtms-import-textarea');

// 点击“批量导入”按钮，显示导入面板
bulkImportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    importPanel.style.display = 'flex';
});

// 点击“取消”按钮，隐藏导入面板
importCancelBtn.addEventListener('click', () => {
    importPanel.style.display = 'none';
});

// 点击“导入”按钮，执行核心逻辑
doImportBtn.addEventListener('click', async () => {
    const text = importTextarea.value;
    if (!text.trim()) {
        alert('请输入要导入的数据！');
        return;
    }

    const lines = text.split('\n');
    const userStickers = JSON.parse(localStorage.getItem('my_user_stickers') || '[]');
    const existingUrls = new Set(userStickers.map(s => s.url));
    let newStickersCount = 0;
    
    lines.forEach(line => {
        if (!line.trim()) return; // 跳过空行

        const parts = line.split(',');
        const url = parts[0]?.trim();
        const name = parts[1]?.trim();
        const category = parts[2]?.trim() || '未分类';

        // 基础验证：必须有链接和名称，且链接不能重复
        if (url && name && !existingUrls.has(url)) {
            userStickers.push({ url, name, category });
            existingUrls.add(url); // 保证本次导入的内部也不重复
            newStickersCount++;
        }
    });

    if (newStickersCount > 0) {
        localStorage.setItem('my_user_stickers', JSON.stringify(userStickers));
        alert(`成功导入了 ${newStickersCount} 个新表情！`);
        // 刷新列表
        await loadAndRenderStickers();
    } else {
        alert('没有导入任何新表情。可能是因为格式不正确或链接已存在。');
    }

    // 清空文本框并关闭面板
    importTextarea.value = '';
    importPanel.style.display = 'none';
});

// =======================================================
// 【新增】为系统消息快捷插入时间戳
// =======================================================
const insertTimestampBtn = document.getElementById('sawtms-insert-timestamp-btn');
const systemTextarea = document.getElementById('sawtms-qmb-system-content');

insertTimestampBtn.addEventListener('click', (e) => {
    e.preventDefault(); // 防止意外行为
    
    const timestampText = '{{isodate}} {{isotime}}';
    
    // 如果输入框不为空，就在前面加一个空格
    const separator = systemTextarea.value.trim().length > 0 ? ' ' : '';
    
    // 将时间戳变量插入到文本框
    systemTextarea.value += separator + timestampText;
    
    // 插入后，让光标聚焦在文本框，方便继续输入
    systemTextarea.focus();
});

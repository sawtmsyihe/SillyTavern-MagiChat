import { getAllStickers } from './sticker-loader.js';

// === 全局变量，用于存储所有表情和当前分类 ===
let allStickersCache = [];
let currentCategory = '全部';

// === 第一部分：创建界面元素 ===
const stickerButton = document.createElement('button');
stickerButton.id = 'sticker-picker-button';
stickerButton.innerHTML = '😀';
stickerButton.title = '选择表情包';

const stickerPanel = document.createElement('div');
stickerPanel.id = 'sticker-picker-panel';
stickerPanel.style.display = 'none';
// 面板内部结构现在包含网格和分类导航栏
stickerPanel.innerHTML = `
    <button id="add-sticker-button-internal" title="添加新表情">➕</button>
    <div id="sticker-grid"></div>
    <div id="sticker-categories"></div>
`;

// 添加表情的表单现在需要一个分类输入框
const addFormPanel = document.createElement('div');
addFormPanel.id = 'add-sticker-form-panel';
addFormPanel.style.display = 'none';
addFormPanel.innerHTML = `
    <input type="text" id="new-sticker-name" class="add-sticker-input" placeholder="输入表情名称">
    <input type="text" id="new-sticker-url" class="add-sticker-input" placeholder="粘贴图片直链">
    <input type="text" id="new-sticker-category" class="add-sticker-input" placeholder="输入或选择分类 (例如: 日常)">
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

// === 第二部分：核心功能函数 ===

// 渲染分类导航栏
function renderCategories() {
    const categoriesContainer = document.querySelector('#sticker-categories');
    if (!categoriesContainer) return;

    // 从所有表情中提取出不重复的分类名
    const categories = ['全部', ...new Set(allStickersCache.map(s => s.category || '未分类'))];
    
    categoriesContainer.innerHTML = '';
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = category;
        btn.dataset.category = category;
        if (category === currentCategory) {
            btn.classList.add('active'); // 高亮当前分类
        }
        categoriesContainer.appendChild(btn);
    });
}

// 根据当前选择的分类，渲染表情网格
function renderStickerGrid() {
    const stickerGrid = document.querySelector('#sticker-grid');
    if (!stickerGrid) return;
    stickerGrid.innerHTML = '';

    // 过滤出属于当前分类的表情
    const stickersToShow = currentCategory === '全部'
        ? allStickersCache
        : allStickersCache.filter(s => (s.category || '未分类') === currentCategory);

    if (stickersToShow.length === 0) {
        stickerGrid.innerHTML = '这个分类下没有表情...';
        return;
    }

    // (渲染单个表情的逻辑和V5一样，带删除按钮)
    const userStickerUrls = new Set(JSON.parse(localStorage.getItem('my_user_stickers') || '[]').map(s => s.url));
    stickersToShow.forEach(sticker => {
        const wrapper = document.createElement('div');
        wrapper.className = 'sticker-wrapper';
        const img = document.createElement('img');
        img.src = sticker.url;
        img.title = sticker.name;
        img.dataset.name = sticker.name;
        img.dataset.url = sticker.url;
        img.className = 'sticker-item';
        wrapper.appendChild(img);
        if (userStickerUrls.has(sticker.url)) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-sticker-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = '删除这个表情';
            deleteBtn.dataset.url = sticker.url;
            wrapper.appendChild(deleteBtn);
        }
        stickerGrid.appendChild(wrapper);
    });
}

// 主加载函数：先获取所有数据，再渲染UI
async function loadAndRender() {
    const stickerGrid = document.querySelector('#sticker-grid');
    if (stickerGrid) stickerGrid.innerHTML = '加载中...';
    
    allStickersCache = await getAllStickers(); // 从loader获取所有表情数据
    currentCategory = '全部'; // 每次打开都默认显示“全部”
    
    renderCategories();    // 渲染分类栏
    renderStickerGrid(); // 渲染表情网格
}

// 保存新表情的函数现在需要保存分类
function saveSticker() {
    const nameInput = document.querySelector('#new-sticker-name');
    const urlInput = document.querySelector('#new-sticker-url');
    const categoryInput = document.querySelector('#new-sticker-category');
    
    const newSticker = {
        name: nameInput.value.trim(),
        url: urlInput.value.trim(),
        category: categoryInput.value.trim() || '未分类' // 如果不填分类，默认为“未分类”
    };

    if (!newSticker.name || !newSticker.url) {
        alert('名称和链接都不能为空！');
        return;
    }

    const userStickers = JSON.parse(localStorage.getItem('my_user_stickers') || '[]');
    userStickers.push(newSticker);
    localStorage.setItem('my_user_stickers', JSON.stringify(userStickers));

    alert('表情添加成功！');
    nameInput.value = '';
    urlInput.value = '';
    categoryInput.value = '';
    addFormPanel.style.display = 'none';
}

// === 第三部分：事件监听 ===

// 点击主表情按钮
stickerButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation(); 
    const isVisible = stickerPanel.style.display === 'block';
    if (!isVisible) {
        addFormPanel.style.display = 'none';
        loadAndRender(); // 调用新的主加载函数
    }
    stickerPanel.style.display = isVisible ? 'none' : 'block';
});

// 点击分类导航栏
stickerPanel.addEventListener('click', (event) => {
    if (event.target.classList.contains('category-btn')) {
        event.stopPropagation(); 
        currentCategory = event.target.dataset.category;
        renderCategories(); // 重新渲染分类栏以更新高亮状态
        renderStickerGrid(); // 重新渲染表情网格
    }
});

// 全局点击事件处理（处理添加、保存、取消、关闭面板等）
document.body.addEventListener('click', (event) => {
    const target = event.target;
    if (target.id === 'add-sticker-button-internal') {
        // (这里我们暂时移除添加按钮，因为面板结构变了，后续再加回来)
        // 实际上，添加功能现在应该通过一个专门的按钮触发，
        // 为简化，我们暂时把添加按钮放在面板里
        const addFormPanel = document.querySelector('#add-sticker-form-panel');
        addFormPanel.style.display = 'block';
        stickerPanel.style.display = 'none';
    } else if (target.id === 'save-sticker-button') {
        saveSticker();
    } else if (target.id === 'cancel-add-sticker-button') {
        const addFormPanel = document.querySelector('#add-sticker-form-panel');
        addFormPanel.style.display = 'none';
    } else if (stickerPanel.style.display === 'block' && !stickerPanel.contains(target) && !stickerButton.contains(target)) {
        stickerPanel.style.display = 'none';
    } else if (addFormPanel.style.display === 'block' && !addFormPanel.contains(target)) {
        const addFormPanel = document.querySelector('#add-sticker-form-panel');
        addFormPanel.style.display = 'none';
    }
});

// 表情网格内的点击事件（选择表情 或 删除表情）
document.querySelector('#sticker-grid').addEventListener('click', (event) => {
    const target = event.target;
    if (target.className === 'delete-sticker-btn') {
        const urlToDelete = target.dataset.url;
        if (confirm('确定要删除这个表情吗？')) {
            let userStickers = JSON.parse(localStorage.getItem('my_user_stickers') || '[]');
            userStickers = userStickers.filter(s => s.url !== urlToDelete);
            localStorage.setItem('my_user_stickers', JSON.stringify(userStickers));
            loadAndRender(); // 重新加载以更新视图
        }
    } else if (target.className === 'sticker-item') {
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

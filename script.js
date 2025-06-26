(function () {
    const LOCAL_STORAGE_KEY = 'my_user_stickers';

    // === 第一部分：创建界面元素 ===

    // 1. 只创建“选择表情”按钮 😀
    const stickerButton = document.createElement('button');
    stickerButton.id = 'sticker-picker-button';
    stickerButton.innerHTML = '😀';
    stickerButton.title = '选择表情包';

    // 2. 创建表情包选择面板
    const stickerPanel = document.createElement('div');
    stickerPanel.id = 'sticker-picker-panel';
    stickerPanel.style.display = 'none';
    // 【V3.0 升级】面板内部结构更复杂了
    stickerPanel.innerHTML = `
        <button id="add-sticker-button-internal" title="添加新表情">➕</button>
        <div id="sticker-grid"></div>
    `;

    // 3. 创建添加新表情的表单面板 (这部分不变)
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

    // 4. 把所有元素“安装”到页面上
    const sendForm = document.querySelector('#send_form');
    if (sendForm) {
        sendForm.appendChild(stickerButton); // 现在只把主按钮加到输入框旁
        document.body.appendChild(stickerPanel);
        document.body.appendChild(addFormPanel);
    }

    // === 第二部分：数据处理 (加载和保存) ===

    // loadStickers 函数和 saveSticker 函数和 V2.0 完全一样，这里不再重复展示，
    // 您只需确保您的代码里有这两个函数即可。为方便您，下面还是贴出完整代码。

    async function loadStickers() {
        // 【V3.0 升级】现在要找到新的网格容器来清空和添加表情
        const stickerGrid = document.querySelector('#sticker-grid');
        if (!stickerGrid) return;
        stickerGrid.innerHTML = '';

        try {
            const defaultStickersPromise = fetch('/scripts/extensions/SillyTavern-Sticker-Picker/stickers.json').then(res => res.json());
            const userStickers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
            const defaultStickers = await defaultStickersPromise;
            const allStickers = [...defaultStickers, ...userStickers];
            const uniqueStickers = Array.from(new Map(allStickers.map(s => [s.url, s])).values());

            uniqueStickers.forEach(sticker => {
                const img = document.createElement('img');
                img.src = sticker.url;
                img.title = sticker.name;
                img.dataset.name = sticker.name;
                img.dataset.url = sticker.url;
                img.className = 'sticker-item';
                stickerGrid.appendChild(img); // 把表情加到网格里
            });
        } catch (error) {
            console.error('加载表情包数据失败:', error);
            stickerGrid.innerHTML = '加载失败...';
        }
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
        // 注意：添加成功后不再需要重新加载，因为下次打开表情面板时会自动加载
    }

    // === 第三部分：处理用户的点击操作 ===

    // 1. 点击主表情按钮 😀
    stickerButton.addEventListener('click', (event) => {
        event.preventDefault();
        const isVisible = stickerPanel.style.display === 'block';
        stickerPanel.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            loadStickers(); // 只有在打开面板时才加载表情
        }
    });

    // 2. 点击面板或表单上的按钮
    document.body.addEventListener('click', (event) => {
        // 点击面板内部的“添加”按钮 ➕
        if (event.target.id === 'add-sticker-button-internal') {
            addFormPanel.style.display = 'block'; // 显示添加表单
            stickerPanel.style.display = 'none';  // 同时隐藏表情选择面板
        }
        // 点击表单内部的“保存”按钮
        if (event.target.id === 'save-sticker-button') {
            saveSticker();
        }
        // 【新增】点击表单内部的“取消”按钮
        if (event.target.id === 'cancel-add-sticker-button') {
            addFormPanel.style.display = 'none'; // 直接隐藏表单即可
        }
    });

    // 3. 点击某个表情图片 (和以前一样)
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

})();
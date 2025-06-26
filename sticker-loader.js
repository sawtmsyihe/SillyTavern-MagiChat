const LOCAL_STORAGE_KEY = 'my_user_stickers';

export async function getAllStickers() {
    try {
        const stickersJsonUrl = new URL('./stickers.json', import.meta.url);

        // 3. 使用这个绝对正确的动态路径去获取数据
        const response = await fetch(stickersJsonUrl);
        if (!response.ok) {
            // 如果文件没找到(404)或服务器出错，就抛出错误
            throw new Error(`加载默认表情失败: ${response.statusText}`);
        }
        const defaultStickers = await response.json();

        // 从浏览器本地存储加载用户自己添加的表情
        const userStickers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');

        // 合并默认表情和用户表情，并去除重复项
        const allStickers = [...defaultStickers, ...userStickers];
        const uniqueStickers = Array.from(new Map(allStickers.map(s => [s.url, s])).values());

        return uniqueStickers;

    } catch (error) {
        console.error('获取表情包数据时发生严重错误:', error);
        // 如果出错，返回一个空数组，避免整个插件崩溃
        return [];
    }
}
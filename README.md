# Animix Telegram 小程序机器人
![banner](img/image.png)

本脚本用于自动化执行Animix Telegram小程序中的各种任务。

## 功能特性

- **自动加入/领取任务**
- **自动抽取新宠物**
- **自动完成任务**
- **自动合并宠物**
- **自动领取奖励**
- **支持多账号**
- **支持代理使用**

## 环境要求

- 已安装Node.js
- `users.txt`文件包含用户数据，获取方法如下：
- 打开Animix Telegram小程序 [https://t.me/animix_game_bot](https://t.me/animix_game_bot?startapp=A2veN3aAUJqc)
- 按F12打开开发者工具
- 在Session Storage中找到`tgWebAppData`并复制所有值。`user=....`
![usersData](img/image-1.png)

## 安装步骤

1. 克隆仓库：
    ```sh
    git clone https://github.com/huaguihai/animixBot.git
    cd animixBot
    ```

2. 安装依赖：
    ```sh
    npm install
    ```
3. 在`users.txt`文件中输入用户数据，每行一个用户：
    ```sh
    nano users.txt
    ```
4. 可选：使用代理：
- 将代理粘贴到`proxy.txt`文件中，格式为`http://用户名:密码@IP:端口`
    ```sh
    nano proxy.txt
    ```
5. 运行脚本：
    ```sh
    npm run start
    ```

## ![许可证: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

本项目采用 [MIT 许可证](LICENSE)。

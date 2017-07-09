const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const dialog = electron.dialog;
const Tray = electron.Tray;
const rendererVal = require('electron-renderer-value');
const path = require('path');
const url = require('url');
const menu = require('./menu');
const Promise = require('bluebird');
const fs = require('./common/fs');
const ipcMain = electron.ipcMain;
const utils = require('ntils');
const update = require('./update');
const shell = electron.shell;
const globalShortcut = electron.globalShortcut;
const sleep = require('./common/sleep');
const i18n = require('./i18n');
const stp = require('stp');
const pkg = require('../package');
const hosts = require('./hosts');
const sudo = require('sudo-prompt');
const os = require('os');

const ENV_NAME = `${pkg.name}_env`;

if (process.env[ENV_NAME] != 'root') {
  let options = {
    name: pkg.displayName,
    icns: path.resolve(__dirname, '../design/icon.png')
  };
  sudo.exec(`${ENV_NAME}=root ${process.execPath}`, options, (error, stdout, stderr) => {
    if (!error) return;
    dialog.showMessageBox(null, {
      type: 'error',
      buttons: [locale.close],
      message: 'Error',
      detail: JSON.stringify(error)
    });
  });
  setTimeout(() => {
    app.quit();
  }, 500);
  return;
}

// 保持所有对于 window 对象的全局引用，如果你不这样做，
// 当 JavaScript 对象被垃圾回收， window 会被自动地关闭
let singleWindow;

/**
 * 创建应用主窗口
 * @returns {BrowserWindow} 应用窗口
 */
app.createWindow = function createWindow() {
  // 创建浏览器窗口。
  singleWindow = new BrowserWindow({
    backgroundColor: '#ffffff',
    width: 900,
    height: 500,
    minWidth: 600,
    minHeight: 371,
    titleBarStyle: 'hidden-inset',
    frame: false,
    show: false
  });
  // 当 window 被关闭，这个事件会被触发。
  singleWindow.on('closed', () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    singleWindow = null;
  });
  //对话框偏移量，针对打开保存等弹出窗口
  singleWindow.setSheetOffset(0);
  //不可全屏
  singleWindow.setFullScreenable(false);
  // 加载应用的 index.html。
  singleWindow.loadURL(url.format({
    pathname: path.resolve(__dirname, './window/index.html'),
    protocol: 'file:',
    slashes: true
  }));
  //确定新窗口的位置
  let activeWindow = BrowserWindow.getFocusedWindow();
  if (activeWindow) {
    let position = activeWindow.getPosition();
    singleWindow.setPosition(position[0] + 30, position[1] + 30);
  }
  //返回 Promise
  return new Promise(resolve => {
    //优雅的显示窗口
    singleWindow.once('ready-to-show', () => {
      singleWindow.show();
      resolve(singleWindow);
    });
  });
};

app.showWindow = async function () {
  if (singleWindow) {
    return singleWindow.focus();
  }
  let data = await hosts.load();
  await this.createTray(data);
  await this.createWindow();
  singleWindow.webContents.send('load', data);
};

let tray = null;
app.createTray = function (list) {
  list = list || [];
  if (!tray) {
    tray = new Tray(path.resolve(__dirname, '../design/tray.png'));
    tray.setToolTip('This is my application.');
  }
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口', type: 'normal', click() {
        app.showWindow();
      }
    },
    { type: 'separator' },
    ...list.filter(item => item.type != 'manifest').map(item => ({
      label: item.name, type: 'checkbox', checked: item.checked,
      click() {
        item.checked = !item.checked;
        if (singleWindow) {
          singleWindow.webContents.send('load', list);
        } else {
          hosts.save(list);
        }
      }
    })),
    { type: 'separator' },
    {
      label: '退出应用', type: 'normal', click() {
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
};

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  // 在这文件，你可以续写应用剩下主进程代码。
  // 也可以拆分成几个文件，然后用 require 导入。
  if (singleWindow === null) {
    app.showWindow();
  }
})

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', async () => {
  await app.loadLocale();
  app.createMenu();
  app.showWindow();
  app.bindDevShortcuts();
  await sleep(3000);
  app.checkUpdate();
});

//创建主菜单
app.createMenu = async function () {
  return Menu.setApplicationMenu(await menu.createMain());
};

//弹出内容菜单
app.popupContextMenu = async function () {
  let contextMenu = await menu.createContextMenu();
  contextMenu.popup(singleWindow);
};

//绑定开发人员快捷键
app.bindDevShortcuts = function () {
  globalShortcut.register('CommandOrControl+Shift+Alt+I', () => {
    if (!singleWindow) return;
    singleWindow.webContents.toggleDevTools();
  });
  globalShortcut.register('CommandOrControl+Shift+Alt+R', () => {
    if (!singleWindow) return;
    singleWindow.webContents.reloadIgnoringCache();
  });
};

//在收到弹出内容菜单时
ipcMain.on('contextmenu', function (event) {
  app.popupContextMenu();
});

//在收到保存数据时
ipcMain.on('save', async function (event, data) {
  await hosts.save(data);
  await app.createTray(data);
});

//在收到保存数据时
ipcMain.on('download', async function (event, data) {
  try {
    await hosts.download();
    await app.sendData();
  } catch (err) {
    let detail = process.env.NODE_ENV ?
      `${err.message}${os.EOL}${err.stack}` :
      err.message;
    dialog.showMessageBox(null, {
      type: 'warning',
      buttons: [locale.close],
      message: '警告',
      detail: detail
    });
  }
});

app.sendData = async function () {
  if (!singleWindow) return;
  let data = await hosts.load();
  singleWindow.webContents.send('load', data);
};

//检查更新
app.checkUpdate = async function (force) {
  let locale = i18n.locale;
  let info = await update.check(force);
  if (!info && !force) {
    return;
  } else if (!info) {
    return dialog.showMessageBox(null, {
      type: 'question',
      buttons: [locale.close],
      message: locale.checkUpdate,
      detail: locale.currentlyTheLatestVersion
    });
  }
  let result = dialog.showMessageBox(null, {
    type: 'question',
    buttons: [locale.goDownload, locale.donNotUpdate],
    defaultId: 0,
    cancelId: 1,
    message: `${locale.discoverNewVersion} ${info.version}`,
    detail: info.detail || locale.recommendDownload
  });
  if (result == 1) return;
  shell.openExternal(info.url);
};

//广播一个事件
app.dispatch = function (event, value) {
  windows.forEach(window => {
    window.webContents.send(event, value);
  });
};

//加载国际化资源
app.loadLocale = async function () {
  global.locale = await i18n.load();
  return global.locale;
};

//广播国际化资源
app.dispatchLocale = async function () {
  let locale = await this.loadLocale();
  this.dispatch('locale', locale);
};
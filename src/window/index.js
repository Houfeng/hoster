const mokit = require('mokit');
const ipcRenderer = require('electron').ipcRenderer;
const utils = require('ntils');
const Slide = require('./slide');
const Editor = require('./editor');

//初始处理
window.open = function (url) {
  remote.shell.openExternal(url);
};

//context
const ctx = window.ctx = mokit({
  element: document.querySelector('.app'),
  components: { Slide, Editor },
  data() {
    return {
      list: [],
      selectedItem: {},
      editItem: {}
    };
  },
  watch: {
    list(data) {
      ipcRenderer.send('save', data);
    }
  }
}).start();

//在收到文件内容时
ipcRenderer.on('load', function (event, data) {
  let list = data || [];
  let remoteList = list.filter(item => item.type == 'remote');
  let localList = list.filter(item => item.type == 'local');
  let manifestList = list.filter(item => item.type == 'manifest');
  ctx.list = remoteList.concat(localList, manifestList);
  if (!ctx.selectedItem.type) ctx.selectedItem = list[0] || {};
  ctx.editor.downloading = false;
});
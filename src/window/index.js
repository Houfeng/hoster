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
  ctx.list = data;
  ctx.selectedItem = data[0];
});
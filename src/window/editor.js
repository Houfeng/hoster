const mokit = require('mokit');
const template = require('../common/template');
const os = require('os');
const ipcRenderer = require('electron').ipcRenderer;

module.exports = new mokit.Component({
  template: template('.editor'),

  props: {

    item: { value: {} },

    //记录条数
    count() {
      if (!this.item) return 0;
      this.item.content = this.item.content || '';
      return this.item.content.split(os.EOL)
        .filter(item => {
          let trimedItem = item.trim();
          return trimedItem && /^[a-z0-9]/i.test(trimedItem);
        }).length;
    }
  },

  contextmenu() {
    ipcRenderer.send('contextmenu');
  }

});
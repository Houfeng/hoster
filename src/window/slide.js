const mokit = require('mokit');
const template = require('../common/template');
const utils = require('ntils');

module.exports = new mokit.Component({
  template: template('.slide'),

  props: {
    selectedItem: null,
    editItem: null,
    list: {
      value: []
    }
  },

  //编辑一项
  edit(item) {
    if (item && item.type != 'local') return;
    this.editItem = item;
  },

  //选择一项
  select(item) {
    this.selectedItem = item;
  },

  //添加一项
  add() {
    let item = {
      id: utils.newGuid(),
      type: 'local',
      name: '新配置',
      content: '',
      checked: true
    };
    this.list.push(item);
    this.select(item);
    this.edit(item);
  },

  //移除
  remove(item, event) {
    if (event) event.stopPropagation();
    let index = this.list.findIndex(i => i == item);
    this.list.splice(index, 1);
  }

});
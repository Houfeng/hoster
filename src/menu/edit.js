const app = require('electron').app;
const i18n = require('../i18n');

module.exports = async () => {
  let locale = i18n.locale;
  return {
    label: locale.edit,
    submenu: [
      {
        label: locale.cut,
        role: 'cut'
      },
      {
        label: locale.copy,
        role: 'copy'
      },
      {
        label: locale.paste,
        role: 'paste'
      },
      {
        label: locale.delete,
        role: 'delete'
      },
      {
        label: locale.selectAll,
        role: 'selectall'
      },
      {
        type: 'separator'
      }
    ]
  };
};
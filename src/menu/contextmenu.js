const electron = require('electron');
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const i18n = require('../i18n');

module.exports = async () => {
  let locale = i18n.locale;
  const items = [
    {
      label: locale.cut,
      role: 'cut',
      accelerator: 'CmdOrCtrl+X'
    },
    {
      label: locale.copy,
      role: 'copy',
      accelerator: 'CmdOrCtrl+C'
    },
    {
      label: locale.paste,
      role: 'paste',
      accelerator: 'CmdOrCtrl+V'
    },
    {
      label: locale.delete,
      role: 'delete'
    },
    {
      type: 'separator'
    },
    {
      label: locale.selectAll,
      role: 'selectall',
      accelerator: 'CmdOrCtrl+A'
    }
  ];

  const menu = new Menu();
  items.forEach(item => {
    menu.append(new MenuItem(item));
  });

  return menu;
};
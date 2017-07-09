const fs = require('../common/fs');
const path = require('path');
const mkdirp = require('../common/mkdirp');
const os = require('os');
const fetch = require('node-fetch');
const i18n = require('../i18n');
const utils = require('../common/utils');

const SYSTEM_HOSTS_FILE = '/etc/hosts';
const DATA_DIR_NAME = process.env.NODE_ENV == 'dev' ? '.hoster-dev' : '.hoster';
const DATA_PATH = path.normalize(`${process.env.HOME}/${DATA_DIR_NAME}`);
const DATA_FILE = path.normalize(`${DATA_PATH}/hosts`);
const MANIFEST_FILE = path.normalize(`${DATA_PATH}/manifest`);
const DEFAULT_HOSTS_FILE = path.normalize(`${__dirname}/default.txt`);

const COMMENT_REGEXP = /^#\s*(.+)/;

exports.load = async function () {
  await mkdirp(DATA_PATH);
  let list;
  try {
    let buffer = await fs.readFile(DATA_FILE);
    list = JSON.parse(buffer.toString()) || [];
  } catch (err) {
    if (err) console.error(err);
    list = [];
  }
  return list;
};

exports.getDefault = async function () {
  if (!this.defaultHosts) {
    let buffer = await fs.readFile(DEFAULT_HOSTS_FILE);
    this.defaultHosts = {
      name: 'system',
      type: 'system',
      content: buffer.toString()
    };
  }
  return this.defaultHosts;
};

exports.save = async function (list) {
  if (!list) return;
  await mkdirp(DATA_PATH);
  await fs.writeFile(DATA_FILE, JSON.stringify(list));
  let usedList = list.filter(item => item.checked);
  usedList.unshift(await this.getDefault());
  let lines = usedList.map(item => {
    return `${os.EOL}#${item.name}${os.EOL}${item.content.trim()}${os.EOL}`;
  });
  await fs.writeFile(SYSTEM_HOSTS_FILE, lines.join(os.EOL));
};

async function downloadHosts(srcUrl, reqedUrls) {
  if (reqedUrls.includes(srcUrl)) return [];
  let url = `${srcUrl}?locale=${i18n.localeName}&time=${Date.now()}`;
  let response = await fetch(url);
  let text = await response.text() || '';
  let name = (COMMENT_REGEXP.exec(text) || {})[1];
  if (!name) return [];
  if (name == 'manifest') return downloadManifest(text, url, reqedUrls);
  //添加远程 hosts
  let item = {
    id: srcUrl,
    type: 'remote',
    name: name,
    content: text,
    checked: true
  };
  return [item];
}

async function downloadManifest(text, fromUrl, reqedUrls) {
  if (!text) return [];
  let urls = text.split('\n')
    .filter(item => item && !COMMENT_REGEXP.test(item.trim()))
    .map(item => utils.resolve(fromUrl, item.trim()));
  let pendings = urls.map(url => downloadHosts(url, reqedUrls));
  let results = [[], ...(await Promise.all(pendings))];
  return results.reduce((a, b) => a.concat(b));
}

exports.download = async function () {
  let list = await this.load();
  let manifest = list.find(item => item.type == 'manifest');
  if (!manifest) return;
  let remoteItems = await downloadManifest(manifest.content, null, []);
  list = list.filter(item => !remoteItems
    .some(remoteItem => remoteItem.id == item.id));
  list.push(...remoteItems);
  return this.save(list);
}
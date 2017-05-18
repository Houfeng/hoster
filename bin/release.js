const path = require('path');
const fs = require('fs');
const packager = require('electron-packager');
const pkg = require('../package');

const CWD = path.resolve(__dirname, '../');

//electron-packager . Hoster --ignore='node_modules' --overwrite --out=release  --icon=./design/icon.icns
packager({
  name: 'Hoster',
  appBundleId: 'net.xhou.hoster',
  appCategoryType: 'public.app-category.utilities',
  dir: CWD,
  out: `${CWD}/release`,
  appVersion: pkg.version,
  arch: 'x64',
  icon: `${CWD}/design/icon.icns`,
  overwrite: true,
  electronVersion: '1.6.8',
  platform: "darwin",
  "osx-sign": {
    type: "distribution"
  },
  'extend-info': `${__dirname}/info.plist`,
  ignore: [
    /node_modules/,
    /docs/,
    /release/,
    /\.dmgCanvas/,
    /test/,
    /bin/,
    /(\.DS_Store|\.psd|\.babelrc|\.eslintrc\.yml|electron-builder\.yml|server\.yml|ignore|\.conf\.js|\.rename|\.config\.js|\.map|jasmine\.json)$/
  ]
}, function (err, appPaths) {
  if (err) console.error(err);
  console.log('packaged', appPaths);

  //处理 deps
  let pkgFile = path.resolve(__dirname, '../release/Hoster-darwin-x64/Hoster.app/Contents/Resources/app/package.json');
  let buffer = fs.readFileSync(pkgFile);
  let pkgObj = JSON.parse(buffer.toString());
  delete pkgObj.devDependencies;
  delete pkgObj.scripts;
  delete pkgObj.dev;
  fs.writeFile(pkgFile, JSON.stringify(pkgObj, null, 2));

});
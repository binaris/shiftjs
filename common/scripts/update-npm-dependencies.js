const ncu = require('npm-check-updates');
const { installAndRun, findRushJsonFolder, RUSH_JSON_FILENAME } = require("./install-run");
const fs = require('fs');
const { join } = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const exists = promisify(fs.exists);

const IGNORED_PACKAGES = [
  '@types/node'
]

async function getPackageFiles() {
  const allSubDirs = await readdir(process.cwd(), { withFileTypes: true });
  const packageFiles = await Promise.all(allSubDirs
    .filter((dirent) => dirent.isDirectory())
    .map(({name}) => join(name, './package.json'))
    .map(async (packageFile) => ({
      packageFile,
      exists: await exists(packageFile)
    })));

  return packageFiles
    .filter(({exists}) => exists)
    .map(({packageFile}) => packageFile);
}

async function updatePackageFiles() {
  const allPackageFiles = await getPackageFiles();

  const results = await Promise.all(allPackageFiles.map(async (packageFile) => {
    const upgraded = await ncu.run({
      packageFile,
      reject: IGNORED_PACKAGES,
      upgrade: true,
    });
    const outdatedDependencies = Object.keys(upgraded);
    if (outdatedDependencies.length === 0) {
      return false;
    }
    console.info(`Updated '${packageFile}' dependencies:`);
    outdatedDependencies.forEach((depName) => {
      console.info(`    ${depName} -> ${upgraded[depName]}`);
    });
    return true;
  }));

  return results.some((packageUpdated) => packageUpdated);
}

function updateRushShrinkwrapFile() {

  // from install-run-rush.js
  function getRushVersion() {
    const rushJsonFolder = findRushJsonFolder();
    const rushJsonPath = join(rushJsonFolder, RUSH_JSON_FILENAME);
    try {
      const rushJsonContents = fs.readFileSync(rushJsonPath, 'utf-8');
      // Use a regular expression to parse out the rushVersion value because rush.json supports comments,
      // but JSON.parse does not and we don't want to pull in more dependencies than we need to in this script.
      const rushJsonMatches = rushJsonContents.match(/\"rushVersion\"\s*\:\s*\"([0-9a-zA-Z.+\-]+)\"/);
      return rushJsonMatches[1];
    }
    catch (e) {
      throw new Error(`Unable to determine the required version of Rush from rush.json (${rushJsonFolder}). ` +
        'The \'rushVersion\' field is either not assigned in rush.json or was specified ' +
        'using an unexpected syntax.');
    }
  }

  const statusCode = installAndRun('@microsoft/rush', getRushVersion(), 'rush', [ 'update', '--full' ]);
  if (statusCode !== 0) {
    throw new Error(`'rush update' exited with code ${code}`);
  }
}

async function run() {
  const shouldUpdateShrinkwrapFile = await updatePackageFiles();
  if (!shouldUpdateShrinkwrapFile) {
    console.info('All dependencies are up to date!');
    return;
  }

  updateRushShrinkwrapFile();
  console.info('Done!');
}

run().catch((error) => {
  console.error(error);
  process.exit(-1);
});

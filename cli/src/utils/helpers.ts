import { dirname, join } from 'path';
import { readFile } from 'mz/fs';
import findUp from 'find-up';
import dotenv from 'dotenv';
import { CLIError } from '@oclif/errors';
import { Environment } from '@binaris/spice-node-client/interfaces';

export interface Project {
  directory: string;
  applicationId: string;
  defaultEnv: string;
}

export function findProjectByDirectory(projects: Project[] | undefined, projectDir: string) {
  if (projects === undefined) {
    return undefined;
  }
  // TODO: case insensitive search dependening on OS
  return projects.find(({ directory }) => directory === projectDir);
}

export async function getProjectRootDir(): Promise<string> {
  const packageJsonPath = await findUp('package.json', { type: 'file' });
  if (packageJsonPath === undefined) {
    throw new CLIError('Could not find a relevant package.json file');
  }
  return dirname(packageJsonPath);
}

export async function getProjectEnv(): Promise<Array<[string, string]>> {
  const envFile = join(await getProjectRootDir(), '.env');
  try {
    const content = await readFile(envFile);
    return Object.entries(dotenv.parse(content));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

export async function getProjectPackageJson() {
  const packageJsonPath = await findUp('package.json', { type: 'file' });
  if (packageJsonPath === undefined) {
    throw new CLIError('Could not find a relevant package.json file');
  }
  const content = await readFile(packageJsonPath, 'utf8');
  const loaded = JSON.parse(content);

  if (typeof loaded !== 'object') {
    throw new Error('Malformed package.json');
  }
  return loaded;
}

export function getPrimaryDomain(environment: Environment) {
  return(`${environment.domains.filter((d) => d.type === 'subdomain')[0].name}`);
}

export function getPrimaryURL(environment: Environment) {
  return(`https://${getPrimaryDomain(environment)}`);
}

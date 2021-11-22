import * as cp from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { BlockedError, Data, Stdio } from './types';

const exec = promisify(cp.execFile);

const echo: Data = {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	EDITOR: 'echo'
};

function direnv(args: string[], env: Data | null = null): Promise<Stdio> {
	const options: cp.ExecOptionsWithStringEncoding = {
		encoding: 'utf8',
		cwd: vscode.workspace.rootPath, // same as default cwd for shell tasks
		env: {
			...process.env,
			...env,
		}
	};
	return exec('direnv', args, options);
}

export async function allow(path: string): Promise<void> {
	await direnv(['allow', path]);
}

export async function block(path: string): Promise<void> {
	await direnv(['deny', path]);
}

export async function create(): Promise<string> {
	const { stdout } = await direnv(['edit', vscode.workspace.rootPath!], echo);
	return stdout.trimEnd();
}

export async function find(): Promise<string> {
	try {
		const { stdout } = await direnv(['edit'], echo);
		return stdout.trimEnd();
	} catch (e: any) {
		const found = /direnv: error (?<path>.+) not found./.exec(e.stderr);
		if (!found) { throw e; }
		// .envrc not found, create a new one
		return create();
	}
}

export async function dump(): Promise<Data> {
	try {
		const { stdout } = await direnv(['export', 'json']);
		if (!stdout) { return {}; }
		return JSON.parse(stdout);
	} catch (e: any) {
		const found = /direnv: error (?<path>.+) is blocked./.exec(e.stderr);
		if (!found) { throw e; }
		// .envrc is blocked, let caller ask user what to do
		throw new BlockedError(found.groups!.path);
	}
}

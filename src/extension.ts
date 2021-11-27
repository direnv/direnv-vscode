import * as vscode from 'vscode';
import * as direnv from './direnv';
import * as status from './status';
import { BlockedError, Data } from './types';

let backup = new Map<string, string | undefined>();
let environment: vscode.EnvironmentVariableCollection;

async function dump(): Promise<Data> {
	try {
		return await direnv.dump();
	} catch (e) {
		if (!(e instanceof BlockedError)) { throw e; }
		handleBlocked(e.path);
		return {};
	}
}

async function reloadEnvironment(): Promise<void> {
	backup.forEach((value, key) => {
		if (value === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = value;
		}
	});
	backup.clear();
	environment.clear();
	const data = await dump();
	Object.entries(data).forEach(([key, value]) => {
		environment.replace(key, value);
		backup.set(key, process.env[key]);
		process.env[key] = value;
	});
}

async function open(path: string): Promise<void> {
	const document = await vscode.workspace.openTextDocument(path);
	await vscode.window.showTextDocument(document);
}

async function openThenAllow(path: string): Promise<void> {
	await open(path);
	const choice = await vscode.window.showInformationMessage(`direnv: Allow ${path}?`, 'Allow', 'Ignore');
	if (choice !== 'Allow') { return; }
	return allow(path);
}

async function handleBlocked(path: string): Promise<void> {
	const options = ['Allow', 'View', 'Ignore'];
	const choice = await vscode.window.showWarningMessage(`direnv: ${path} is blocked`, ...options);
	if (choice === 'Allow') {
		allowThenReload(path);
	}
	if (choice === 'View') {
		openThenAllow(path);
	}
}

async function allowThenReload(path: string): Promise<void> {
	await direnv.allow(path);
	return reloadEnvironment();
}

async function blockThenReload(path: string): Promise<void> {
	await direnv.block(path);
	return reloadEnvironment();
}

async function reload(): Promise<void> {
	return status.watch(() => reloadEnvironment());
}

async function allow(path: string): Promise<void> {
	return status.watch(() => allowThenReload(path));
}

async function block(path: string): Promise<void> {
	return status.watch(() => blockThenReload(path));
}

export function activate(context: vscode.ExtensionContext) {
	status.init();
	environment = context.environmentVariableCollection;
	context.subscriptions.push(vscode.commands.registerCommand('direnv.reload', async () => {
		await reload();
	}));
	context.subscriptions.push(vscode.commands.registerCommand('direnv.allow', async () => {
		await allow(vscode.window.activeTextEditor!.document.fileName);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('direnv.block', async () => {
		await block(vscode.window.activeTextEditor!.document.fileName);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('direnv.create', async () => {
		await open(await direnv.create());
	}));
	context.subscriptions.push(vscode.commands.registerCommand('direnv.open', async () => {
		await open(await direnv.find());
	}));
	reload();
}

export function deactivate() { }

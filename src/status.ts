import * as vscode from 'vscode';

export const icon = '$(combine)';
export const wait = '$(sync~spin)';
export const ok = '$(check)';
export const no = '$(alert)';
export const item = vscode.window.createStatusBarItem();

export function init() {
	item.text = `${icon}`;
	item.show();
}

function loading() {
	item.command = undefined;
	item.tooltip = 'direnv: Loading environment...';
	item.text = `${icon}${wait}`;
}

function loaded() {
	item.command = 'direnv.reload';
	item.tooltip = 'direnv loaded. Reload environment?';
	item.text = `${icon}${ok}`;
}

function failed() {
	item.command = 'direnv.reload';
	item.tooltip = 'direnv failed. Reload environment?';
	item.text = `${icon}${no}`;
}

export async function watch<T>(callback: () => Promise<T>): Promise<T> {
	loading();
	try {
		const result = await callback();
		loaded();
		return result;
	} catch (e) {
		console.error('direnv: reload failed', e);
		failed();
		throw e;
	}
}

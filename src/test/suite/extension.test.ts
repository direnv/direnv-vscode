import * as assert from 'assert';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as direnv from '../../direnv';

async function environmentLoaded(): Promise<boolean> {
	const tasks = await vscode.tasks.fetchTasks();
	const test = tasks.find(task => task.name === 'test');
	const promise = new Promise<number>(ok => {
		const done = vscode.tasks.onDidEndTaskProcess(event => {
			done.dispose();
			ok(event.exitCode!);
		});
	});
	await vscode.tasks.executeTask(test!);
	const exitCode = await promise;
	return exitCode === 0;
}

describe('the extension', () => {
	const root = vscode.workspace.rootPath!;
	const file = path.join(root, '.envrc');
	const text = path.join(root, 'file.txt');

	afterEach(async () => {
		try {
			await direnv.block(file);
		} catch (_) {
			// ignore errors
		}
	});

	describe('in the empty workspace', () => {
		beforeEach(async () => {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
		});

		it('opens the .envrc file with direnv.create', async () => {
			await vscode.commands.executeCommand('direnv.create');
			const path = vscode.window.activeTextEditor?.document.fileName;
			assert.strict.equal(path, file);
		});

		it('opens the .envrc file with direnv.open', async () => {
			await vscode.commands.executeCommand('direnv.open');
			const path = vscode.window.activeTextEditor?.document.fileName;
			assert.strict.equal(path, file);
		});

		describe('with simulated user interaction', () => {
			it('allows and loads the .envrc on direnv.reload', async () => {
				sinon.replace(vscode.window, 'showWarningMessage', sinon.fake.resolves('Allow'));
				await vscode.commands.executeCommand('direnv.reload');
				assert(await environmentLoaded());
			});

			it('opens and allows and loads the .envrc on direnv.reload', async () => {
				sinon.replace(vscode.window, 'showWarningMessage', sinon.fake.resolves('View'));
				sinon.replace(vscode.window, 'showInformationMessage', sinon.fake.resolves('Allow'));
				await vscode.commands.executeCommand('direnv.reload');
				assert(await environmentLoaded());
			});
		});
	});

	describe('with the .envrc file open', () => {
		beforeEach(async () => {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(file));
		});

		it('switches to the .envrc file with direnv.create', async () => {
			await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(text));
			await vscode.commands.executeCommand('direnv.create');
			const path = vscode.window.activeTextEditor?.document.fileName;
			assert.strict.equal(path, file);
		});

		it('switches to the .envrc file with direnv.open', async () => {
			await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(text));
			await vscode.commands.executeCommand('direnv.open');
			const path = vscode.window.activeTextEditor?.document.fileName;
			assert.strict.equal(path, file);
		});

		it('loads the .envrc file with direnv.allow', async () => {
			await vscode.commands.executeCommand('direnv.allow');
			assert(await environmentLoaded());
		});

		it('unloads the .envrc file with direnv.block', async () => {
			await vscode.commands.executeCommand('direnv.allow');
			await vscode.commands.executeCommand('direnv.block');
			assert(!await environmentLoaded());
		});
	});
});

import { strict as assert } from 'assert'
import path from 'path'
import sinon from 'sinon'
import vscode from 'vscode'
import { workspaceRoot } from '.'

async function runTask(name: string): Promise<number> {
	const tasks = await vscode.tasks.fetchTasks()
	const test = tasks.find((task) => task.name === name)
	assert(test)
	const promise = new Promise<number>((ok) => {
		const done = vscode.tasks.onDidEndTaskProcess((event) => {
			if (event.execution.task.name === name) {
				done.dispose()
				ok(event.exitCode ?? -1)
			}
		})
	})
	await vscode.tasks.executeTask(test)
	return promise
}

async function assertEnvironmentIsLoaded() {
	assert.equal(await runTask('test-task'), 0, 'environment is loaded in task')
	assert.equal(await runTask('test-process'), 0, 'environment is loaded in process')
}

async function assertEnvironmentIsNotLoaded() {
	assert.notEqual(await runTask('test-task'), 0, 'environment is not loaded in task')
	assert.notEqual(await runTask('test-process'), 0, 'environment is not loaded in process')
}

describe('the extension', () => {
	const file = path.join(workspaceRoot, '.envrc')
	const text = path.join(workspaceRoot, 'file.txt')

	describe('in the test workspace', () => {
		describe('without any editors', () => {
			beforeEach(async () => {
				await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			})

			it('opens the .envrc file with direnv.open', async () => {
				await vscode.commands.executeCommand('direnv.open')
				const path = vscode.window.activeTextEditor?.document.fileName
				assert.equal(path, file)
			})

			it('opens the .envrc file with direnv.create', async () => {
				await vscode.commands.executeCommand('direnv.create')
				const path = vscode.window.activeTextEditor?.document.fileName
				assert.equal(path, file)
			})

			describe('with simulated user interaction', () => {
				it('allows and loads the .envrc on direnv.reload', async () => {
					sinon.stub(vscode.window, 'showWarningMessage').withArgs(sinon.match.any, sinon.match('Allow')).resolvesArg(1)
					await vscode.commands.executeCommand('direnv.reload')
					await assertEnvironmentIsLoaded()
				})

				it('opens and allows and loads the .envrc on direnv.reload', async () => {
					sinon.stub(vscode.window, 'showWarningMessage').withArgs(sinon.match.any, sinon.match('Allow')).resolvesArg(2)
					sinon.stub(vscode.window, 'showInformationMessage').withArgs(sinon.match.any, sinon.match('Allow')).resolvesArg(1)
					await vscode.commands.executeCommand('direnv.reload')
					await assertEnvironmentIsLoaded()
				})

				it('allows and loads the .envrc on direnv.open', async () => {
					sinon.stub(vscode.window, 'showWarningMessage').withArgs(sinon.match.any, sinon.match('Allow')).resolves(undefined)
					sinon.stub(vscode.window, 'showInformationMessage').withArgs(sinon.match.any, sinon.match('Allow')).resolvesArg(1)
					await vscode.commands.executeCommand('direnv.reload')
					await vscode.commands.executeCommand('direnv.open')
					await assertEnvironmentIsLoaded()
				})

				it('allows and loads the .envrc on save', async () => {
					sinon.stub(vscode.window, 'showWarningMessage').withArgs(sinon.match.any, sinon.match('Allow')).resolvesArg(1)
					await vscode.commands.executeCommand('direnv.open')
					await vscode.window.activeTextEditor?.document.save()
					await assertEnvironmentIsLoaded()
				})
			})
		})

		describe('with the .envrc file open', () => {
			beforeEach(async () => {
				await vscode.commands.executeCommand('workbench.action.closeAllEditors')
				await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(file))
			})

			it('switches to the .envrc file with direnv.open', async () => {
				await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(text))
				await vscode.commands.executeCommand('direnv.open')
				const path = vscode.window.activeTextEditor?.document.fileName
				assert.equal(path, file)
			})

			it('switches to the .envrc file with direnv.create', async () => {
				await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(text))
				await vscode.commands.executeCommand('direnv.create')
				const path = vscode.window.activeTextEditor?.document.fileName
				assert.equal(path, file)
			})

			it('loads the .envrc file with direnv.allow', async () => {
				await vscode.commands.executeCommand('direnv.allow')
				await assertEnvironmentIsLoaded()
			})

			it('unloads the .envrc file with direnv.block', async () => {
				await vscode.commands.executeCommand('direnv.allow')
				await vscode.commands.executeCommand('direnv.block')
				await assertEnvironmentIsNotLoaded()
			})

			it.skip('reloads the .envrc file on watched change', async () => {
				await vscode.commands.executeCommand('direnv.allow')
				const watched = vscode.Uri.file(path.join(workspaceRoot, '.envrc.local'))
				await vscode.workspace.fs.writeFile(watched, Buffer.from('unset VARIABLE'))
				await assertEnvironmentIsNotLoaded()
			})
		})
	})

	describe('in a subdirectory workspace', () => {
		const subdir = path.join(workspaceRoot, 'subdir')
		const subfile = path.join(subdir, '.envrc')

		beforeEach(() => {
			sinon.replaceGetter(vscode.workspace, 'workspaceFolders', () => [
				{ index: 0, name: 'subdir', uri: vscode.Uri.file(subdir) },
			])
		})

		describe('without any editors', () => {
			beforeEach(async () => {
				await vscode.commands.executeCommand('workbench.action.closeAllEditors')
			})

			it('opens the parent .envrc file with direnv.open', async () => {
				await vscode.commands.executeCommand('direnv.open')
				const path = vscode.window.activeTextEditor?.document.fileName
				assert.equal(path, file)
			})

			it('opens a new .envrc file with direnv.create', async () => {
				await vscode.commands.executeCommand('direnv.create')
				const path = vscode.window.activeTextEditor?.document.fileName
				assert.equal(path, subfile)
			})
		})
	})
})

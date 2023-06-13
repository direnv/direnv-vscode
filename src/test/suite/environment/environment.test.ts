import path from 'path'

import vscode from 'vscode'

import { workspaceRoot } from '.'
import { assertEnvironmentIsLoaded, assertEnvironmentIsNotLoaded } from '../assertions'

context('custom environments in the test workspace', function () {
	beforeEach(async function () {
		// XXX the environment is only loaded after opening an existing file?
		const file = path.join(workspaceRoot, 'file.txt')
		await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(file))
	})

	specify('direnv.allow loads the custom environment', async function () {
		await vscode.commands.executeCommand('direnv.allow')
		await assertEnvironmentIsLoaded()
	})

	specify('direnv.block unloads the custom environment', async function () {
		await vscode.commands.executeCommand('direnv.allow')
		await vscode.commands.executeCommand('direnv.block')
		await assertEnvironmentIsNotLoaded()
	})

	specify('changing a watched file reloads the custom environment', async function () {
		this.retries(10) // XXX this test is flaky
		await vscode.commands.executeCommand('direnv.allow')
		const watched = vscode.Uri.file(path.join(workspaceRoot, '.envrc.local'))
		await vscode.workspace.fs.writeFile(watched, Buffer.from('unset VARIABLE'))
		await assertEnvironmentIsNotLoaded()
	})
})

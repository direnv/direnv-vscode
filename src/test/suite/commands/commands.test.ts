import { strict as assert } from 'assert'
import path from 'path'

import vscode from 'vscode'

import { workspaceRoot } from '.'

context('commands in the test workspace', function () {
	const file = path.join(workspaceRoot, '.envrc')

	context('without open editors', function () {
		specify('direnv.open opens the .envrc file', async function () {
			await vscode.commands.executeCommand('direnv.open')
			const path = vscode.window.activeTextEditor?.document.fileName
			assert.equal(path, file)
		})

		specify('direnv.create opens the existing .envrc file', async function () {
			await vscode.commands.executeCommand('direnv.create')
			const path = vscode.window.activeTextEditor?.document.fileName
			assert.equal(path, file)
		})
	})

	context('with a text file open', function () {
		beforeEach(async function () {
			const text = path.join(workspaceRoot, 'file.txt')
			await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(text))
		})

		specify('direnv.open switches to the .envrc file', async function () {
			await vscode.commands.executeCommand('direnv.open')
			const path = vscode.window.activeTextEditor?.document.fileName
			assert.equal(path, file)
		})

		specify('direnv.create switches to the existing .envrc file', async function () {
			await vscode.commands.executeCommand('direnv.create')
			const path = vscode.window.activeTextEditor?.document.fileName
			assert.equal(path, file)
		})
	})
})

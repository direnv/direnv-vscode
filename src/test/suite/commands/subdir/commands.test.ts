import { strict as assert } from 'assert'
import path from 'path'

import vscode from 'vscode'

import { workspaceRoot } from '.'

context('commands in the subdirectory workspace', function () {
	const file = path.join(workspaceRoot, '../.envrc')
	const subfile = path.join(workspaceRoot, '.envrc')

	context('without open editors', function () {
		specify('direnv.open opens the parent .envrc file', async function () {
			await vscode.commands.executeCommand('direnv.open')
			const path = vscode.window.activeTextEditor?.document.fileName
			assert.equal(path, file)
		})

		specify('direnv.create opens a new .envrc file in the subdirectory', async function () {
			await vscode.commands.executeCommand('direnv.create')
			const path = vscode.window.activeTextEditor?.document.fileName
			assert.equal(path, subfile)
		})
	})
})

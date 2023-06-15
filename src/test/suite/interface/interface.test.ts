import path from 'path'
import { SinonStub, match } from 'sinon'

import vscode from 'vscode'

import { workspaceRoot } from '.'
import { assertEnvironmentIsLoaded } from '../assertions'

context('user interaction in the test workspace', function () {
	const file = path.join(workspaceRoot, '.envrc')

	context('when warned that the .envrc file is blocked', function () {
		context('and we allow it', function () {
			beforeEach(function () {
				;(vscode.window.showWarningMessage as SinonStub).withArgs(match.any, match('Allow'), match('View')).resolvesArg(1)
			})

			specify('then direnv.reload loads the custom environment', async function () {
				await vscode.commands.executeCommand('direnv.reload')
				await assertEnvironmentIsLoaded()
			})

			specify('then saving the .envrc loads the custom environment', async function () {
				this.retries(60) // XXX this test is flaky
				await vscode.commands.executeCommand('direnv.open')
				await vscode.window.activeTextEditor?.document.save()
				await assertEnvironmentIsLoaded()
			})
		})

		context('and we view it', function () {
			beforeEach(function () {
				;(vscode.window.showWarningMessage as SinonStub).withArgs(match.any, match('Allow'), match('View')).resolvesArg(2)
			})

			context('when informed that the .envrc file is blocked', function () {
				context('and we allow it', function () {
					beforeEach(function () {
						;(vscode.window.showInformationMessage as SinonStub).withArgs(match.any, match('Allow')).resolvesArg(1)
					})

					specify('then direnv.reload loads the custom environment', async function () {
						await vscode.commands.executeCommand('direnv.reload')
						await assertEnvironmentIsLoaded()
					})
				})
			})
		})

		context('and we dismiss it', function () {
			beforeEach(function () {
				;(vscode.window.showWarningMessage as SinonStub).withArgs(match.any, match('Allow'), match('View')).resolves(undefined)
			})

			context('when informed that the .envrc file is blocked', function () {
				context('and we allow it', function () {
					beforeEach(async function () {
						;(vscode.window.showInformationMessage as SinonStub).withArgs(match.any, match('Allow')).resolvesArg(1)
						await vscode.commands.executeCommand('direnv.reload')
					})

					specify('then direnv.open loads the custom environment', async function () {
						await vscode.commands.executeCommand('direnv.open')
						await assertEnvironmentIsLoaded()
					})

					specify('then vscode.open loads the custom environment', async function () {
						await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(file))
						await assertEnvironmentIsLoaded()
					})

					specify('then vscode.workspace.openTextDocument loads the custom environment', async function () {
						const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(file))
						await vscode.window.showTextDocument(doc)
						await assertEnvironmentIsLoaded()
					})
				})
			})
		})
	})
})

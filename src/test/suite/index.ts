import _cp from 'child_process'
import fs from 'fs/promises'
import { glob } from 'glob'
import Mocha from 'mocha'
import path from 'path'
import sinon from 'sinon'
import util from 'util'

import vscode from 'vscode'

const execFile = util.promisify(_cp.execFile)

export async function runSuite(workspaceRoot: string, testRoot: string, testPattern?: string) {
	async function requireDirenv() {
		await execFile('direnv', ['version'])
	}

	async function removeWatched() {
		try {
			await fs.rm(path.join(workspaceRoot, '.envrc.local'))
		} catch (_) {
			// ignore
		}
	}

	async function blockWorkspace() {
		try {
			await execFile('direnv', ['deny', workspaceRoot])
		} catch (_) {
			// ignore
		}
	}

	function dismissMessages() {
		sinon.stub(vscode.window, 'showErrorMessage').resolves(undefined)
		sinon.stub(vscode.window, 'showWarningMessage').resolves(undefined)
		sinon.stub(vscode.window, 'showInformationMessage').resolves(undefined)
	}

	async function closeTabs() {
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
	}

	async function closeWorkspace() {
		await vscode.commands.executeCommand('workbench.action.closeFolder')
	}

	async function resetExtension() {
		await vscode.commands.executeCommand('direnv.reset')
	}

	const mocha = new Mocha({
		ui: 'bdd',
		color: true,
		slow: 1000,
		timeout: 10000,
		rootHooks: {
			async beforeAll() {
				await requireDirenv()
				await blockWorkspace()
				await resetExtension()
			},
			beforeEach() {
				dismissMessages()
			},
			async afterEach() {
				sinon.restore()
				await closeTabs()
				await removeWatched()
				await blockWorkspace()
			},
			async afterAll() {
				await closeWorkspace()
			},
		},
	})

	const files = await glob(testPattern ?? '*.test.js', { cwd: testRoot })
	files.forEach((f) => mocha.addFile(path.resolve(testRoot, f)))

	const failures = await new Promise<number>((c) => mocha.run(c))
	if (failures > 0) {
		const err = `${failures} tests failed.`
		console.error(err)
		throw new Error(err)
	}
}

export const workspaceRoot = path.resolve(__dirname, '../../../test/workspace')

export async function run() {
	await runSuite(workspaceRoot, __dirname, '*/*.test.js')
}

import _cp from 'child_process'
import fs from 'fs/promises'
import glob from 'glob'
import Mocha from 'mocha'
import path from 'path'
import sinon from 'sinon'
import util from 'util'
import vscode from 'vscode'

const execFile = util.promisify(_cp.execFile)

export const workspaceRoot = path.resolve(__dirname, '../../../test/workspace')

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

async function resetExtension() {
	await vscode.commands.executeCommand('direnv.reset')
}

export async function run() {
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
			async afterEach() {
				sinon.restore()
				await removeWatched()
				await blockWorkspace()
			},
			async afterAll() {
				await vscode.commands.executeCommand('workbench.action.closeFolder')
			},
		},
	})

	const testsRoot = path.resolve(__dirname, '..')

	const files = await glob('**/**.test.js', { cwd: testsRoot })
	files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)))

	const failures = await new Promise<number>((c) => mocha.run(c))
	if (failures > 0) {
		const err = `${failures} tests failed.`
		console.error(err)
		throw new Error(err)
	}
}

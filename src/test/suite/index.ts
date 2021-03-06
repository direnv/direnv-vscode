import _cp from 'child_process'
import _glob from 'glob'
import Mocha from 'mocha'
import path from 'path'
import sinon from 'sinon'
import util from 'util'
import vscode from 'vscode'

const execFile = util.promisify(_cp.execFile)
const glob = util.promisify(_glob)

export const workspaceRoot = path.resolve(__dirname, '../../../test/workspace')

async function requireDirenv(): Promise<void> {
	await execFile('direnv', ['version'])
}

async function blockWorkspace(): Promise<void> {
	try {
		await execFile('direnv', ['deny', workspaceRoot])
	} catch (_) {
		// ignore
	}
}

export async function run(): Promise<void> {
	const mocha = new Mocha({
		ui: 'bdd',
		color: true,
		timeout: 5000,
		rootHooks: {
			async beforeAll() {
				await requireDirenv()
				await blockWorkspace()
			},
			async afterEach() {
				sinon.restore()
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

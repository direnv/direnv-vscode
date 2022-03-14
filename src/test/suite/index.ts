import * as _cp from 'child_process'
import * as _glob from 'glob'
import * as Mocha from 'mocha'
import * as path from 'path'
import * as sinon from 'sinon'
import * as util from 'util'
import * as vscode from 'vscode'

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

	try {
		const files = await glob('**/**.test.js', { cwd: testsRoot })
		files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)))

		// mocha has a runAsync that returns a promise, but @types don't know about it...
		await new Promise<void>((c, e) => {
			mocha.run((failures) => {
				if (failures > 0) {
					e(new Error(`${failures} tests failed.`))
				} else {
					c()
				}
			})
		})
	} catch (err) {
		console.error(err)
		throw err
	}
}

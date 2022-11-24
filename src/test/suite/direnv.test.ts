import { strict as assert } from 'assert'
import path from 'path'
import sinon from 'sinon'
import vscode from 'vscode'
import { workspaceRoot } from '.'
import config from '../../config'
import * as direnv from '../../direnv'

describe('direnv', () => {
	const file = path.join(workspaceRoot, '.envrc')

	afterEach(async () => {
		try {
			await direnv.block(file)
		} catch (_) {
			// ignore errors
		}
	})

	describe('in the test workspace', () => {
		it('finds the direnv executable', async () => {
			await direnv.test()
		})

		it('finds the .envrc file in the workspace root', async () => {
			const path = await direnv.find()
			assert.equal(path, file)
		})

		it('reuses the .envrc file in the workspace root', async () => {
			const path = await direnv.create()
			assert.equal(path, file)
		})

		it('dumps the allowed .envrc file', async () => {
			delete process.env['VARIABLE']
			await direnv.allow(file)
			const data = await direnv.dump()
			assert.equal(data.get('VARIABLE'), 'value')
		})

		it('fails to dump the blocked .envrc file', async () => {
			await direnv.allow(file)
			await direnv.block(file)
			try {
				await direnv.dump()
				assert.fail('.envrc should be blocked')
			} catch ({ path }) {
				assert.equal(path, file)
			}
		})

		it('lists the .envrc file as watched', async () => {
			await direnv.allow(file)
			const data = await direnv.dump()
			process.env.DIRENV_WATCHES = data.get('DIRENV_WATCHES')
			const paths = direnv.watches().map((it) => it.Path)
			assert.ok(paths.includes(file))
		})

		it('fails when the direnv executable is missing', async () => {
			const missing = '/missing/executable'
			sinon.replace(config.path.executable, 'get', () => missing)
			await assert.rejects(() => direnv.test(), new direnv.CommandNotFoundError(missing))
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

		it('finds the .envrc file in the parent directory', async () => {
			const path = await direnv.find()
			assert.equal(path, file)
		})

		it('creates an .envrc file in the subdirectory', async () => {
			const path = await direnv.create()
			assert.equal(path, subfile)
		})
	})
})

import { AssertionError, strict as assert } from 'assert'
import path from 'path'
import sinon from 'sinon'
import vscode from 'vscode'
import { workspaceRoot } from '.'
import config from '../../config'
import * as direnv from '../../direnv'

describe('direnv', () => {
	const file = path.join(workspaceRoot, '.envrc')

	afterEach(() => {
		try {
			direnv.block(file)
		} catch (_) {
			// ignore errors
		}
	})

	describe('in the test workspace', () => {
		it('finds the direnv executable', () => {
			direnv.test()
		})

		it('finds the .envrc file in the workspace root', () => {
			const path = direnv.find()
			assert.equal(path, file)
		})

		it('reuses the .envrc file in the workspace root', () => {
			const path = direnv.create()
			assert.equal(path, file)
		})

		it('dumps the allowed .envrc file', () => {
			delete process.env['VARIABLE']
			direnv.allow(file)
			const data = direnv.dump()
			assert.equal(data.get('VARIABLE'), 'value')
		})

		it('fails to dump the blocked .envrc file', () => {
			direnv.allow(file)
			direnv.block(file)
			try {
				direnv.dump()
				assert.fail('.envrc should be blocked')
			} catch (e) {
				if (e instanceof AssertionError) throw e
				assert(e instanceof direnv.BlockedError)
				assert.equal(e.path, file)
			}
		})

		it('lists the .envrc file as watched', () => {
			direnv.allow(file)
			const data = direnv.dump()
			const paths = direnv.watches(data).map((it) => it.Path)
			assert.ok(paths.includes(file))
		})

		it('fails when the direnv executable is missing', () => {
			const missing = '/missing/executable'
			sinon.replace(config.path.executable, 'get', () => missing)
			assert.throws(() => direnv.test(), new direnv.CommandNotFoundError(missing))
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

		it('finds the .envrc file in the parent directory', () => {
			const path = direnv.find()
			assert.equal(path, file)
		})

		it('creates an .envrc file in the subdirectory', () => {
			const path = direnv.create()
			assert.equal(path, subfile)
		})
	})
})

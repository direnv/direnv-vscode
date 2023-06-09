import { strict as assert } from 'assert'
import path from 'path'

import { workspaceRoot } from '.'
import * as direnv from '../../../../direnv'

describe('direnv in the subdirectory workspace', function () {
	const file = path.resolve(workspaceRoot, '../.envrc')
	const subfile = path.resolve(workspaceRoot, '.envrc')

	it('finds the .envrc file in the parent directory', async function () {
		const path = await direnv.find()
		assert.equal(path, file)
	})

	it('creates an .envrc file in the subdirectory', async function () {
		const path = await direnv.create()
		assert.equal(path, subfile)
	})
})

import path from 'path'

import { runSuite } from '../..'

export const workspaceRoot = path.resolve(__dirname, '../../../../../test/workspace/subdir')

export async function run() {
	await runSuite(workspaceRoot, __dirname)
}

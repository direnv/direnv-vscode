import * as path from 'path'

import { runTests } from '@vscode/test-electron'

async function main(vscodeExecutablePath?: string) {
	try {
		const extensionDevelopmentPath = path.resolve(__dirname, '../../')
		const extensionTestsPath = path.resolve(__dirname, './suite/index')
		const workspacePath = path.resolve(__dirname, '../../test/workspace')
		const disableExtensions = '--disable-extensions'
		const launchArgs = [workspacePath, disableExtensions]
		await runTests({ vscodeExecutablePath, extensionDevelopmentPath, extensionTestsPath, launchArgs })
	} catch (err) {
		console.error('Failed to run tests')
		process.exit(1)
	}
}

const executable = process.argv[2]
void main(executable)

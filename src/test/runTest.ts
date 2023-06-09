import fs from 'fs'
import path from 'path'

import { runTests } from '@vscode/test-electron'

const allSuites = ['commands', 'direnv', 'environment', 'interface']
const workspaces = ['.', 'subdir']

const extensionDevelopmentPath = path.resolve(__dirname, '../..')
const extensionTestsEnv = { ['PREDEFINED']: 'value' }

async function test(extensionTestsPath: string, workspacePath: string) {
	const disableExtensions = '--disable-extensions'
	const launchArgs = [workspacePath, disableExtensions]
	await runTests({ extensionDevelopmentPath, extensionTestsPath, extensionTestsEnv, launchArgs })
}

async function main(suites: string[]) {
	let failed = false
	for (const suite of suites) {
		for (const workspace of workspaces) {
			const suitePath = path.resolve(__dirname, `suite/${suite}/${workspace}/`)
			const workspacePath = path.resolve(__dirname, `../../test/workspace/${workspace}`)
			if (!fs.existsSync(suitePath)) continue
			try {
				await test(suitePath, workspacePath)
			} catch (err) {
				failed = true
			}
		}
	}
	if (failed) {
		console.error('Failed to run tests')
		process.exit(1)
	}
}

const [, , ...suites] = process.argv
void main(suites.length ? suites : allSuites)

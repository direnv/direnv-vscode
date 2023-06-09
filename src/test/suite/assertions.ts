import { strict as assert } from 'assert'

import vscode from 'vscode'

async function runTask(name: string): Promise<number> {
	const tasks = await vscode.tasks.fetchTasks()
	const test = tasks.find((task) => task.name === name)
	assert(test)
	const promise = new Promise<number>((ok) => {
		const done = vscode.tasks.onDidEndTaskProcess((event) => {
			if (event.execution.task.name === name) {
				done.dispose()
				ok(event.exitCode ?? -1)
			}
		})
	})
	await vscode.tasks.executeTask(test)
	return promise
}

export async function assertEnvironmentIsLoaded() {
	assert.equal(await runTask('test-task'), 0, 'environment is loaded in task')
	assert.equal(await runTask('test-process'), 0, 'environment is loaded in process')
}

export async function assertEnvironmentIsNotLoaded() {
	assert.notEqual(await runTask('test-task'), 0, 'environment is not loaded in task')
	assert.notEqual(await runTask('test-process'), 0, 'environment is not loaded in process')
}

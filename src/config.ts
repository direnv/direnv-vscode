import vscode from 'vscode'

const root = 'direnv'

class Value<T> {
	constructor(readonly value: T) {}
}

interface Section {
	isAffectedBy(event: vscode.ConfigurationChangeEvent): boolean
	open(): Promise<void>
}

interface Setting<T> {
	get(): T
	isAffectedBy(event: vscode.ConfigurationChangeEvent): boolean
	open(): Promise<void>
}

type Settings<T> = Section & {
	[Name in keyof T]: T[Name] extends Value<infer T> ? Setting<T> : Settings<T[Name]>
}

function isAffectedBy(path: string[], event: vscode.ConfigurationChangeEvent): boolean {
	return event.affectsConfiguration(path.join('.'))
}

async function open(path: string[]): Promise<void> {
	await vscode.commands.executeCommand('workbench.action.openSettings', path.join('.'))
}

function value<T>(value: T): Value<T> {
	return new Value(value)
}

function setting<T>(path: string[], value: Value<T>): Setting<T> {
	return {
		get() {
			const [root, ...rest] = path
			return vscode.workspace.getConfiguration(root).get(rest.join('.')) ?? value.value
		},
		isAffectedBy(event: vscode.ConfigurationChangeEvent) {
			return isAffectedBy(path, event)
		},
		open() {
			return open(path)
		},
	}
}

function section<T extends object>(path: string[], object: T): Settings<T> {
	return {
		isAffectedBy(event: vscode.ConfigurationChangeEvent) {
			return isAffectedBy(path, event)
		},
		open() {
			return open(path)
		},
		...Object.fromEntries(
			Object.entries(object).map(([key, value]) => [
				key,
				value instanceof Value
					? setting([...path, key], value)
					: section([...path, key], value),
			]),
		),
	} as Settings<T>
}

export default section([root], {
	extraEnv: value({}),
	path: {
		executable: value('direnv'),
	},
	status: {
		showChangesCount: value(true),
	},
	restart: {
		automatic: value(false),
	},
})

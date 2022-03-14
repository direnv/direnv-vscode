import vscode from 'vscode'

const root = 'direnv'
function config(): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration(root)
}

async function open(path: string) {
	return await vscode.commands.executeCommand('workbench.action.openSettings', path)
}

export function isAffectedBy(event: vscode.ConfigurationChangeEvent): boolean {
	return event.affectsConfiguration(root)
}

type Section = {
	isAffectedBy(event: vscode.ConfigurationChangeEvent): boolean
	open(): Promise<unknown>
}

class Option<T> {
	constructor(private path: string, private defaultValue: T) {}

	get(): T {
		return config().get(this.path) ?? this.defaultValue
	}

	open(): Promise<unknown> {
		return open(`${root}.${this.path}`)
	}
}

type Options<Type> = {
	[Name in keyof Type]: Option<Type[Name]>
}

function section<Type>(name: string, defaults: Type): Section & Options<Type> {
	return {
		isAffectedBy(event: vscode.ConfigurationChangeEvent): boolean {
			return event.affectsConfiguration(`${root}.${name}`)
		},
		open(): Promise<unknown> {
			return open(`${root}.${name}`)
		},
		...Object.fromEntries(
			Object.entries(defaults).map(([key, value]) => [
				key,
				new Option(`${name}.${key}`, value),
			]),
		),
	} as Section & Options<Type>
}

export const path = section('path', {
	executable: 'direnv',
})
export const status = section('status', {
	showChangesCount: true,
})

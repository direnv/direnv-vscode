import * as vscode from 'vscode'

const section = 'direnv'

function config() {
	return vscode.workspace.getConfiguration(section)
}

export function isAffectedBy(event: vscode.ConfigurationChangeEvent): boolean {
	return event.affectsConfiguration(section)
}

class Section {
	protected constructor(private section: string) {}

	protected get<T>(subsection: string): T | undefined {
		return config().get(`${this.section}.${subsection}`)
	}

	isAffectedBy(event: vscode.ConfigurationChangeEvent): boolean {
		return event.affectsConfiguration(`${section}.${this.section}`)
	}
}

export class Status extends Section {
	constructor() {
		super('status')
	}

	get showChangesCount(): boolean {
		return this.get('showChangesCount') ?? true
	}
}

export const status: Status = new Status()

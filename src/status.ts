import vscode from 'vscode'
import * as command from './command'
import config from './config'

export type Delta = {
	added: number
	changed: number
	removed: number
}

export class State {
	private constructor(
		readonly text: string,
		readonly tooltip: string,
		readonly command?: command.Direnv,
		readonly refresh: () => State = () => this,
	) {}

	static loading = new State('$(folder)$(sync~spin)', 'direnv loading…')
	static empty = new State('$(folder)', 'direnv empty\nCreate…', command.Direnv.create)
	static loaded(delta: Delta): State {
		let text = '$(folder-active)'
		if (config.status.showChangesCount.get()) {
			text += ` +${delta.added}/~${delta.changed}/-${delta.removed}`
		}
		return new State(
			text,
			`direnv loaded: ${delta.added} added, ${delta.changed} changed, ${delta.removed} removed\nReload…`,
			command.Direnv.reload,
			() => State.loaded(delta),
		)
	}
	static blocked(path: string): State {
		return new State(
			'$(folder)$(shield)',
			`direnv blocked: ${path}\nReview…`,
			command.Direnv.open,
			() => State.blocked(path),
		)
	}
	static failed = new State(
		'$(folder)$(flame)',
		'direnv failed\nReload…',
		command.Direnv.reload,
	)
}

export class Item implements vscode.Disposable {
	private state: State = State.empty

	constructor(private item: vscode.StatusBarItem) {
		item.text = State.empty.text
		item.show()
	}

	dispose() {
		this.item.dispose()
	}

	update(state: State) {
		this.state = state
		this.item.text = state.text
		this.item.tooltip = state.tooltip
		this.item.command = state.command
	}

	refresh() {
		this.update(this.state.refresh())
	}
}

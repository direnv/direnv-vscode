import * as vscode from 'vscode'

export class State {
	private constructor(
		readonly text: string,
		readonly tooltip: string,
		readonly command: string | undefined = undefined,
	) {}

	static loading = new State('$(folder)$(sync~spin)', 'direnv loading environment…')
	static loaded = new State(
		'$(folder-active)',
		'direnv environment loaded\nClick to reload',
		'direnv.reload',
	)
	static empty = new State(
		'$(folder)',
		'direnv environment empty\nClick to create',
		'direnv.create',
	)
	static blocked = new State(
		'$(folder)$(shield)',
		'direnv environment blocked\nClick to review',
		'direnv.open',
	)
	static failed = new State('$(folder)$(flame)', 'direnv failed\nClick to reload', 'direnv.reload')
}

export class Item implements vscode.Disposable {
	constructor(private item: vscode.StatusBarItem) {
		item.text = State.empty.text
		item.show()
	}

	dispose() {
		this.item.dispose()
	}

	set state(state: State) {
		this.item.text = state.text
		this.item.tooltip = state.tooltip
		this.item.command = state.command
	}
}

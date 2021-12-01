import * as vscode from 'vscode'

const icon = '$(folder)'

export const enum State {
	loading = '$(sync~spin)',
	loaded = '$(pass)',
	empty = '$(question)',
	failed = '$(flame)',
	blocked = '$(error)',
}

export class Item implements vscode.Disposable {
	constructor(private item: vscode.StatusBarItem) {
		item.text = icon
		item.show()
	}

	dispose() {
		this.item.dispose()
	}

	set state(state: State) {
		this.item.text = icon + state
		switch (state) {
			case State.loading:
				this.item.command = undefined
				this.item.tooltip = 'Loading direnv environment…'
				break
			default:
				this.item.command = 'direnv.reload'
				this.item.tooltip = 'Reload direnv environment'
				break
		}
	}
}

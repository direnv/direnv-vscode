import * as vscode from 'vscode'

export const enum State {
	loading = '$(folder)$(sync~spin)',
	loaded = '$(folder-active)',
	empty = '$(folder)',
	blocked = '$(folder)$(shield)',
	failed = '$(folder)$(flame)',
}

export class Item implements vscode.Disposable {
	constructor(private item: vscode.StatusBarItem) {
		item.text = State.empty
		item.show()
	}

	dispose() {
		this.item.dispose()
	}

	set state(state: State) {
		this.item.text = state
		switch (state) {
			case State.loading:
				this.item.tooltip = 'direnv loading environment…'
				this.item.command = undefined
				break
			case State.loaded:
				this.item.tooltip = 'direnv environment loaded\nClick to reload'
				this.item.command = 'direnv.reload'
				break
			case State.empty:
				this.item.tooltip = 'direnv environment empty\nClick to create'
				this.item.command = 'direnv.create'
				break
			case State.blocked:
				this.item.tooltip = 'direnv environment blocked\nClick to review'
				this.item.command = 'direnv.open'
				break
			case State.failed:
				this.item.tooltip = 'direnv failed\nClick to reload'
				this.item.command = 'direnv.reload'
				break
		}
	}
}

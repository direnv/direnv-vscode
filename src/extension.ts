import * as fs from 'fs/promises'
import * as vscode from 'vscode'
import * as direnv from './direnv'
import * as status from './status'

class Direnv implements vscode.Disposable {
	private backup = new Map<string, string | undefined>()
	private willLoad = new vscode.EventEmitter<void>()
	private didLoad = new vscode.EventEmitter<direnv.Data>()
	private loaded = new vscode.EventEmitter<void>()
	private failed = new vscode.EventEmitter<unknown>()
	private blocked = new vscode.EventEmitter<string>()
	private viewBlocked = new vscode.EventEmitter<string>()

	constructor(private environment: vscode.EnvironmentVariableCollection, private status: status.Item) {
		this.willLoad.event(() => this.onWillLoad())
		this.didLoad.event(e => this.onDidLoad(e))
		this.loaded.event(() => this.onLoaded())
		this.failed.event(e => this.onFailed(e))
		this.blocked.event(e => this.onBlocked(e))
		this.viewBlocked.event(e => this.onViewBlocked(e))
	}

	dispose() {
		this.status.dispose()
	}

	async allow(path: string) {
		await this.try(async () => {
			await direnv.allow(path)
			this.willLoad.fire()
		})
	}

	async block(path: string) {
		await this.try(async () => {
			await direnv.block(path)
			this.willLoad.fire()
		})
	}

	reload() {
		this.willLoad.fire()
	}

	private updateEnvironment(data: direnv.Data) {
		Object.entries(data).forEach(([key, value]) => {
			if (!this.backup.has(key)) { // keep the oldest value
				this.backup.set(key, process.env[key])
			}
			process.env[key] = value
			this.environment.replace(key, value)

		})
	}

	private resetEnvironment() {
		this.backup.forEach((value, key) => {
			if (value === undefined) {
				delete process.env[key]
			} else {
				process.env[key] = value
			}
		})
		this.backup.clear()
		this.environment.clear()
	}

	private async try<T>(callback: () => Promise<T>): Promise<void> {
		try {
			await callback()
		} catch (err) {
			this.failed.fire(err)
		}
	}

	private async onWillLoad() {
		this.status.state = status.State.loading
		try {
			const data = await direnv.dump()
			this.didLoad.fire(data)
		} catch (e) {
			if (e instanceof direnv.BlockedError) {
				this.blocked.fire(e.path)
			}
		}
	}

	private onDidLoad(data: direnv.Data) {
		this.updateEnvironment(data)
		this.loaded.fire()
	}

	private onLoaded() {
		this.status.state = this.backup.size ? status.State.loaded : status.State.empty
		// TODO: restart extension host here?
	}

	private async onFailed(err: unknown) {
		this.status.state = status.State.failed
		const msg = message(err)
		if (msg !== undefined) {
			await vscode.window.showErrorMessage(`direnv error: ${msg}`)
		}
	}

	private async onBlocked(path: string) {
		this.resetEnvironment()
		this.status.state = status.State.blocked
		const options = ['Allow', 'View']
		const choice = await vscode.window.showWarningMessage(`direnv: ${path} is blocked`, ...options)
		if (choice === 'Allow') {
			await this.allow(path)
		}
		if (choice === 'View') {
			await open(path)
			this.viewBlocked.fire(path)
		}
	}

	private async onViewBlocked(path: string) {
		const choice = await vscode.window.showInformationMessage(`direnv: Allow ${path}?`, 'Allow')
		if (choice === 'Allow') {
			await this.allow(path)
		}
	}
}

function message(err: unknown): string | undefined {
	if (typeof err === 'string') { return err }
	if (err instanceof Error) { return err.message }
	console.error('unhandled error', err)
	return undefined
}

async function uri(path: string): Promise<vscode.Uri> {
	try {
		await fs.access(path)
		return vscode.Uri.file(path)
	} catch (_) {
		return vscode.Uri.file(path).with({ scheme: 'untitled' })
	}
}

async function open(path: string): Promise<void> {
	await vscode.commands.executeCommand('vscode.open', await uri(path))
}

export function activate(context: vscode.ExtensionContext) {
	const environment = context.environmentVariableCollection
	const statusItem = new status.Item(vscode.window.createStatusBarItem())
	const instance = new Direnv(environment, statusItem)
	context.subscriptions.push(instance)
	context.subscriptions.push(
		vscode.commands.registerCommand('direnv.reload', () => {
			instance.reload()
		}),
		vscode.commands.registerCommand('direnv.allow', async () => {
			const path = vscode.window.activeTextEditor?.document.fileName
			if (path !== undefined) {
				await instance.allow(path)
			}
		}),
		vscode.commands.registerCommand('direnv.block', async () => {
			const path = vscode.window.activeTextEditor?.document.fileName
			if (path !== undefined) {
				await instance.block(path)
			}
		}),
		vscode.commands.registerCommand('direnv.create', async () => {
			await open(await direnv.create())
		}),
		vscode.commands.registerCommand('direnv.open', async () => {
			await open(await direnv.find())
		}),
	)
	instance.reload()
}

export function deactivate() {
	// nothing
}

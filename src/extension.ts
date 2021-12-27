import * as fs from 'fs/promises'
import * as vscode from 'vscode'
import * as command from './command'
import * as config from './config'
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
	private blockedPath: string | undefined

	constructor(
		private environment: vscode.EnvironmentVariableCollection,
		private status: status.Item,
	) {
		this.willLoad.event(() => this.onWillLoad())
		this.didLoad.event((e) => this.onDidLoad(e))
		this.loaded.event(() => this.onLoaded())
		this.failed.event((e) => this.onFailed(e))
		this.blocked.event((e) => this.onBlocked(e))
		this.viewBlocked.event((e) => this.onViewBlocked(e))
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

	didOpen(path: string) {
		if (this.blockedPath === path) {
			this.viewBlocked.fire(path)
		}
	}

	async didSave(path: string) {
		const envrc = await direnv.find()
		if (envrc === path) {
			this.viewBlocked.fire(path)
		}
	}

	configurationChanged(event: vscode.ConfigurationChangeEvent) {
		if (!config.isAffectedBy(event)) return
		if (config.status.isAffectedBy(event)) {
			this.status.refresh()
		}
	}

	async create() {
		await this.open(await direnv.create())
	}

	async open(path?: string | undefined): Promise<void> {
		path ??= await direnv.find()
		const uri = await uriFor(path)
		const doc = await vscode.workspace.openTextDocument(uri)
		await vscode.window.showTextDocument(doc)
		this.didOpen(path)
	}

	async reload() {
		await this.try(async () => {
			await direnv.test()
			this.willLoad.fire()
		})
	}

	private updateEnvironment(data: direnv.Data) {
		Object.entries(data).forEach(([key, value]) => {
			if (!this.backup.has(key)) {
				// keep the oldest value
				this.backup.set(key, process.env[key])
			}

			if (value !== null) {
				process.env[key] = value
				this.environment.replace(key, value)
			} else {
				delete process.env[key]
				this.environment.delete(key)
			}
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
		this.blockedPath = undefined
		this.status.update(status.State.loading)
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
		let state = status.State.empty
		if (this.backup.size) {
			let changed = 0
			let removed = 0
			this.backup.forEach((_, key) => {
				if (key in process.env) {
					changed += 1
				} else {
					removed += 1
				}
			})
			state = status.State.loaded({ changed, removed })
		}
		this.status.update(state)
		// TODO: restart extension host here?
	}

	private async onFailed(err: unknown) {
		this.status.update(status.State.failed)
		const msg = message(err)
		if (msg !== undefined) {
			await vscode.window.showErrorMessage(`direnv error: ${msg}`)
		}
	}

	private async onBlocked(path: string) {
		this.blockedPath = path
		this.resetEnvironment()
		this.status.update(status.State.blocked(path))
		const options = ['Allow', 'View']
		const choice = await vscode.window.showWarningMessage(
			`direnv: ${path} is blocked`,
			...options,
		)
		if (choice === 'Allow') {
			await this.allow(path)
		}
		if (choice === 'View') {
			await this.open(path)
		}
	}

	private async onViewBlocked(path: string) {
		const choice = await vscode.window.showInformationMessage(
			`direnv: Allow ${path}?`,
			'Allow',
		)
		if (choice === 'Allow') {
			await this.allow(path)
		}
	}
}

function message(err: unknown): string | undefined {
	if (typeof err === 'string') {
		return err
	}
	if (err instanceof Error) {
		return err.message
	}
	console.error('unhandled error', err)
	return undefined
}

async function uriFor(path: string): Promise<vscode.Uri> {
	try {
		await fs.access(path)
		return vscode.Uri.file(path)
	} catch (_) {
		return vscode.Uri.file(path).with({ scheme: 'untitled' })
	}
}

export async function activate(context: vscode.ExtensionContext) {
	const environment = context.environmentVariableCollection
	const statusItem = new status.Item(vscode.window.createStatusBarItem())
	const instance = new Direnv(environment, statusItem)
	context.subscriptions.push(instance)
	context.subscriptions.push(
		vscode.commands.registerCommand(command.Direnv.reload, async () => {
			await instance.reload()
		}),
		vscode.commands.registerCommand(command.Direnv.allow, async () => {
			const path = vscode.window.activeTextEditor?.document.fileName
			if (path !== undefined) {
				await instance.allow(path)
			}
		}),
		vscode.commands.registerCommand(command.Direnv.block, async () => {
			const path = vscode.window.activeTextEditor?.document.fileName
			if (path !== undefined) {
				await instance.block(path)
			}
		}),
		vscode.commands.registerCommand(command.Direnv.create, async () => {
			await instance.create()
		}),
		vscode.commands.registerCommand(command.Direnv.open, async () => {
			await instance.open()
		}),
		vscode.workspace.onDidOpenTextDocument((e) => {
			instance.didOpen(e.fileName)
		}),
		vscode.workspace.onDidSaveTextDocument(async (e) => {
			await instance.didSave(e.fileName)
		}),
		vscode.workspace.onDidChangeConfiguration((e) => {
			instance.configurationChanged(e)
		}),
	)
	await instance.reload()
}

export function deactivate() {
	// nothing
}

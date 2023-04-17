import path from 'path'
import vscode from 'vscode'
import { Checksum } from './checksum'
import * as command from './command'
import config from './config'
import * as direnv from './direnv'
import { Data, isInternal } from './direnv'
import * as status from './status'

const enum Cached {
	checksum = 'direnv.checksum',
	environment = 'direnv.environment',
}

const installationUri = vscode.Uri.parse('https://direnv.net/docs/installation.html')

class Direnv implements vscode.Disposable {
	private output = vscode.window.createOutputChannel('direnv')
	private backup = new Map<string, string | undefined>()
	private willLoad = new vscode.EventEmitter<void>()
	private didLoad = new vscode.EventEmitter<Data>()
	private loaded = new vscode.EventEmitter<void>()
	private failed = new vscode.EventEmitter<unknown>()
	private blocked = new vscode.EventEmitter<direnv.BlockedError>()
	private viewBlocked = new vscode.EventEmitter<string>()
	private didUpdate = new vscode.EventEmitter<void>()
	private blockedPath?: string
	private watchers = vscode.Disposable.from()

	constructor(private context: vscode.ExtensionContext, private status: status.Item) {
		this.willLoad.event(() => this.onWillLoad())
		this.didLoad.event((e) => this.onDidLoad(e))
		this.loaded.event(() => this.onLoaded())
		this.failed.event((e) => this.onFailed(e))
		this.blocked.event((e) => this.onBlocked(e))
		this.viewBlocked.event((e) => this.onViewBlocked(e))
		this.didUpdate.event(() => this.onDidUpdate())
	}

	private get environment() {
		return this.context.environmentVariableCollection
	}

	private get cache() {
		return this.context.workspaceState
	}

	dispose() {
		this.output.dispose()
		this.status.dispose()
		this.watchers.dispose()
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

	didSave(path: string) {
		if (this.blockedPath === path) {
			this.viewBlocked.fire(path)
		}
	}

	async configurationChanged(event: vscode.ConfigurationChangeEvent) {
		if (!config.isAffectedBy(event)) return
		if (config.path.isAffectedBy(event)) {
			await this.reload()
		}
		if (config.status.isAffectedBy(event)) {
			this.status.refresh()
		}
	}

	async create() {
		await this.open(await direnv.create())
	}

	async open(path?: string) {
		path ??= await direnv.find()
		const uri = await uriFor(path)
		const doc = await vscode.workspace.openTextDocument(uri)
		await vscode.window.showTextDocument(doc)
		this.didOpen(path)
	}

	async reload() {
		await this.resetCache()
		await this.load()
	}

	async reset() {
		this.resetEnvironment()
		await this.resetCache()
		await this.load()
	}

	async restore() {
		const data = this.restoreCache()
		this.updateEnvironment(data)
		await this.load()
	}

	private restoreCache() {
		const checksum = this.cache.get<string>(Cached.checksum)
		if (checksum === undefined) return
		const entries = this.cache.get<Array<[string, string]>>(Cached.environment)
		if (!Array.isArray(entries)) return
		const data = new Map(entries)
		const hash = new Checksum()
		data.forEach((_, key) => {
			hash.update(key, process.env[key])
		})
		if (checksum !== hash.digest()) return
		return data
	}

	private async updateCache() {
		const hash = new Checksum()
		const entries = new Array<[string, string]>()
		this.backup.forEach((value, key) => {
			hash.update(key, value)
			entries.push([key, process.env[key] ?? ''])
		})
		await this.cache.update(Cached.checksum, hash.digest())
		await this.cache.update(Cached.environment, entries)
	}

	private async resetCache() {
		await this.cache.update(Cached.environment, undefined)
	}

	private createWatcher(file: string) {
		const dirname = path.dirname(file)
		const basename = path.basename(file)
		const pattern = new vscode.RelativePattern(vscode.Uri.file(dirname), basename)
		const watcher = vscode.workspace.createFileSystemWatcher(pattern)
		watcher.onDidChange(() => this.reload())
		watcher.onDidCreate(() => this.reload())
		watcher.onDidDelete(() => this.reload())
		this.output.appendLine(`watching: ${file}`)
		return watcher
	}

	private updateWatchers(data?: Data) {
		this.watchers.dispose()
		this.watchers = vscode.Disposable.from(
			...direnv.watches(data).map((it) => this.createWatcher(it.Path)),
		)
	}

	private updateEnvironment(data?: Data) {
		if (data === undefined) return
		data.forEach((value, key) => {
			if (!this.backup.has(key)) {
				// keep the oldest value
				this.backup.set(key, process.env[key])
			}

			value ??= '' // can't unset, set to empty instead
			process.env[key] = value
			this.environment.replace(key, value)
		})
		this.updateWatchers(data)
	}

	private resetEnvironment(data?: Data) {
		this.backup.forEach((value, key) => {
			if (value === undefined) {
				delete process.env[key]
			} else {
				process.env[key] = value
			}
		})
		this.backup.clear()
		this.environment.clear()
		this.updateWatchers(data)
	}

	private async load() {
		await this.try(async () => {
			await direnv.test()
			this.willLoad.fire()
		})
	}

	private async try<T>(callback: () => Promise<T>) {
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
		} catch (err) {
			if (err instanceof direnv.BlockedError) {
				this.blocked.fire(err)
			}
		}
	}

	private async onDidLoad(data: Data) {
		this.updateEnvironment(data)
		await this.updateCache()
		this.loaded.fire()
		if ([...data.keys()].every(isInternal)) return
		this.didUpdate.fire()
	}

	private onLoaded() {
		let state = status.State.empty
		if (this.backup.size) {
			let added = 0
			let changed = 0
			let removed = 0
			this.backup.forEach((was, key) => {
				if (isInternal(key)) return
				if (was === undefined) {
					added += 1
					this.output.appendLine(`added: ${key}`)
				} else if (key in process.env) {
					changed += 1
					this.output.appendLine(`changed: ${key}`)
				} else {
					removed += 1
					this.output.appendLine(`removed: ${key}`)
				}
				if (was) {
					this.output.appendLine(`was: ${was}`)
				}
				const now = process.env[key]
				if (now) {
					this.output.appendLine(`now: ${now}`)
				}
			})
			state = status.State.loaded({ added, changed, removed })
		}
		this.status.update(state)
	}

	private async onFailed(err: unknown) {
		this.status.update(status.State.failed)
		if (err instanceof direnv.CommandNotFoundError) {
			const options = ['Install', 'Configure']
			const choice = await vscode.window.showErrorMessage(
				`direnv error: ${err.message}`,
				...options,
			)
			if (choice === 'Install') {
				await vscode.env.openExternal(installationUri)
			}
			if (choice === 'Configure') {
				await config.path.executable.open()
			}
			return
		}
		const msg = message(err)
		if (msg !== undefined) {
			await vscode.window.showErrorMessage(`direnv error: ${msg}`)
		}
	}

	private async onBlocked(e: direnv.BlockedError) {
		this.blockedPath = e.path
		this.resetEnvironment(e.data)
		await this.resetCache()
		this.status.update(status.State.blocked(e.path))
		const options = ['Allow', 'View']
		const choice = await vscode.window.showWarningMessage(
			`direnv: ${e.path} is blocked`,
			...options,
		)
		if (choice === 'Allow') {
			await this.allow(e.path)
		}
		if (choice === 'View') {
			await this.open(e.path)
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

	private async onDidUpdate() {
		if (await this.shouldRestart()) {
			if (vscode.env.remoteName === undefined) {
				await vscode.commands.executeCommand('workbench.action.restartExtensionHost')
			} else {
				await vscode.commands.executeCommand('workbench.action.reloadWindow')
			}
		}
	}

	private async shouldRestart() {
		if (config.restart.automatic.get()) return true
		const choice = await vscode.window.showWarningMessage(
			`direnv: Environment updated. Restart extensions?`,
			'Restart',
		)
		return choice === 'Restart'
	}
}

function message(err: unknown) {
	if (typeof err === 'string') {
		return err
	}
	if (err instanceof Error) {
		return err.message
	}
	console.error('unhandled error', err)
	return
}

async function uriFor(path: string) {
	const uri = vscode.Uri.file(path)
	try {
		await vscode.workspace.fs.stat(uri)
		return uri
	} catch (_) {
		return uri.with({ scheme: 'untitled' })
	}
}

export function activate(context: vscode.ExtensionContext) {
	const statusItem = new status.Item(vscode.window.createStatusBarItem())
	const instance = new Direnv(context, statusItem)
	context.subscriptions.push(instance)
	context.subscriptions.push(
		vscode.commands.registerCommand(command.Direnv.reload, async () => {
			await instance.reload()
		}),
		vscode.commands.registerCommand(command.Direnv.reset, async () => {
			await instance.reset()
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
		vscode.workspace.onDidSaveTextDocument((e) => {
			instance.didSave(e.fileName)
		}),
		vscode.workspace.onDidChangeConfiguration(async (e) => {
			await instance.configurationChanged(e)
		}),
	)
	void instance.restore()
}

export function deactivate() {
	// nothing
}

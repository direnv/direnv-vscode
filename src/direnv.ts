import cp from 'child_process'
import { promisify } from 'util'
import vscode from 'vscode'
import zlib from 'zlib'
import config from './config'

const execFile = promisify(cp.execFile)

export class BlockedError extends Error {
	constructor(public readonly path: string) {
		super(`${path} is blocked`)
	}
}

export class CommandNotFoundError extends Error {
	constructor(public readonly path: string) {
		super(`${path}: command not found`)
	}
}

export type Data = {
	[key: string]: string
}

export type Watch = Record<'Path', string>

export type Stdio = {
	stdout: string
	stderr: string
}

function isStdio(e: unknown): e is Stdio {
	if (typeof e !== 'object' || e === null || e === undefined) {
		return false
	}
	return 'stdout' in e && 'stderr' in e
}

function isCommandNotFound(e: unknown, path: string): boolean {
	if (!(e instanceof Error)) return false
	if (!('path' in e) || !('code' in e)) return false
	return e['path'] === path && e['code'] === 'ENOENT'
}

const echo = {
	['EDITOR']: 'echo',
}

function cwd() {
	return vscode.workspace.workspaceFolders?.[0].uri.path ?? process.cwd()
}

async function direnv(args: string[], env?: NodeJS.ProcessEnv): Promise<Stdio> {
	const options: cp.ExecOptionsWithStringEncoding = {
		encoding: 'utf8',
		cwd: cwd(), // same as default cwd for shell tasks
		env: {
			...process.env,
			['TERM']: 'dumb',
			...env,
		},
	}
	const command = config.path.executable.get()
	try {
		return await execFile(command, args, options)
	} catch (e) {
		if (isCommandNotFound(e, command)) {
			throw new CommandNotFoundError(command)
		}
		throw e
	}
}

export async function test(): Promise<void> {
	await direnv(['version'])
}

export async function allow(path: string): Promise<void> {
	await direnv(['allow', path])
}

export async function block(path: string): Promise<void> {
	await direnv(['deny', path])
}

export async function create(): Promise<string> {
	const { stdout } = await direnv(['edit', cwd()], echo)
	return stdout.trimEnd()
}

export async function find(): Promise<string> {
	try {
		const { stdout } = await direnv(['edit'], echo)
		return stdout.trimEnd()
	} catch (e) {
		if (isStdio(e)) {
			const found = /direnv: error (?<path>.+) not found./.exec(e.stderr)
			if (found) {
				// .envrc not found, create a new one
				return create()
			}
		}
		throw e
	}
}

export async function dump(): Promise<Data> {
	try {
		const { stdout } = await direnv(['export', 'json'])
		if (!stdout) return {}
		return JSON.parse(stdout) as Data
	} catch (e) {
		if (isStdio(e)) {
			const found = /direnv: error (?<path>.+) is blocked./.exec(e.stderr)
			if (found && found.groups?.path) {
				// .envrc is blocked, let caller ask user what to do
				throw new BlockedError(found.groups.path)
			}
		}
		throw e
	}
}

export function watches(): Watch[] {
	return decode(process.env.DIRENV_WATCHES) ?? []
}

function decode<T>(gzenv?: string): T | undefined {
	if (!gzenv) return undefined
	const deflated = Buffer.from(gzenv, 'base64url')
	const inflated = zlib.inflateSync(deflated)
	const json = inflated.toString('utf8')
	return JSON.parse(json) as T
}

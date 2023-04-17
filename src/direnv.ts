import cp from 'child_process'
import vscode from 'vscode'
import zlib from 'zlib'
import config from './config'

export class BlockedError extends Error {
	constructor(public readonly path: string, public readonly data: Data) {
		super(`${path} is blocked`)
	}
}

export class CommandNotFoundError extends Error {
	constructor(public readonly path: string) {
		super(`${path}: command not found`)
	}
}

export type Data = Map<string, string>

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

function direnv(args: string[], env?: NodeJS.ProcessEnv): string {
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
		return cp.execFileSync(command, args, options)
	} catch (e) {
		if (isCommandNotFound(e, command)) {
			throw new CommandNotFoundError(command)
		}
		throw e
	}
}

export function test() {
	direnv(['version'])
}

export function allow(path: string) {
	direnv(['allow', path])
}

export function block(path: string) {
	direnv(['deny', path])
}

export function create(): string {
	return direnv(['edit', cwd()], echo).trimEnd()
}

export function find(): string {
	try {
		return direnv(['edit'], echo).trimEnd()
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

export function dump(): Data {
	try {
		return parse(direnv(['export', 'json']))
	} catch (e) {
		if (isStdio(e)) {
			const found = /direnv: error (?<path>.+) is blocked./.exec(e.stderr)
			if (found && found.groups?.path) {
				// .envrc is blocked, let caller ask user what to do
				throw new BlockedError(found.groups.path, parse(e.stdout, isInternal))
			}
		}
		throw e
	}
}

function parse(stdout: string, predicate: (key: string) => boolean = () => true): Data {
	if (!stdout) return new Map()
	const record = JSON.parse(stdout) as Record<string, string>
	return new Map(Object.entries(record).filter(([key]) => predicate(key)))
}

export function isInternal(key: string) {
	return key.startsWith('DIRENV_')
}

export function watches(data?: Data): Watch[] {
	if (data === undefined) return []
	return decode(data.get('DIRENV_WATCHES')) ?? []
}

function decode<T>(gzenv?: string): T | undefined {
	if (!gzenv) return undefined
	const deflated = Buffer.from(gzenv, 'base64url')
	const inflated = zlib.inflateSync(deflated)
	const json = inflated.toString('utf8')
	return JSON.parse(json) as T
}

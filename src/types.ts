export class BlockedError extends Error {
	constructor(public readonly path: string) {
		super(`${path} is blocked`);
	}
}

export type Data = {
	[key: string]: string;
};

export type Stdio = {
	stdout: string,
	stderr: string,
};

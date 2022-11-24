import crypto from 'crypto'

export class Checksum {
	private hash = crypto.createHash('sha1')

	public update(key: string, value: string | undefined) {
		this.hash.update(`${key}=${value ?? ''}\n`)
		return this
	}

	public digest() {
		return this.hash.digest('base64url')
	}
}

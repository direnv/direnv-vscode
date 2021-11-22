import * as assert from 'assert';
import * as sinon from 'sinon';
import * as status from '../../status';

describe('the status item', () => {
	const item = status.item;

	it('loads during the callback', async()=>{
		const promise = sinon.promise();
		const watch = status.watch(() => promise);
		assert.strict.equal(item.command, undefined);
		assert.strict.equal(item.text, `${status.icon}${status.wait}`);
		promise.resolve(null);
		await watch;
	});

	it('succeeds with the callback', async () => {
		const promise = sinon.promise().resolve(1);
		const watch = status.watch(() => promise);
		assert.strict.equal(await watch, 1);
		assert.strict.equal(item.command, 'direnv.reload');
		assert.strict.equal(item.text, `${status.icon}${status.ok}`);
	});

	it('fails with the callback', async () => {
		const promise = sinon.promise().reject(2);
		const watch = status.watch(() => promise);
		try {
			await watch;
		} catch(e) {
			assert.strict.equal(e, 2);
			assert.strict.equal(item.command, 'direnv.reload');
			assert.strict.equal(item.text, `${status.icon}${status.no}`);
		}
	});
});

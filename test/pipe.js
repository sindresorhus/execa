import test from 'ava';
import execa from '../';

test('pipe small file', async t => {
	const proc = execa('cat', [`${__dirname}/fixtures/small.txt`]);
	await proc.then(result => {
		t.is(typeof result, 'object');
		t.pass();
	})
	.catch(err => {
		console.log('error');
		console.log(err);
		t.fail(err);
	});
});

test('pipe large file', async t => {
	const proc = execa('cat', [`${__dirname}/fixtures/large.txt`]);

	await proc.then(result => {
		t.is(typeof result, 'object');
		t.is(result.stdout.length, 20000000);
		t.pass();
	})
	.catch(err => {
		t.fail(err);
	});
});

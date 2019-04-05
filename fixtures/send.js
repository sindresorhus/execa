process.on('message', message => {
	if (message === 'ping') {
		process.send('pong');
	} else {
		throw new Error('Receive wrong message');
	}
});

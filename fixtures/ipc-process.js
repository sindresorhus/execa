'use strict';
process.on('message', m => {
	if (m === 'ping') {
		process.send(process.argv[2] || 'pong');
	} else {
		process.send('rainbow');
	}
});

const rl = require('readline');
const { Server } = require('socket.io');
const Counter = require('./counter');

function createTerminalInterface(io) {
	const interface = rl.createInterface(process.stdin, process.stdout);
	interface.on('line', handleCommand.bind(this, io));
	return interface;
};

/**
 * 
 * @param {Server} io
 * @param {string} input 
 * @param {bool} local 
 */
function handleCommand(io, input, local = true) {
	const parts = input.split(' ');
	const cmd = parts[0];
	const args = parts.slice(1);

	if (cmd === 'time') {
		const cn = args[0] ?? Counter.counters.keys()[0];
		const counter = Counter.get(cn);

		if (!counter) return console.log('This counter does not exist!');

		return console.log(counter.trueDate.toUTCString());
	}

	if (cmd === 'ctr') {
		if (args.length === 0) return console.log(Array.from(Counter.counters.keys()).join('\n'));

		const counter = Counter.get(args[0]);
		if (!counter && args[1] != 'create') return console.log('This counter does not exist!');
		if (counter && args[1] == 'create') return console.log('This counter already exists!');

		if (args.length === 1) return counter.statusMessage();

		if (args[1] === 'pause') {
			counter.running = !counter.running;
			console.log(`Counter ${counter.name} running: ${counter.running}`);
			return counter;
		}
		else if (args[1] === 'speed') {
			if (args.length === 2) return console.log(`Counter ${counter.name} speed: ${counter.speedModifier}x`);

			const newSpeed = Number(args[2]);
			if (newSpeed === NaN || newSpeed === 0) return console.log(`Invalid speed modifier!`);

			counter.speedModifier = newSpeed;
			console.log(`Counter ${counter.name} speed: ${counter.speedModifier}x`);
			return counter;
		}
		else if (args[1] === 'startpoint') {

		}
		else if (args[1] === 'create') {
			const speed = Number(args[2]) || 1;
			const startPoint = Number(args[3]) || Date.now();

			const createdCounter = new Counter(args[0], io, { speedMofidier: speed, startPoint });
			console.log(`Counter created!`);
			return createdCounter;
		}
	}
};

module.exports = { createTerminalInterface };
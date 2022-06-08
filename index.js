const Express = require('express');
const fs = require('fs');
const p = require('path');
const rl = require('readline');
const terminal = rl.createInterface({ input: process.stdin, output: process.stdout });
const { Server } = require('socket.io');
const http = require('http');
const app = Express();
const server = http.createServer(app);
const io = new Server(server);

if (!fs.existsSync(p.join(__dirname, 'data.json'))) {
	fs.writeFileSync(p.join(__dirname, 'data.json'), '{}');
};

const loadData = require('./data.json');
const data = {
	startPoint: loadData.startPoint ?? Date.now(),
	elapsed: Date.now(),
	trueElapsed: loadData.trueElapsed ?? 0,
	running: false,
	speedModifier: loadData.speedModifier ?? 1,
};
/** how many REAL ms since last data update */
const realDiff = () => Math.abs(Date.now() - data.elapsed);
/** how many TRUE ms since last data update */
const trueDiff = () => realDiff * data.speedModifier;
/** how many TRUE ms passed from start */
const trueMs = () => data.trueElapsed + trueDiff();
/** Current TRUE date, according to startPoint */
const trueDate = () => new Date(trueMs() + data.startPoint);

console.log(`------------------------------------------------------------------------`);
console.log('Current status:');
console.log(`Starting point: ${new Date(data.startPoint).toUTCString()}`);
console.log(`True elapsed time: ${data.elapsed} milliseconds`);
console.log(`Speed modifier: ${data.speedModifier}x`);
console.log(`Currently running: ${data.running}`);
console.log(`Current TRUE time and date: ${trueDate().toUTCString()}`);
console.log(`------------------------------------------------------------------------`);
console.log(`Ready!`);

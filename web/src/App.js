import React, { useEffect, useState } from 'react';
import './App.css';
import io from 'socket.io-client';

import { motion } from 'framer-motion';
import useInterval from './useInterval';

const socket = io('http://localhost:3015');

function App() {
	const [state, setState] = useState();
	const [refresh, setRefresh] = useState(0);
	const [show, setShow] = useState();
	const [currentTime, setTime] = useState('Loading...');

	useEffect(() => {
		socket.emit('counters', (res) => {
			setState(res);
		});
	}, [refresh]);

	useEffect(() => {
		if (show) {
			socket.emit('time', show, (res) => {
				setState(res);
			});
			socket.emit('subscribe', show, res => {

			});
			socket.on('stateChange', (ctr, meta) => {
				if (ctr !== show) return;
				setState(meta);
			});
		}
	}, [show]);

	const variants = {
        hidden: { 
        }, 
        visible: { 
            opacity: 1,
            transition: { 
                delayChildren: 1,
                staggerChildren: 0.5
            }
        }
    };

	const children = {
        hidden: { opacity: 0, y: 20 }, 
        visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: 'easeInOut', } }
    };

	
	useInterval(() => {
		if (!show || !state?.name) return;

		const realDiff = Math.abs(Date.now() - state.elapsed);
		/** how many TRUE ms since last data update */
		const trueDiff = realDiff * state.speedModifier;
		/** how many TRUE ms passed from start */
		const trueMs = state.running ? state.trueElapsed + trueDiff : state.trueElapsed;
		/** Current TRUE date, according to startPoint */
		const trueDate = new Date(trueMs + state.startPoint);

		setTime(trueDate.toUTCString());
	}, 50)	

	const sopts = socket.io.opts;
	console.log(state);

	if (!show) {
		return (
			<div className="App">
				<div className="App-header">
					<h1>TimeCounter</h1>
					<p>Available counters: </p><button onClick={() => setRefresh(refresh + 1)}>Refresh counters</button>
					{Array.isArray(state?.counters) ? state.counters.map(ctr => (<button key={ctr} onClick={() => setShow(ctr)}>{ctr}</button>)) : <p>No counters currently available</p>}
					<small>{socket.connected ? <p>Connected to: <code>{sopts.hostname}:{sopts.port}{sopts.path}</code></p> : `Disconnected`}</small>
				</div>
			</div>
		);
	}
	else {
		return (
			<div className="App">
				<div className="App-header">
					<motion.div variants={variants} initial="hidden" animate="visible">
						<motion.h4 variants={children}>{currentTime}</motion.h4>
					</motion.div>
				</div>
			</div>
		)
	}
}

export default App;

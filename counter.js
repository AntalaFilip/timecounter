const fs = require("fs");
const p = require("path");
const { Server } = require("socket.io");

/** @type {Map<string, Counter>} */
const counters = new Map();

class Counter {
  /**
   *
   * @param {string} name
   * @param {Server} io
   */
  constructor(name, io, data) {
    this.name = name;
    this.io = io;
    this.dataFilePath = p.join(__dirname, "data", `${name}.json`);

    if (!fs.existsSync(this.dataFilePath)) {
      fs.writeFileSync(this.dataFilePath, "{}");
    }

    this.loadData = data ?? require(`./data/${this.name}.json`);
    this._running = false;
    this._startPoint = this.loadData.startPoint ?? Date.now();
    this._speedModifier = this.loadData.speedModifier || 1;
    this._elapsed = Date.now();
    this._trueElapsed = this.loadData.trueElapsed ?? 0;
    this.password = this.loadData.password;

    this.statusMessage();
    io.emit("newCounter", this.name);
    this.save(false);
    counters.set(this.name, this);
  }

  /** how many REAL ms since last data update */
  get realDiff() {
    return Math.abs(Date.now() - this._elapsed);
  }
  /** how many TRUE ms since last data update */
  get trueDiff() {
    return this.realDiff * this.speedModifier;
  }
  /** how many TRUE ms passed from start */
  get trueMs() {
    if (!this.running) {
      return this._trueElapsed;
    }
    return this._trueElapsed + this.trueDiff;
  }
  /** Current TRUE date, according to startPoint */
  get trueDate() {
    return new Date(this.trueMs + this.startPoint);
  }

  /**
   * @param {boolean} bool
   */
  set running(bool) {
    this.save();
    this._running = bool;
    this.save();
  }
  get running() {
    return this._running;
  }

  /**
   * @param {number} num
   */
  set speedModifier(num) {
    this.save();
    this._speedModifier = num;
    this.save();
  }
  get speedModifier() {
    return this._speedModifier;
  }

  /**
   * @param {number} num
   */
  set startPoint(num) {
    this.save();
    this._startPoint = num;
    this.save();
  }
  get startPoint() {
    return this._startPoint;
  }

  /**
   * @param {boolean} bc
   */
  save(bc = true) {
    this._trueElapsed = this.trueMs;
    this._elapsed = Date.now();
    if (bc)
      this.io.to(this.name).emit("stateChange", this.name, this.metadata());
    fs.writeFileSync(this.dataFilePath, JSON.stringify(this.metadata()));
  }

  metadata() {
    return {
      name: this.name,
      running: this.running,
      startPoint: this.startPoint,
      speedModifier: this.speedModifier,
      elapsed: this._elapsed,
      trueElapsed: this._trueElapsed,
      password: this.password,
    };
  }

  statusMessage() {
    console.log(
      `------------------------------------------------------------------------`
    );
    console.log(`Counter (${this.name}) status:`);
    console.log(`Starting point: ${new Date(this.startPoint).toUTCString()}`);
    console.log(`True elapsed time: ${this.trueDate.getTime()}`);
    console.log(
      `True elapsed time before update: ${this._elapsed} milliseconds`
    );
    console.log(`Speed modifier: ${this.speedModifier}x`);
    console.log(`Currently running: ${this.running}`);
    console.log(`Current TRUE time and date: ${this.trueDate.toUTCString()}`);
    console.log(
      `------------------------------------------------------------------------`
    );
  }

  static get counters() {
    return counters;
  }
  static get(counter) {
    return counters.get(counter);
  }
}

module.exports = Counter;

"use strict";

const app = document.getElementById('app');
const canvas = app.querySelector('canvas');
const textarea = app.querySelector('.program textarea');
const codeButtons = {
    run: app.querySelector('.program button.run'),
    clear: app.querySelector('.program button.clear'),
};
const buttons = {
    up: app.querySelector('button.up'),
    down: app.querySelector('button.down'),
    left: app.querySelector('button.left'),
    right: app.querySelector('button.right'),
    reset: app.querySelector('button.reset'),
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} step
 * @param {string} color
 */
const drawGrid = (canvas, step, color) => {
    const {width, height} = canvas;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    for (let x = 0; x <= width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        // console.log('x=', x);
    }

    for (let y = 0; y <= height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
};

const setPoint = (canvas, x, y, step, color, weight) => {
    const {width, height} = canvas;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = weight;
    ctx.beginPath();
    ctx.arc(x * step, y * step, weight, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
};

const drawLine = (canvas, x1, y1, x2, y2, step, color, weight) => {
    const {width, height} = canvas;
    setPoint(canvas, x1, y1, step, color, weight);
    setPoint(canvas, x2, y2, step, color, weight);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = weight;
    ctx.beginPath();
    ctx.moveTo(x1 * step, y1 * step);
    ctx.lineTo(x2 * step, y2 * step);
    ctx.stroke();
};

const clearCanvas = (canvas) => {
    const {width, height} = canvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
};

/**
 * @param {HTMLTextAreaElement} textarea
 * @param {string} str
 */
const addStringToTextarea = (textarea, str) => {
    // console.log(textarea.innerHTML);
    textarea.value += `${str}\n`
};

const clearTextarea = textarea => {
    textarea.value = '';
};

class Drawer {
    static _allowedCommands = [
        'up',
        'down',
        'left',
        'right',
        'reset',
    ];

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {number} step
     * @param {string} gridColor
     * @param {string} lineColor
     * @param {number} weight
     * @param {string} cursorColor
     * @param {HTMLTextAreaElement} textarea
     * @param {number} sleepRun
     */
    constructor(canvas, step, gridColor, lineColor, weight, cursorColor, textarea, sleepRun = 200) {
        this.canvas = canvas;
        this.step = step;
        this.gridColor = gridColor;
        this.lineColor = lineColor;
        this.weight = weight;
        this.cursorColor = cursorColor;
        this.textarea = textarea;
        this.sleepRun = sleepRun;

        this._isRun = false;
        this._commands = [];
        this._stepWidth = Math.ceil(canvas.width / step);
        this._stepHeight = Math.ceil(canvas.height / step);
        this._currentPosition = {
            x: 0,
            y: 0,
        };
    }

    _drawCursor() {
        setPoint(this.canvas, this._currentPosition.x, this._currentPosition.y, this.step, this.cursorColor, this.weight);
    }

    _addCommand(command) {

    }

    /**
     * @param {string} command
     */
    executeCommand(command) {
        if (!this.constructor._allowedCommands.includes(command) || this._isRun) {
            return;
        }
        const method = `_${command}`;
        this[method]();
        this._commands.push(command);
        addStringToTextarea(this.textarea, command);
    }

    async runProgram() {
        const program = this.textarea.value;
        this._isRun = true;
        const commands = program
            .split('\n')
            .map(s => s.trim().toLowerCase())
            .filter(s => !!s)
            .filter(c => this.constructor._allowedCommands.includes(c));
        this._reset();
        for (const command of commands) {
            const method = `_${command}`;
            this[method]();
            await new Promise(resolve => setTimeout(resolve, this.sleepRun));
        }
        this._isRun = false;
    }

    _reset() {
        this._currentPosition = {
            x: Math.round(this._stepWidth / 2),
            y: Math.round(this._stepHeight / 2),
        };
        clearCanvas(this.canvas);
        drawGrid(this.canvas, this.step, this.gridColor);
        this._drawCursor();
        this._commands.splice(0, this._commands.length);
    }

    _up() {
        const point = this._currentPosition;
        drawLine(this.canvas, point.x, point.y, point.x, --point.y, this.step, this.lineColor, this.weight);
        this._drawCursor();
    }

    _down() {
        const point = this._currentPosition;
        drawLine(this.canvas, point.x, point.y, point.x, ++point.y, this.step, this.lineColor, this.weight);
        this._drawCursor();
    }

    _left() {
        const point = this._currentPosition;
        drawLine(this.canvas, point.x, point.y, --point.x, point.y, this.step, this.lineColor, this.weight);
        this._drawCursor();
    }

    _right() {
        const point = this._currentPosition;
        drawLine(this.canvas, point.x, point.y, ++point.x, point.y, this.step, this.lineColor, this.weight);
        this._drawCursor();
    }

}

const drawer = new Drawer(canvas, 25, 'whitesmoke', 'red', 2, 'blue', textarea);

Reflect.ownKeys(buttons).forEach(name => {
    const button = buttons[name];
    button.addEventListener('click', drawer.executeCommand.bind(drawer, name));
});
let isProgramFocus = false;

textarea.addEventListener('focus', e => isProgramFocus = true);
textarea.addEventListener('blur', e => isProgramFocus = false);

document.addEventListener('keyup', e => {
    if (isProgramFocus) {
        return;
    }
    switch (e.code) {
        case 'ArrowUp':
            drawer.executeCommand('up');
            break;
        case 'ArrowDown':
            drawer.executeCommand('down');
            break;
        case 'ArrowLeft':
            drawer.executeCommand('left');
            break;
        case 'ArrowRight':
            drawer.executeCommand('right');
            break;
        case 'Escape':
            drawer.executeCommand('reset');
            break;

    }
});

codeButtons.run.addEventListener('click', () => {
    drawer.runProgram();
});

drawer.executeCommand('reset');

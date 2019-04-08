export default class Neuron {
    private readonly alpha: number; // TODO: make a constant elsewhere
    private readonly x: number;
    private readonly i: number;
    private _potential: number;
    private _output: number;

    constructor(alpha: number, x: number, i: number, potential: number) {
        this.alpha = alpha;
        this.x = x;
        this.i = i;
        this._potential = potential;
        this._output = Number.MIN_VALUE;
    }

    public get potential() {
        return this._potential;
    }

    public setPotential(potential: number) {
        this._potential = potential;
    }

    public get output() {
        return this._output;
    }

    public updateOutput() {
        this._output = 0.5 * (1 + Math.tanh(this.alpha * this._potential));
    }

    public toString(): string {
        // TODO: decimal format
        return `[${this.x}][${this.i}] - pot.${this._potential} -> ${this._output}`;
    }
}
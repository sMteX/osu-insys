import City from './City';
import Neuron from './Neuron';
import {ISettings} from "./HopfieldUI";

export default class HopfieldNet {
  private readonly n: number;
  private readonly neurons: Neuron[][];
  private readonly distances: number[][];

  private readonly maxIterations: number;
  private readonly dt: number;
  private readonly alpha: number;
  private readonly A: number;
  private readonly B: number;
  private readonly C: number;
  private readonly D: number;

  constructor(cities: City[],
              settings: ISettings) {
    const {dt, alpha, A, B, C, D, maxIterations} = settings;
    this.dt = dt;
    this.alpha = alpha;
    this.A = A;
    this.B = B;
    this.C = C;
    this.D = D;
    this.maxIterations = maxIterations;
    this.n = cities.length;
    this.neurons = Array.from({length: this.n}).map(_ => Array.from({length: this.n}));
    this.distances = Array.from({length: this.n}).map(_ => Array.from({length: this.n}));

    this.populateDistances(cities);
    this.setupNeurons();
  }

  private copyNeurons(neurons: Neuron[][]): Neuron[][] {
    const ret: Neuron[][] = Array.from({length: this.n}).map(_ => Array.from({length: this.n}));
    for (let x = 0; x < this.n; x++) {
      for (let i = 0; i < this.n; i++) {
        ret[x][i] = new Neuron(this.alpha, x, i, neurons[x][i].potential);
        ret[x][i].updateOutput();
      }
    }
    return ret;
  };

  public train(): void {
    console.log('Initial network:', this.toString());
    let iteration = 0;
    const magicCondition = true;
    const start = performance.now();

    let minE = Number.MAX_VALUE;
    let minIt = 0;
    let minNeurons: Neuron[][] = [];
    while (iteration < this.maxIterations && magicCondition) {
      this.iterate();
      // console.log(`After ${iteration} iteration:\n`, this.toString());
      const t = performance.now() - start;
      const e = this.E;
      if (e < minE) {
        minE = e;
        minIt = iteration;
        minNeurons = this.copyNeurons(this.neurons);
      }
      // console.log(`Iteration ${iteration} (${t} ms): E = ${e}`);
      iteration++;
    }
    console.log(`Best iteration: ${minIt}, error: ${minE}`);
    console.log('Best neurons:\n', HopfieldNet.stringifyNeurons(minNeurons));
  }

  private get E(): number {
    let Apart = 0, Bpart = 0, Cpart = 0, Dpart = 0;
    for (let x = 0; x < this.n; x++) {
      for (let i = 0; i < this.n; i++) {
        const maxI = Math.min(i + 1, this.n - 1);
        const minI = Math.max(i - 1, 0);
        // cast pro C (celkova suma aktivaci) iteruje jen 2x
        Cpart += this.neurons[x][i].output;
        for (let j = 0; j < this.n; j++) {
          if (j == i) {
            continue;
          }
          Apart += this.neurons[x][i].output * this.neurons[x][j].output;
        }
        for (let y = 0; y < this.n; y++) {
          if (y == x) {
            continue;
          }
          Bpart += this.neurons[x][i].output * this.neurons[y][i].output;
          Dpart += this.distances[x][y] * this.neurons[x][i].output * (this.neurons[y][maxI].output + this.neurons[y][minI].output);
        }
      }
    }
    return this.A * Apart
      + this.B * Bpart
      + this.C * Math.pow(this.n - Cpart, 2)
      + this.D * Dpart;
  }

  public toString(): string {
    return HopfieldNet.stringifyNeurons(this.neurons);
  }

  private iterate(): void {
    // nahodne iteruji vsemi n*n neurony
    const combinations = [];
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        combinations.push([i, j]);
      }
    }
    HopfieldNet.shuffleArray(combinations);
    combinations.forEach(([x, i]) => {
      this.updateNeuronPotential(x, i);
      this.neurons[x][i].updateOutput();
    });
  }

  private setupNeurons(): void {
    // 0.5 * (1 + tanh(alpha * x)) odpovida tvarem sigmoide, bez parametru alpha by to slo limitne k 0/1 okolo bodu -3/3
    // pri jejich doporucenem nastaveni alpha = 50 je to ovsem brutalne strme a pripomina to skokovou funkci
    // a prakticky cokoliv >= 0.05 = 1 a cokoliv <= -0.05 = 0

    // ukol je rozmistit nahodne potencialy tak, aby vystupy daly dohromady cca n
    // a mozna by bylo dobre je rozmistit tak, aby dokonce reprezentovaly realnou trasu
    // lepsi by bylo to rozmistit doopravdy nahodne, ale muzu se uchylit i k jednoduchemu reseni a tj
    // na hlavni diagonalu dat 1ky a mimo ni 0
    // v cislech potencialu je to na diagonale dejme tomu random(0.05, 1) a mimo ni random(-1, -0.05) at tam nejsou velke vykyvy
    // const ABS_MIN = 0.05;
    // const ABS_MAX = 1.0;
    for (let x = 0; x < this.n; x++) {
      for (let i = 0; i < this.n; i++) {
        const potential = HopfieldNet.randomDoubleInRange(-1.5, 1.5);
        // const potential = (x === i) ? HopfieldNet.randomDoubleInRange(ABS_MIN, ABS_MAX) : HopfieldNet.randomDoubleInRange(-ABS_MAX, -ABS_MIN);
        this.neurons[x][i] = new Neuron(this.alpha, x, i, potential);
        this.neurons[x][i].updateOutput();
      }
    }
    // uvidime
  }

  private populateDistances(cities: City[]): void {
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        this.distances[i][j] = HopfieldNet.calculateDistance(cities[i], cities[j]);
      }
    }
  }

  private updateNeuronPotential(x: number, i: number): void {
    // ta dlouha zavorka
    const old = this.neurons[x][i].potential;
    let par = -old;
    par += - this.A * this.getCityConstraintSum(x, i);
    par += - this.B * this.getTimeConstraintSum(x, i);
    par += - this.C * this.getTotalOutputSum();
    par += - this.D * this.getDistanceConstraintSum(x, i);
    const value = old + this.dt * par;
    this.neurons[x][i].setPotential(value);
  }

  private getCityConstraintSum(x: number, i: number): number {
    // pocita aktivace neuronu odpovidajici stejnemu mestu v ruznem case jinem nez i
    let sum = 0;
    for (let j = 0; j < this.n; j++) {
      if (j === i) {
        continue;
      }
      sum += this.neurons[x][j].output;
    }
    return sum;
  }

  private getTimeConstraintSum(x: number, i: number): number {
    // pocita aktivace neuronu odpovidajici ruznym mestum jinym nez x v stejnem case i
    let sum = 0;
    for (let y = 0; y < this.n; y++) {
      if (y === x) {
        continue;
      }
      sum += this.neurons[y][i].output;
    }
    return sum;
  }

  private getTotalOutputSum(): number {
    let sum = 0;
    for (let x = 0; x < this.n; x++) {
      for (let i = 0; i < this.n; i++) {
        sum += this.neurons[x][i].output;
      }
    }
    return this.n - sum;
  }

  private getDistanceConstraintSum(x: number, i: number): number {
    let sum = 0;
    const maxI = Math.min(i + 1, this.n - 1);
    const minI = Math.max(i - 1, 0);
    for (let y = 0; y < this.n; y++) {
      if (y === x) {
        continue;
      }
      sum += this.distances[x][y] * (this.neurons[y][maxI].output + this.neurons[y][minI].output);
    }
    return sum;
  }

  private static stringifyNeurons(neurons: Neuron[][]): string {
    const rows = neurons.map(row => `[${row.map(neuron => neuron.output.toFixed(4)).join(', ')}]`);
    return `[${rows.join('\n')}]`;
  }

  private static shuffleArray(a: number[][]): void {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
  }

  private static randomDoubleInRange(min: number, max: number): number {
    return min + (max - min) * Math.random();
  }

  private static calculateDistance(a: City, b: City): number {
    return Math.sqrt(Math.pow(b.x / 500 - a.x / 500, 2) + Math.pow(b.y / 500 - a.y / 500, 2));
  }
}

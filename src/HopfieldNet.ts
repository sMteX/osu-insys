import City from "./City";
import {ISettings} from "./HopfieldUI";

const DIAG_DIST = Math.sqrt(2 * 500 * 500);

export default class HopfieldNet {
  private readonly n: number;

  private readonly weights: number[][];
  private readonly activations: number[][];
  public readonly outputs: number[][];

  private readonly cityOutputs: number[];
  private readonly timeOutputs: number[];
  private totalOutput: number;

  private readonly distances: number[][];

  private readonly tourByCity: number[];
  public readonly tourByTime: number[];

  private readonly maxIterations: number;
  private readonly dt: number;
  private readonly alpha: number;
  private readonly tau: number;
  private readonly A: number;
  private readonly B: number;
  private readonly C: number;
  private readonly D: number;

  private isTourFound: boolean = false;

  constructor(cities: City[],
              settings: ISettings) {
    const {dt, alpha, A, B, C, D, maxIterations, tau} = settings;
    this.dt = dt;
    this.alpha = alpha;
    this.tau = tau;
    this.A = A;
    this.B = B;
    this.C = C;
    this.D = D;
    this.maxIterations = maxIterations;
    this.n = cities.length;

    this.weights = HopfieldNet.initializeSquareMatrix(this.n * this.n);
    this.activations = HopfieldNet.initializeSquareMatrix(this.n);
    this.outputs = HopfieldNet.initializeSquareMatrix(this.n);
    this.cityOutputs = HopfieldNet.initializeArray(this.n);
    this.timeOutputs = HopfieldNet.initializeArray(this.n);
    this.totalOutput = 0;

    this.distances = HopfieldNet.initializeSquareMatrix(this.n);

    this.tourByCity = HopfieldNet.initializeArray(this.n);
    this.tourByTime = HopfieldNet.initializeArray(this.n);

    this.populateDistances(cities);
    this.setupNeurons();
  }

  private get energy(): number {
    let t1 = 0.0;
    let t2 = 0.0;
    let t3 = 0.0;
    let t4 = 0.0;

    for (let i = 0; i < this.n; i++) {
      const p = (i === this.n - 1) ? 0 : i + 1;
      const q = (i === 0) ? this.n - 1: i - 1;
      for (let j = 0; j < this.n; j++) {
        t3 += this.outputs[i][j];
        for (let k = 0; k < this.n; k++) {
          if (k !== j) {
            t1 += this.outputs[i][j] * this.outputs[i][k];
            t2 += this.outputs[j][i] * this.outputs[k][i];
            t4 += this.distances[k][j] * this.outputs[k][i] * (this.outputs[j][p] + this.outputs[j][q]) / DIAG_DIST;
          }
        }
      }
    }
    return 0.5 * (this.A * t1 + this.B * t2 + this.C * Math.pow(t3 - this.n, 2) + this.D * t4);
  }

  private calculateActivations(): void {
    const totalConstraint = this.totalOutput - this.n;

    for (let x = 0; x < this.n; x++) {
      for (let i = 0; i < this.n; i++) {
        let distanceConstraint = 0.0;

        const jp = (i === this.n - 1) ? 0 : i + 1;
        const jm = (i === 0) ? this.n - 1 : i - 1;

        const cityConstraint = this.cityOutputs[x] - this.outputs[x][i];
        const timeConstraint = this.timeOutputs[i] - this.outputs[x][i];

        for (let y = 0; y < this.n; y++) {
          distanceConstraint += this.distances[x][y] * (this.outputs[y][jp] + this.outputs[y][jm]) / DIAG_DIST;
        }

        const delta = this.dt * (- this.activations[x][i] / this.tau
                      - this.A * cityConstraint
                      - this.B * timeConstraint
                      - this.C * totalConstraint
                      - this.D * distanceConstraint);
        this.activations[x][i] += delta;
      }
    }
  }

  public train(): void {
    let oldEnergy, newEnergy;
    const THRESHOLD = 0.0000001;

    oldEnergy = this.energy;

    let i = 0;

    do {
      this.calculateActivations();
      this.calculateOutputs();
      newEnergy = this.energy;

      if (oldEnergy - newEnergy < THRESHOLD) {
        break;
      }

      oldEnergy = newEnergy;
      i++;
    } while (i < this.maxIterations);

    this.findTour();
  }

  public train2(): { paths: number[], distance: number, k: number } {
    let oldEnergy, newEnergy;
    const THRESHOLD = 0.000001;
    const CONSECUTIVE_LOWS = 50;

    oldEnergy = this.energy;

    let i = 0;
    let minDist = Number.MAX_VALUE;
    let minPaths: number[] = [];
    let minK = 0;
    let thresholdsHit = 0;

    for (let k = 0; k < 1000; k++) {
      i = 0;
      this.setupNeurons();
      thresholdsHit = 0;
      do {
        this.calculateActivations();
        this.calculateOutputs();
        newEnergy = this.energy;

        if (oldEnergy - newEnergy < THRESHOLD) {
          thresholdsHit++;
        } else {
          thresholdsHit = 0;
        }

        if (thresholdsHit === CONSECUTIVE_LOWS) {
          break;
        }

        oldEnergy = newEnergy;
        i++;
      } while (i < this.maxIterations);
      this.findTour();
      const dist = this.totalDistance;
      if (dist < minDist) {
        minDist = dist;
        minPaths = [...this.tourByTime]; // tourByTime is number[], this should create copy
        minK = k;
      }
    }
    return { paths: minPaths, distance: minDist, k: minK };
  }

  private findTour(): void {
    // tag is an array of "checked neurons"
    const tag = HopfieldNet.initializeSquareMatrix(this.n);
    const max = {
      value: <number> -10.0,
      x: <number | null> null,
      i: <number | null> -1,
    };

    for (let x = 0; x < this.n; x++) {
      for (let i = 0; i < this.n; i++) {
        tag[x][i] = 0;
      }
    }

    // for each city
    for (let x = 0; x < this.n; x++) {
      // keep track of maximum output of neurons for that city
      max.value = -10.0;
      for (let i = 0; i < this.n; i++) {
        // first, iterate through the row, find maximum output in UNVISITED neurons
        for (let k = 0; k < this.n; k++) {
          if (this.outputs[x][k] >= max.value && tag[x][k] === 0) {
            max.value = this.outputs[x][k];
            max.x = x;
            max.i = k;
          }
        }
        // if the neuron is the maximum and is unvisited
        if (x === max.x && i === max.i && tag[x][i] === 0) {
          // mark the neuron as part of paths
          this.tourByCity[x] = i;
          this.tourByTime[i] = x;
          // tag all other neurons for the same city or time as visited (there can no longer be a maximum found)
          for (let k = 0; k < this.n; k++) {
            tag[x][k] = 1;
            tag[k][i] = 1;
          }
        }
      }
    }

    this.isTourFound = true;
  }

  public get totalDistance(): number {
    if (!this.isTourFound) {
      throw new Error("Tour wasn't found yet");
    }

    let totalDistance = 0.0;

    for (let i = 0; i < this.n; i++) {
      const k = this.tourByTime[i];
      const l = (i === this.n - 1) ? this.tourByTime[0] : this.tourByTime[i + 1];
      totalDistance += this.distances[k][l];
    }

    return totalDistance;
  }

  private setupNeurons(): void {
    this.calculateWeightMatrix();
    this.assignInputs();
    this.calculateOutputs();
  }

  private calculateWeightMatrix(): void {
    // calculate weight matrix
    // weight matrix is N^2 * N^2 (connects 2 neurons and each neuron is indexed by 2 variables too)
    // for indexes - first neuron = Uxi, second neuron = Uyj
    for (let x = 0; x < this.n; x++) {
      for (let i = 0; i < this.n; i++) {
        // encoding first neuron index
        const t1 = i + x * this.n;
        for (let y = 0; y < this.n; y++) {
          for (let j = 0; j < this.n; j++) {
            // encoding second neuron index
            const t2 = j + y * this.n;
            // j-1 and j+1 actually wrap around the neurons?
            const jp = (j === this.n - 1) ? 0 : j + 1;
            const jm = (j === 0) ? this.n - 1: j - 1;

            const Dxy = HopfieldNet.kroneckerDelta(x, y);
            const Dij = HopfieldNet.kroneckerDelta(i, j);
            const Dijp = HopfieldNet.kroneckerDelta(i, jp);
            const Dijm = HopfieldNet.kroneckerDelta(i, jm);

            // calculating weight between Uxi and Uyj
            this.weights[t1][t2] = -this.A * Dxy * (1 - Dij)
                                   -this.B * Dij * (1 - Dxy)
                                   -this.C
                                   -this.D * this.distances[x][y] * (Dijp + Dijm) / DIAG_DIST;
          }
        }
      }
    }
  }

  private assignInputs(): void {
    // initialize a random NxN matrix of values (-1, 0) ?
    const inputMatrix: number[][] = HopfieldNet.initializeSquareMatrix(this.n);
    for (let i = 0; i < this.n; i++) {
      inputMatrix[i] = [];
      for (let j = 0; j < this.n; j++) {
        inputMatrix[i][j] = Math.random(); // -1; 1
      }
    }
    // reset activations for all neurons
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        this.activations[i][j] = 0.0;
      }
    }

    // initialize activations - which is a weighted sum of all concerned weights into the single neuron it seems
    // first, iterate through "target" neurons (which we set the activation of)
    for (let x = 0; x < this.n; x++) {
      for (let i = 0; i < this.n; i++) {
        // coordinate transform
        const t1 = i + x * this.n;
        // for each target neuron, iterate through all neurons again (Hopfield net is fully connected)
        for (let y = 0; y < this.n; y++) {
          for (let j = 0; j < this.n; j++) {
            const t2 = j + y * this.n;
            // activation is sum of all weights going into the neuron multiplied by the input of target neuron
            this.activations[x][i] += this.weights[t1][t2] * inputMatrix[x][i];
          }
        }
      }
    }
  }

  private calculateOutputs(): void {
    this.totalOutput = 0.0;

    for (let x = 0; x < this.n; x++) {
      // cityOutputs[x] represents total sum of outputs for a city x
      this.cityOutputs[x] = 0.0;
      for (let i = 0; i < this.n; i++) {
        this.outputs[x][i] = (1.0 + Math.tanh(this.alpha * this.activations[x][i])) / 2.0;
        this.cityOutputs[x] += this.outputs[x][i];
      }
      // total output is just sum of all city outputs
      this.totalOutput += this.cityOutputs[x];
    }
    for (let i = 0; i < this.n; i++) {
      // orderOutputs[x] is sum of outputs for time/order x
      this.timeOutputs[i] = 0.0;
      for (let x = 0; x < this.n; x++) {
        this.timeOutputs[i] += this.outputs[x][i];
      }
    }
  }

  private populateDistances(cities: City[]): void {
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        this.distances[i][j] = HopfieldNet.calculateDistance(cities[i], cities[j]);
      }
    }
  }

  private static kroneckerDelta(x: number, y: number): number {
    return (x === y) ? 1 : 0;
  }

  private static calculateDistance(a: City, b: City) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  private static initializeArray(n: number): number[] {
    return Array.from({ length: n });
  }

  private static initializeSquareMatrix(n: number): number[][] {
    return HopfieldNet.initializeArray(n).map(_ => HopfieldNet.initializeArray(n));
  }

  private static stringifyNeurons(outputs: number[][]): string {
    const rows = outputs.map(row => `[${row.map(output => output.toFixed(4)).join(', ')}]`);
    return `[${rows.join('\n')}]`;
  }
}

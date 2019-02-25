import City from "./City";
import {ISettings} from "./HopfieldUI";

interface ISettings2 extends ISettings {
  tau: number;
}

export default class HopfieldNet2 {
  private readonly n: number;

  private readonly weights: number[][];
  private readonly activations: number[][];
  private readonly outputs: number[][];

  private readonly cityOutputs: number[];
  private readonly timeOutputs: number[];
  private totalOutput: number;

  private readonly distances: number[][];

  private readonly maxIterations: number;
  private readonly dt: number;
  private readonly alpha: number;
  private readonly tau: number;
  private readonly A: number;
  private readonly B: number;
  private readonly C: number;
  private readonly D: number;

  constructor(cities: City[],
              settings: ISettings2) {
    const initializeArray = (n: number): number[] => {
      return Array.from({ length: n });
    };
    const initializeSquareMatrix = (n: number): number[][] => {
      return initializeArray(n).map(_ => initializeArray(n));
    };

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

    this.weights = initializeSquareMatrix(this.n * this.n);
    this.activations = initializeSquareMatrix(this.n);
    this.outputs = initializeSquareMatrix(this.n);
    this.cityOutputs = initializeArray(this.n);
    this.timeOutputs = initializeArray(this.n);
    this.totalOutput = 0;

    this.distances = initializeSquareMatrix(this.n);

    this.populateDistances(cities);
    this.setupNeurons();
  }

  private get energy(): number {
    let t1 = 0.0;
    let t2 = 0.0;
    let t3 = 0.0;
    let t4 = 0.0;

    for (let i = 0; i < this.n; i++) {
      const p = (i == this.n - 1) ? 0 : i + 1;
      const q = (i == 0) ? this.n - 1: i - 1;
      for (let j = 0; j < this.n; j++) {
        t3 += this.outputs[i][j];
        for (let k = 0; k < this.n; k++) {
          if (k !== j) {
            t1 += this.outputs[i][j] * this.outputs[i][k];
            t2 += this.outputs[j][i] * this.outputs[k][i];
            t4 += this.distances[k][j] * this.outputs[k][i] * (this.outputs[j][p] + this.outputs[j][q]);
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

        const jp = (i == this.n - 1) ? 0 : i + 1;
        const jm = (i == 0) ? this.n - 1 : i - 1;

        const cityConstraint = this.cityOutputs[x] - this.outputs[x][i];
        const timeConstraint = this.timeOutputs[i] - this.outputs[x][i];

        for (let y = 0; y < this.n; y++) {
          distanceConstraint += this.distances[x][y] * (this.outputs[y][jp] + this.outputs[y][jm]);
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

            const Dxy = HopfieldNet2.kroneckerDelta(x, y);
            const Dij = HopfieldNet2.kroneckerDelta(i, j);
            const Dijp = HopfieldNet2.kroneckerDelta(i, jp);
            const Dijm = HopfieldNet2.kroneckerDelta(i, jm);

            // calculating weight between Uxi and Uyj
            this.weights[t1][t2] = -this.A * Dxy * (1 - Dij)
                                   -this.B * Dij * (1 - Dxy)
                                   -this.C
                                   -this.D * this.distances[x][y] * (Dijp + Dijm);
          }
        }
      }
    }
  }

  private assignInputs(): void {
    // initialize a random NxN matrix of values (-1, 0) ?
    const inputMatrix: number[][] = [];
    for (let i = 0; i < this.n; i++) {
      inputMatrix[i] = [];
      for (let j = 0; j < this.n; j++) {
        inputMatrix[i][j] = Math.random() - 1;
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
        HopfieldNet2.calculateDistance(cities[i], cities[j], 500);
      }
    }
  }

  private static kroneckerDelta(x: number, y: number): number {
    return (x === y) ? 1 : 0;
  }

  private static calculateDistance(a: City, b: City, divider: number) {
    return Math.sqrt(Math.pow((a.x - b.x) / divider, 2) + Math.pow((a.y - b.y) / divider, 2));
  }
}

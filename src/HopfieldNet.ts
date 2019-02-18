import { performance } from 'perf_hooks';
import City from './City';
import Neuron from './Neuron';

export default class HopfieldNet {
    private readonly n: number;
    private readonly neurons: Neuron[][];
    private distances: number[][];

    private readonly maxIter: number;
    private readonly dt: number;
    private readonly alpha: number;
    private readonly A: number;
    private readonly B: number;
    private readonly C: number;
    private readonly D: number;

    constructor(cities: City[],
                dt: number,
                alpha: number,
                A: number,
                B: number,
                C: number,
                D: number,
                maxIter: number) {
        this.dt = dt;
        this.alpha = alpha;
        this.A = A;
        this.B = B;
        this.C = C;
        this.D = D;
        this.maxIter = maxIter;
        this.n = cities.length;
        this.neurons = Array.from({ length: this.n }).map(_ => Array.from({ length: this.n }));
        this.distances = Array.from({ length: this.n }).map(_ => Array.from({ length: this.n }));

        this.populateDistances(cities);
        this.populatePotentials();
        this.populateOutputs();
    }

    public train(): void {
        let iteration = 0;
        const magicCondition = true;
        const start = performance.now();

        let minE = Number.MAX_VALUE;
        let minIt = 0;
        let minNeurons = null;

        while (iteration < this.maxIter && magicCondition) {
            this.iterate();
            const t = performance.now() - start;
            const e = this.E;
            if (e < minE) {
                minE = e;
                minIt = iteration;
                minNeurons = [...this.neurons];
            }
            console.log(`Iteration ${iteration} (${t} ms): E = ${e}`);
            iteration++;
        }
        console.log(`Best iteration: ${minIt}, error: ${minE}`);
        console.log(`Best neurons: ${this.stringifyNeurons(minNeurons)}`);
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
        return (this.A / 2) * Apart + (this.B / 2) * Bpart + (this.C / 2) * Math.pow(this.n - Cpart, 2) + (this.D / 2) * Dpart;
    }

    public toString(): string {
        return this.stringifyNeurons(this.neurons);
    }

    private stringifyNeurons(neurons: Neuron[][]): string {
        StringBuilder sb = new StringBuilder("[");
        DecimalFormat df = new DecimalFormat("0.000");
        for (int x = 0; x < n; x++) {
            sb.append("[");
            for (int i = 0; i < n; i++) {
                sb.append(df.format(neurons[x][i].getOutput()) + ", ");
            }
            sb.append("]\n");
        }
        sb.append("]");
        return sb.toString();
    }

private void iterate() {
    // nahodne iteruji vsemi n*n neurony
    ArrayList<SimpleEntry<Integer, Integer>> neurons = getIndexPairs();
    Collections.shuffle(neurons);
    neurons.forEach(neuron -> {
        updateNeuronPotential(neuron.getKey(), neuron.getValue());
        this.neurons[neuron.getKey()][neuron.getValue()].updateOutput();
    });
}

private ArrayList<SimpleEntry<Integer, Integer>> getIndexPairs() {
    ArrayList<SimpleEntry<Integer, Integer>> indexes = new ArrayList<>();
    for (int x = 0; x < n; x++) {
        for (int i = 0; i < n; i++) {
            indexes.add(new SimpleEntry<>(x, i));
        }
    }
    return indexes;
}

private void populatePotentials() {
    // 0.5 * (1 + tanh(alpha * x)) odpovida tvarem sigmoide, bez parametru alpha by to slo limitne k 0/1 okolo bodu -3/3
    // pri jejich doporucenem nastaveni alpha = 50 je to ovsem brutalne strme a pripomina to skokovou funkci
    // a prakticky cokoliv >= 0.05 = 1 a cokoliv <= -0.05 = 0

    // ukol je rozmistit nahodne potencialy tak, aby vystupy daly dohromady cca n
    // a mozna by bylo dobre je rozmistit tak, aby dokonce reprezentovaly realnou trasu
    // lepsi by bylo to rozmistit doopravdy nahodne, ale muzu se uchylit i k jednoduchemu reseni a tj
    // na hlavni diagonalu dat 1ky a mimo ni 0
    // v cislech potencialu je to na diagonale dejme tomu random(0.05, 1) a mimo ni random(-1, -0.05) at tam nejsou velke vykyvy
    double ABS_MIN = 0.05;
    double ABS_MAX = 1.0;
    for (int x = 0; x < n; x++) {
        for (int i = 0; i < n; i++) {
//                double potential = randomDoubleInRange(-ABS_MAX, ABS_MAX);
            double potential = (x == i) ? randomDoubleInRange(ABS_MIN, ABS_MAX) : randomDoubleInRange(-ABS_MAX, -ABS_MIN);
            neurons[x][i] = new Neuron(x, i, potential);
        }
    }
    // uvidime
}

private double randomDoubleInRange(double min, double max) {
    return min + (max - min) * r.nextDouble();
}

private void populateOutputs() {
    for (int x = 0; x < n; x++) {
        for (int i = 0; i < n; i++) {
            neurons[x][i].updateOutput();
        }
    }
}

private void populateDistances(ArrayList<City> cities) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            distances[i][j] = calculateDistance(cities.get(i), cities.get(j));
        }
    }
}

private void updateNeuronPotential(int x, int i) {
    // ta dlouha zavorka
    double old = neurons[x][i].getPotential();
    double par = -old
        - A * getCityConstraintSum(x, i)
        - B * getTimeConstraintSum(x, i)
        + C * getTotalOutputSum()
        - D * getDistanceConstraintSum(x, i);
    double value = old + dt * par;
    neurons[x][i].setPotential(value);
}

private double getDistanceConstraintSum(int x, int i) {
    double sum = 0;
    int maxI = Math.min(i + 1, n - 1);
    int minI = Math.max(i - 1, 0);
    for (int y = 0; y < n; y++) {
        if (y == x) {
            continue;
        }
        sum += distances[x][y] * (neurons[y][maxI].getOutput() + neurons[y][minI].getOutput());
    }
    return sum;
}

private double getTotalOutputSum() {
    double sum = 0;
    for (int x = 0; x < n; x++) {
        for (int i = 0; i < n; i++) {
            sum += neurons[x][i].getOutput();
        }
    }
    return n - sum;
}

private double getTimeConstraintSum(int x, int i) {
    // pocita aktivace neuronu odpovidajici ruznym mestum jinym nez x v stejnem case i
    double sum = 0;
    for (int y = 0; y < n; y++) {
        if (y == x) {
            continue;
        }
        sum += neurons[y][i].getOutput();
    }
    return sum;
}

private double getCityConstraintSum(int x, int i) {
    // pocita aktivace neuronu odpovidajici stejnemu mestu v ruznem case jinem nez i
    double sum = 0;
    for (int j = 0; j < n; j++) {
        if (j == i) {
            continue;
        }
        sum += neurons[x][j].getOutput();
    }
    return sum;
}

private double calculateDistance(City a, City b) {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}
}
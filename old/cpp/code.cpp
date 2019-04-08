#include "code.h"
// https://books.google.cz/books?id=Zz27CgAAQBAJ&pg=PA167&lpg=PA167#v=onepage&q&f=false
// original, in case I really did make a mistake

// returns random number between 1 and max (exclusive)
int randomNumber(int max) {
    return rand() % max;
}

// returns Kronecker's delta function for i and j
int kroneckerDelta(int i, int j) {
    if (i == j) {
        return 1;
    }
    return 0;
}

// calculate distance between 2 points
int calculateDistance(int x1, int x2, int y1, int y2) {
    int dx, dy, d;

    dx = x1 - x2;
    dy = y1 - y2;
    d = (int) sqrt(dx * dx + dy * dy);

    return d;
}

// initialize neuron variables
int Neuron::initializeNeuron(int i, int j) {
    this->city = i;
    this->order = j;
    this->output = 0.0;
    this->activation = 0.0;
}

// initialize distances between cities
void HP_network::initializeDistances() {
    int i, j;
    int rows = this->cityCount;
    int cols = 2;
    int **coordinates;
    int **row;

    // allocate coordinates - cityCount x 2
    coordinates = (int**) malloc((rows + 1) * sizeof(int*));
    for (i = 0; i < rows; i++) {
        coordinates[i] = (int*) malloc(cols * sizeof(int));
    }
    coordinates[rows] = 0; // ?

    srand(this->cityCount);

    // generate random coordinates
    for (i = 0; i < rows; ++i) {
        coordinates[i][0] = rand() % 100;
        coordinates[i][1] = rand() % 100;
    }

    for (i = 0; i < this->cityCount; ++i) {
        // diagonal
        this->distances[i][i] = 0;
        // distances above diagonal
        for (j = i + 1; j < this->cityCount; ++j) {
            this->distances[i][j] = calculateDistance(coordinates[i][0], coordinates[j][0], coordinates[i][1], coordinates[j][1]) / 1;
        }
    }

    // iterate again, distances are symmetrical, copy from top part (I doubt the difference is significant though)
    for (i = 0; i < this->cityCount; ++i) {
        this->distances[i][i] = 0;  // redundant, doesn't hurt though
        for (j = 0; j < i; ++j) {
            this->distances[i][j] = distances[j][i];
        }
    }

    // tehcnically deallocation of coordinates but hey
}

// Initialize network with parameters and compute weight matrix
void HP_network::initializeNetwork(int numberOfCities, float a, float b, float c, float d, float dt, float tau, float alpha) {
    int x, i, y, j;
    int t1, t2;
    int jp, jm, Dxy, Dij, Dijm, Dijp;

    // set internal network parameters
    this->cityCount = numberOfCities;
    this->a = a;
    this->b = b;
    this->c = c;
    this->d = d;
    this->dt = dt;
    this->tau = tau;
    this->alpha = alpha;

    this->initializeDistances();

    // useless neuron initialization, since he directly uses activations and outputs anyway
    for (i = 0; i < this->cityCount; ++i) {
        for (j = 0; j < this->cityCount; ++j) {
            this->neurons[i][j].initializeNeuron(i, j);
        }
    }

    // calculate weight matrix
    // weight matrix is N^2 * N^2 (connects 2 neurons and each neuron is indexed by 2 variables too)
    // for indexes - first neuron = Uxi, second neuron = Uyj
    for (x = 0; x < this->cityCount; ++x) {
        for (i = 0; i < this->cityCount; ++i) {
            // encoding first neuron index
            t1 = i + x * this->cityCount;
            for (y = 0; y < this->cityCount; ++y) {
                for (j = 0; j < this->cityCount; ++j) {
                    // encoding second neuron index
                    t2 = j + y * this->cityCount;
                    // j-1 and j+1 actually wrap around the neurons?
                    jp = (j == this->cityCount - 1) ? 0 : j + 1;
                    jm = (j == 0) ? this->cityCount - 1; j - 1;

                    Dxy = kroneckerDelta(x, y);
                    Dij = kroneckerDelta(i, j);
                    Dijp = kroneckerDelta(i, jp);
                    Dijm = kroneckerDelta(i, jm);

                    // calculating weight between Uxi and Uyj
                    this->weight[t1][t2] = -this->a * Dxy * (1 - Dij)
                                     -this->b * Dij * (1 - Dxy)
                                     -this->c
                                     -this->d * this->distances[x][y] * (Dijp + Dijm) / 100;
                     // no clue why he divides the distance, but since the distance (or coordinates) are from 0 - 99 range
                     // maybe to get them to 0 - 1 range
                }
            }
        }
    }
}

/*===================== Assign initial inputs to the network ===================*/
void HP_network::assignInputs(float *inputVector) {
    // inputVector seems to be a vector of random numbers (0;99)/100.0 - 1 = (0;0.99) - 1 = (-1; 0)
    int x, i, y, j, t1, t2;

    // reset activations for all neurons
    for (i = 0; i < this->cityCount; ++i) {
        for (j = 0; j < this->cityCount; ++j) {
            this->activations[i][j] = 0.0;
        }
    }

    // initialize activations - which is a weighted sum of all concerned weights into the single neuron it seems
    // first, iterate through "target" neurons (which we set the activation of)
    for (x = 0; x < this->cityCount; ++x) {
        for (i = 0; i < this->cityCount; ++i) {
            // coordinate transform
            t1 = i + x * this->cityCount;
            // for each target neuron, iterate through all neurons again (Hopfield net is fully connected)
            for (y = 0; y < this->cityCount; ++y) {
                for (j = 0; j < this->cityCount; ++j) {
                    t2 = j + y * this->cityCount;
                    // activation is sum of all weights going into the neuron multiplied by the input of target neuron
                    this->activations[x][i] += this->weight[t1][t2] * inputVector[t1];
                }
            }
        }
    }
}

/* ======== Compute the activation function outputs ======================*/
void HP_network::calculateActivations() {
    int x, i, y, jp, jm;
    float cityConstraint, timeConstraint, totalConstraint, distanceConstraint, delta;
    totalConstraint = this->totalOutput - this->cityCount;

    for (x = 0; x < this->cityCount; ++x) {
        for (i = 0; i < this->cityCount; ++i) {
            distanceConstraint = 0.0;
            jp = (i == this->cityCount - 1) ? 0 : i + 1;
            jm = (i == 0) ? this->cityCount - 1; i - 1;
            cityConstraint = this->cityOutputs[x] - this->outputs[x][i];
            timeConstraint = this->orderOutputs[i] - this->outputs[x][i];
            for (y = 0; y < this->cityCount; ++y) {
                distanceConstraint += this->distances[x][y] * (this->outputs[y][jp] + this->outputs[y][jm]) / 100;
            }
            delta = this->dt * (- this->activations[x][i] / this->tau
                             - this->a * cityConstraint
                             - this->b * timeConstraint
                             - this->c * totalConstraint
                             - this->d * distanceConstraint);
            this->activations[x][i] += delta;
        }
    }
}

/*========== Get Neural Network Output =============================*/
void HP_network::calculateOutputs() {
    double arg, ex, emx;
    int x, i;
    this->totalOutput = 0.0;

    for (x = 0; x < this->cityCount; ++x) {
        // cityOutputs[x] represents total sum of outputs for a city x
        this->cityOutputs[x] = 0.0;
        for (i = 0; i < this->cityCount; ++i) {
            // (e^x - e^-x)/(e^x + e^-x) is just a different formula of tanh(x) so it checks out
            arg = this->alpha * this->activations[x][i];
            ex = exp(arg);
            emx = exp(-arg);
            this->outputs[x][i] = (float)(1.0 + (ex - emx)/(ex + emx)) / 2.0;
            this->cityOutputs[x] += this->outputs[x][i];
        }
        // total output is just sum of all city outputs
        this->totalOutput += this->cityOutputs[x];
    }
    for (i = 0; i < this->cityCount; ++i) {
        // orderOutputs[x] is sum of outputs for time/order x
        this->orderOutputs[i] = 0.0;
        for (x = 0; x < this->cityCount; ++x) {
            this->orderOutputs[i] += this->outputs[x][i];
        }
    }
}

/* ========= Compute the Energy function =========*/
float HP_network::getEnergy() {
    int i, j, k, p, q;
    float t1, t2, t3, t4, e;

    t1 = 0.0;
    t2 = 0.0;
    t3 = 0.0;
    t4 = 0.0;

    for (i = 0; i < this->cityCount; ++i) {
        p = (i == this->cityCount - 1) ? 0 : i + 1;
        q = (i == 0) ? this->cityCount - 1: i - 1;
        for (j = 0; j < this->cityCount; ++j) {
            t3 += this->outputs[i][j];
            for (k = 0; k < this->cityCount; ++k) {
                if (k != j) {
                    t1 += this->outputs[i][j] * this->outputs[i][k];
                    t2 += this->outputs[j][i] * this->outputs[k][i];
                    t4 += this->distances[k][j] * this->outputs[k][i] * (this->outputs[j][p] + this->outputs[j][q]) / 10;
                }
            }
        }
    }
    t3 = t3 - this->cityCount;
    t3 = t3 * t3;
    e = 0.5 * (this->a * t1 + this->b * t2 + this->c * t3 + this->d * t4);
    return e;
}

/*========== Find a valid tour ==========*/
void HP_network::findTour() {
    // tag is an array of "checked neurons"
    int x, i, k, tag[MAX_SIZE][MAX_SIZE];
    float maxForCity;
    for (x = 0; x < this->cityCount; ++x) {
        for (i = 0; i < this->cityCount; ++i) {
            this->tag[x][i] = 0;
        }
    }

    // for each city
    for (x = 0; x < this->cityCount; ++x) {
        // keep track of maximum output of neurons for that city
        maxForCity = -10.0;
        for (i = 0; i < this->cityCount; ++i) {
            // first, iterate through the row, find maximum output in UNVISITED neurons
            for (k = 0; k < this->cityCount; ++k) {
                if (this->outputs[x][k] >= maxForCity && tag[x][k] == 0) {
                    maxForCity = this->outputs[x][k];
                }
            }
            // if the neuron is the maximum and is unvisited
            if (this->outputs[x][i] == maxForCity && tag[x][i] == 0) {
                // mark the neuron as part of paths
                this->tourByCity[x] = i;
                this->tourByOrder[i] = x;
                // tag all other neurons for the same city or time as visited (there can no longer be a maximum found)
                for (k = 0; k < this->cityCount; ++k) {
                    tag[x][k] = 1;
                    tag[k][i] = 1;
                }
            }
        }
    }
}

/*=========== Calculate total distance for tour ========= */
void HP_network::calculateTotalDistance() {
    int i, k, l;
    this->totalDistance = 0.0;

    for (i = 0; i < this->cityCount; ++i) {
        k = this->tourByOrder[i];
        l = (i == this->cityCount - 1) ? this->tourByOrder[0] : this->tourByOrder[i + 1];
        this->totalDistance += this->distances[k][l];
    }
}

/* ============== Iterate the network specified number of times =========*/
void HP_network::iterate(int maxIterations) {
    int k;
    double oldEnergy, newEnergy;
    double THRESHOLD = 0.0000001;

    oldEnergy = this->getEnergy();
    k = 0;

    do {
        this->calculateActivations();
        this->calculateOutputs();
        newEnergy = this->getEnergy();

        if (oldEnergy - newEnergy < THRESHOLD) {
            break;
        }

        oldEnergy = newEnergy;
        k++;
    } while (k < maxIterations);
}

void main() {
    float a = 0.5;
    float b = 0.5;
    float c = 0.2;
    float d = 0.5;
    float dt = 0.01;
    float tau = 1;
    float alpha = 3.0;
    float i, n2;
    int maxIterations = 4000;
    int cityCount = 15;
    float inputVector[MAX_SIZE * MAX_SIZE];
    double dif;

    n2 = cityCount * cityCount;
    for (i = 0; i < n2; ++i) {
        inputVector[i] = (float)(randomNumber(100)/100.0) - 1;
    }

    // create HP_network and operate

    HP_network *network = new HP_network;

    network->initializeNetwork(cityCount, a, b, c, d, dt, tau, alpha);
    network->assignInputs(inputVector);
    network->calculateOutputs();
    network->iterate(maxIterations);
    network->findTour();
    network->calculateTotalDistance();
}

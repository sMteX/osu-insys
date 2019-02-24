#include "code.h"

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

int calculateDistance(int x1, int x2, int y1, int y2) {
    int dx, dy, d;

    dx = x1 - x2;
    dy = y1 - y2;
    d = (int) sqrt(dx * dx + dy * dy);

    return d;
}

int Neuron::initializeNeuron(int i, int j) {
    this->city = i;
    this->order = j;
    this->output = 0.0;
    this->activation = 0.0;
}

void HP_network::initializeDistances() {
    int i, j;
    int rows = this->cityCount;
    int cols = 2;
    int **ordinate;
    int **row;

    ordinate = (int**) malloc((rows + 1) * sizeof(int*));
    for (i = 0; i < rows; i++) {
        ordinate[i] = (int*) malloc(cols * sizeof(int));
    }
    ordinate[rows] = 0;

    srand(this->cityCount);

    for (i = 0; i < rows; ++i) {
        ordinate[i][0] = rand() % 100;
        ordinate[i][1] = rand() % 100;
    }

    for (i = 0; i < this->cityCount; ++i) {
        this->distances[i][i] = 0;
        for (j = i + 1; j < this->cityCount; ++j) {
            this->distances[i][j] = calculateDistance(ordinate[i][0], ordinate[j][0], ordinate[i][1], ordinate[j][1]) / 1;
        }
    }

    for (i = 0; i < this->cityCount; ++i) {
        this->distances[i][i] = 0;
        for (j = 0; j < i; ++j) {
            this->distances[i][j] = distances[j][i];
        }
    }
}

// Initialize network with parameters and compute weight matrix
void HP_network::initializeNetwork(int numberOfCities, float a, float b, float c, float d, float dt, float tau, float lambda) {
    int i, j, k, l, t1, t2, t3, t4, t5, t6;
    int p, q;

    this->cityCount = numberOfCities;
    this->a = a;
    this->b = b;
    this->c = c;
    this->d = d;
    this->dt = dt;
    this->tau = tau;
    this->lambda = lambda;

    this->initializeDistances();

    for (i = 0; i < this->cityCount; ++i) {
        for (j = 0; j < this->cityCount; ++j) {
            this->neurons[i][j].initializeNeuron(i, j);
        }
    }

    for (i = 0; i < this->cityCount; ++i) {
        for (j = 0; j < this->cityCount; ++j) {
            p = (j == this->cityCount - 1) ? 0 : j + 1;
            q = (j == 0) ? this->cityCount - 1; j - 1;
            t1 = j + i * this->cityCount;
            for (k = 0; k < this->cityCount; ++k) {
                for (l = 0; l < this->cityCount; ++l) {
                    t2 = l + k * this->cityCount;
                    t3 = kroneckerDelta(i, k);
                    t4 = kroneckerDelta(j, l);
                    t5 = kroneckerDelta(l, p);
                    t6 = kroneckerDelta(l, q);
                    this->weight[t1][t2] = -this->a * t3 * (1 - t4)
                                     -this->b * t4 * (1 - t3)
                                     -this->c
                                     -this->d * this->distances[i][k] * (t5 + t6) / 100;
                }
            }
        }
    }
}

/*===================== Assign initial inputs to the network ===================*/
void HP_network::assignInputs(float *inputVector) {
    int i, j, k, l, t1, t2;

    for (i = 0; i < this->cityCount; ++i) {
        for (j = 0; j < this->cityCount; ++j) {
            this->activations[i][j] = 0.0;
        }
    }

    // find initial activations
    for (i = 0; i < this->cityCount; ++i) {
        for (j = 0; j < this->cityCount; ++j) {
            t1 = j + i * this->cityCount;
            for (k = 0; k < this->cityCount; ++k) {
                for (l = 0; l < this->cityCount; ++l) {
                    t2 = l + k * this->cityCount;
                    this->activations[i][j] += this->weight[t1][t2] * inputVector[t1];
                }
            }
        }
    }
}

/* ======== Compute the activation function outputs ======================*/
void HP_network::calculateActivations(int nprm) {
    int i, j, k, p, q;
    float r1, r2, r3, r4, r5;
    r3 = this->totalOutput - nprm;

    for (i = 0; i < this->cityCount; ++i) {
        r4 = 0.0;
        p = (i == this->cityCount - 1) ? 0 : i + 1;
        q = (i == 0) ? this->cityCount - 1; i - 1;
        for (j = 0; j < this->cityCount; ++j) {
            r1 = this->cityOutputs[i] - this->outputs[i][j];
            r2 = this->orderOutputs[j] - this->outputs[i][j];
            for (k = 0; k < this->cityCount; ++k) {
                r4 += this->distances[i][k] * (this->outputs[k][p] + this->outputs[k][q]) / 100;
            }
            r5 = this->dt * (-this->activations[i][j] / this->tau - this->a * r1 - this->b * r2 - this->c * r3 - this->d * r4);
            this->activations[i][j] += r5;
        }
    }
}

/*========== Get Neural Network Output =============================*/
void HP_network::calculateOutputs() {
    double b1, b2, b3, b4;
    int i, j;
    this->totalOutput = 0.0;

    for (i = 0; i < this->cityCount; ++i) {
        this->cityOutputs[i] = 0.0;
        for (j = 0; j < this->cityCount; ++j) {
            b1 = this->lambda * this->activations[i][j];
            b4 = b1;
            b2 = exp(b4);
            b3 = exp(-b4);
            this->outputs[i][j] = (float)(1.0 + (b2 - b3)/(b2 + b3)) / 2.0;
            this->cityOutputs[i] += this->outputs[i][j];
        }
        this->totalOutput += this->cityOutputs[i];
    }
    for (j = 0; j < this->cityCount; ++j) {
        this->orderOutputs[j] = 0.0;
        for (i = 0; i < this->cityCount; ++i) {
            this->orderOutputs[j] += this->outputs[i][j];
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
    int i, j, k, tag[MAX_SIZE][MAX_SIZE];
    float tmp;
    for (i = 0; i < this->cityCount; ++i) {
        for (j = 0; j < this->cityCount; ++j) {
            this->tag[i][j] = 0;
        }
    }

    for (i = 0; i < this->cityCount; ++i) {
        tmp = -10.0;
        for (j = 0; j < this->cityCount; ++j) {
            for (k = 0; k < this->cityCount; ++k) {
                if (this->outputs[i][k] >= tmp && tag[i][k] == 0) {
                    tmp = this->outputs[i][k];
                }
            }
            if (this->outputs[i][j] == tmp && tag[i][j] == 0) {
                this->tourByCity[i] = j;
                this->tourByOrder[j] = i;
                for (k = 0; k < this->cityCount; ++k) {
                    tag[i][k] = 1;
                    tag[k][j] = 1;
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
void HP_network::iterate(int maxIterations, int nprm) {
    int k;
    double oldEnergy, newEnergy;
    oldEnergy = this->getEnergy();
    k = 0;

    do {
        this->calculateActivations(nprm);
        this->calculateOutputs();
        newEnergy = this->getEnergy();

        if (oldEnergy - newEnergy < 0.0000001) {
            break;
        }

        oldEnergy = newEnergy;
        k++;
    } while (k < maxIterations);
}

void main() {
    int nprm = 15;
    float a = 0.5;
    float b = 0.5;
    float c = 0.2;
    float d = 0.5;
    float dt = 0.01;
    float tau = 1;
    float lambda = 3.0;
    float i, n2;
    int numit = 4000;
    int cityCount = 15;
    float input_vector[MAX_SIZE * MAX_SIZE];
    double dif;

    n2 = cityCount * cityCount;
    for (i = 0; i < n2; ++i) {
        input_vector[i] = (float)(randomNumber(100)/100.0) - 1;
    }

    // create HP_network and operate

    HP_network *TSP_NW = new HP_network;

    TSP_NW->initializeNetwork(cityCount, a, b, c, d, dt, tau, lambda);
    TSP_NW->assignInputs(input_vector);
    TSP_NW->calculateOutputs();
    TSP_NW->iterate(numit, nprm);
    TSP_NW->findTour();
    TSP_NW->calculateTotalDistance();
}

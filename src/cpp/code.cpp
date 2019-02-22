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
    city = i;
    order = j;
    output = 0.0;
    activation = 0.0;
}

void HP_network::initializeDistances(int numberOfCities) {
    int i, j;
    int rows = numberOfCities;
    int cols = 2;
    int **ordinate;
    int **row;

    ordinate = (int**) malloc((rows + 1) * sizeof(int*));
    for (i = 0; i < rows; i++) {
        ordinate[i] = (int*) malloc(cols * sizeof(int));
    }
    ordinate[rows] = 0;

    srand(numberOfCities);

    for (i = 0; i < rows; ++i) {
        ordinate[i][0] = rand() % 100;
        ordinate[i][1] = rand() % 100;
    }

    for (i = 0; i < numberOfCities; ++i) {
        dist[i][i] = 0;
        for (j = i + 1; j < numberOfCities; ++j) {
            dist[i][j] = calculateDistance(ordinate[i][0], ordinate[j][0], ordinate[i][1], ordinate[j][1]) / 1;
        }
    }

    for (i = 0; i < numberOfCities; ++i) {
        dist[i][i] = 0;
        for (j = 0; j < i; ++j) {
            dist[i][j] = dist[j][i];
        }
    }
}

// Initialize network with parameters and compute weight matrix
void HP_network::initializeNetwork(int numberOfCities, float _a, float _b, float _c, float _d) {
    int i, j, k, l, t1, t2, t3, t4, t5, t6;
    int p, q;
    cityCount = numberOfCities;
    a = _a;
    b = _b;
    c = _c;
    d = _d;
    initializeDistances(cityCount);

    for (i = 0; i < cityCount; ++i) {
        for (j = 0; j < cityCount; ++j) {
            neurons[i][j].initializeNeuron(i, j);
        }
    }

    for (i = 0; i < cityCount; ++i) {
        for (j = 0; j < cityCount; ++j) {
            p = (j == cityCount - 1) ? 0 : j + 1;
            q = (j == 0) ? cityCount - 1; j - 1;
            t1 = j + i * cityCount;
            for (k = 0; k < cityCount; ++k) {
                for (l = 0; l < cityCount; ++l) {
                    t2 = l + k * cityCount;
                    t3 = kroneckerDelta(i, k);
                    t4 = kroneckerDelta(j, l);
                    t5 = kroneckerDelta(l, p);
                    t6 = kroneckerDelta(l, q);
                    weight[t1][t2] = -a * t3 * (1 - t4)
                                     -b * t4 * (1 - t3)
                                     -c
                                     -d * dist[i][k] * (t5 + t6) / 100;
                }
            }
        }
    }
}

/*===================== Assign initial inputs to the network ===================*/
void HP_network::assignInputs(float *inputVector) {
    int i, j, k, l, t1, t2;

    for (i = 0; i < cityCount; ++i) {
        for (j = 0; j < cityCount; ++j) {
            acts[i][j] = 0.0;
        }
    }

    // find initial activations
    for (i = 0; i < cityCount; ++i) {
        for (j = 0; j < cityCount; ++j) {
            t1 = j + i * cityCount;
            for (k = 0; k < cityCount; ++k) {
                for (l = 0; l < cityCount; ++l) {
                    t2 = l + k * cityCount;
                    acts[i][j] += weight[t1][t2] * inputVector[t1];
                }
            }
        }
    }
}

/* ======== Compute the activation function outputs ======================*/
void HP_network::calculateActivations(int nprm, float dt, float tau) {
    int i, j, k, p, q;
    float r1, r2, r3, r4, r5;
    r3 = totalOutput - nprm;

    for (i = 0; i < cityCount; ++i) {
        r4 = 0.0;
        p = (i == cityCount - 1) ? 0 : i + 1;
        q = (i == 0) ? cityCount - 1; i - 1;
        for (j = 0; j < cityCount; ++j) {
            r1 = citouts[i] - outs[i][j];
            r2 = ordouts[j] - outs[i][j];
            for (k = 0; k < cityCount; ++k) {
                r4 += dist[i][k] * (outs[k][p] + outs[k][q]) / 100;
            }
            r5 = dt * (-acts[i][j] / tau - a * r1 - b * r2 - c * r3 - d * r4);
            acts[i][j] += r5;
        }
    }
}

/*========== Get Neural Network Output =============================*/
void HP_network::calculateOutputs(float _lambda) {
    double b1, b2, b3, b4;
    int i, j;
    totalOutput = 0.0;

    for (i = 0; i < cityCount; ++i) {
        citouts[i] = 0.0;
        for (j = 0; j < cityCount; ++j) {
            b1 = _lambda * acts[i][j];
            b4 = b1;
            b2 = exp(b4);
            b3 = exp(-b4);
            outs[i][j] = (float)(1.0 + (b2 - b3)/(b2 + b3)) / 2.0;
            citouts[i] += outs[i][j];
        }
        totalOutput += citouts[i];
    }
    for (j = 0; j < cityCount; ++j) {
        ordouts[j] = 0.0;
        for (i = 0; i < cityCount; ++i) {
            ordouts[j] += outs[i][j];
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

    for (i = 0; i < cityCount; ++i) {
        p = (i == cityCount - 1) ? 0 : i + 1;
        q = (i == 0) ? cityCount - 1: i - 1;
        for (j = 0; j < cityCount; ++j) {
            t3 += outs[i][j];
            for (k = 0; k < cityCount; ++k) {
                if (k != j) {
                    t1 += outs[i][j] * outs[i][k];
                    t2 += outs[j][i] * outs[k][i];
                    t4 += dist[k][j] * outs[k][i] * (outs[j][p] + outs[j][q]) / 10;
                }
            }
        }
    }
    t3 = t3 - cityCount;
    t3 = t3 * t3;
    e = 0.5 * (a * t1 + b * t2 + c * t3 + d * t4);
    return e;
}

/*========== Find a valid tour ==========*/
void HP_network::findTour() {
    int i, j, k, tag[MAX_SIZE][MAX_SIZE];
    float tmp;
    for (i = 0; i < cityCount; ++i) {
        for (j = 0; j < cityCount; ++j) {
            tag[i][j] = 0;
        }
    }

    for (i = 0; i < cityCount; ++i) {
        tmp = -10.0;
        for (j = 0; j < cityCount; ++j) {
            for (k = 0; k < cityCount; ++k) {
                if (outs[i][k] >= tmp && tag[i][k] == 0) {
                    tmp = outs[i][k];
                }
            }
            if (outs[i][j] == tmp && tag[i][j] == 0) {
                tourcity[i] = j;
                tourorder[j] = i;
                for (k = 0; k < cityCount; ++k) {
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
    totalDistance = 0.0;

    for (i = 0; i < cityCount; ++i) {
        k = tourorder[i];
        l = (i == cityCount - 1) ? tourorder[0] : tourorder[i + 1];
        totalDistance += dist[k][l];
    }
}

/* ============== Iterate the network specified number of times =========*/
void HP_network::iterate(int maxIterations, int nprm, float _dt, float _tau, float _lambda) {
    int k;
    double oldEnergy, newEnergy;
    oldEnergy = getEnergy();
    k = 0;

    do {
        calculateActivations(nprm, _dt, _tau);
        calculateOutputs(_lambda);
        newEnergy = getEnergy();

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

    TSP_NW->initializeNetwork(cityCount, a, b, c, d);
    TSP_NW->assignInputs(input_vector);
    TSP_NW->calculateOutputs(lambda);
    TSP_NW->iterate(numit, nprm, dt, tau, lambda);
    TSP_NW->findTour();
    TSP_NW->calculateTotalDistance();
}

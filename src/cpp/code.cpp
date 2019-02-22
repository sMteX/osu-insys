#include "code.h"

int randomnum(int maxval) {
    return rand() % maxval;
}

int krondelt(int i, int j) {
    int k = (i == j) ? 1 : 0;
    return k;
}

int distance(int x1, int x2, int y1, int y2) {
    int x, y, d;

    x = x1 - x2;
    x = x * x;
    y = y1 - y2;
    y = y * y;
    d = (int) sqrt(x + y);

    return d;
}

int neuron::getnrn(int i, int j) {
    cit = i;
    ord = j;
    output = 0.0;
    activation = 0.0;
}

void HP_network::initdist(int cityno) {
    int i, j;
    int rows = cityno;
    int cols = 2;
    int **ordinate;
    int **row;

    ordinate = (int**) malloc((rows + 1) * sizeof(int*));
    for (i = 0; i < rows; i++) {
        ordinate[i] = (int*) malloc(cols * sizeof(int));
    }
    ordinate[rows] = 0;

    srand(cityno);

    for (i = 0; i < rows; ++i) {
        ordinate[i][0] = rand() % 100;
        ordinate[i][1] = rand() % 100;
    }

    for (i = 0; i < cityno; ++i) {
        dist[i][i] = 0;
        for (j = i + 1; j < cityno; ++j) {
            dist[i][j] = distance(ordinate[i][0], ordinate[j][0], ordinate[i][1], ordinate[j][1]) / 1;
        }
    }

    for (i = 0; i < cityno; ++i) {
        dist[i][i] = 0;
        for (j = 0; j < i; ++j) {
            dist[i][j] = dist[j][i];
        }
    }
}

/* ======================== Compute the weight matrix ===================*/
void HP_network::getnwk(int citynum, float x, float y, float z, float w) {
    int i, j, k, l, t1, t2, t3, t4, t5, t6;
    int p, q;
    cityno = citynum;
    a = x;
    b = y;
    c = z;
    d = w;
    initdist(cityno);

    for (i = 0; i < cityno; ++i) {
        for (j = 0; j < cityno; ++j) {
            tnrn[i][j].getnrn(i, j);
        }
    }

    for (i = 0; i < cityno; ++i) {
        for (j = 0; j < cityno; ++j) {
            p = (j == cityno - 1) ? 0 : j + 1;
            q = (j == 0) ? cityno - 1; j - 1;
            t1 = j + i * cityno;
            for (k = 0; k < cityno; ++k) {
                for (l = 0; l < cityno; ++l) {
                    t2 = l + k * cityno;
                    t3 = krondelt(i, k);
                    t4 = krondelt(j, l);
                    t5 = krondelt(l, p);
                    t6 = krondelt(l, q);
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
void HP_network::asgninpt(float *ip) {
    int i, j, k, l, t1, t2;

    for (i = 0; i < cityno; ++i) {
        for (j = 0; j < cityno; ++j) {
            acts[i][j] = 0.0;
        }
    }

    // find initial activations
    for (i = 0; i < cityno; ++i) {
        for (j = 0; j < cityno; ++j) {
            t1 = j + i * cityno;
            for (k = 0; k < cityno; ++k) {
                for (l = 0; l < cityno; ++l) {
                    t2 = l + k * cityno;
                    acts[i][j] += weight[t1][t2] * ip[t1];
                }
            }
        }
    }
}

/* ======== Compute the activation function outputs ======================*/
void HP_network::getacts(int nprm, float dlt, float tau) {
    int i, j, k, p, q;
    float r1, r2, r3, r4, r5;
    r3 = totout - nprm;

    for (i = 0; i < cityno; ++i) {
        r4 = 0.0;
        p = (i == cityno - 1) ? 0 : i + 1;
        q = (i == 0) ? cityno - 1; i - 1;
        for (j = 0; j < cityno; ++j) {
            r1 = citouts[i] - outs[i][j];
            r2 = ordouts[j] - outs[i][j];
            for (k = 0; k < cityno; ++k) {
                r4 += dist[i][k] * (outs[k][p] + outs[k][q]) / 100;
            }
            r5 = dlt * (-acts[i][j] / tau - a * r1 - b * r2 - c * r3 - d * r4);
            acts[i][j] += r5;
        }
    }
}

/*========== Get Neural Network Output =============================*/
void HP_network::getouts(float la) {
    double b1, b2, b3, b4;
    int i, j;
    totout = 0.0;

    for (i = 0; i < cityno; ++i) {
        citouts[i] = 0.0;
        for (j = 0; j < cityno; ++j) {
            b1 = la * acts[i][j];
            b4 = b1;
            b2 = exp(b4);
            b3 = exp(-b4);
            outs[i][j] = (float)(1.0 + (b2 - b3)/(b2 + b3)) / 2.0;
            citouts[i] += outs[i][j];
        }
        totout += citouts[i];
    }
    for (j = 0; j < cityno; ++j) {
        ordouts[j] = 0.0;
        for (i = 0; i < cityno; ++i) {
            ordouts[j] += outs[i][j];
        }
    }
}

/* ========= Compute the Energy function =========*/
float HP_network::getenergy() {
    int i, j, k, p, q;
    float t1, t2, t3, t4, e;

    t1 = 0.0;
    t2 = 0.0;
    t3 = 0.0;
    t4 = 0.0;

    for (i = 0; i < cityno; ++i) {
        p = (i == cityno - 1) ? 0 : i + 1;
        q = (i == 0) ? cityno - 1: i - 1;
        for (j = 0; j < cityno; ++j) {
            t3 += outs[i][j];
            for (k = 0; k < cityno; ++k) {
                if (k != j) {
                    t1 += outs[i][j] * outs[i][k];
                    t2 += outs[j][i] * outs[k][i];
                    t4 += dist[k][j] * outs[k][i] * (outs[j][p] + outs[j][q]) / 10;
                }
            }
        }
    }
    t3 = t3 - cityno;
    t3 = t3 * t3;
    e = 0.5 * (a * t1 + b * t2 + c * t3 + d * t4);
    return e;
}

/*========== Find a valid tour ==========*/
void HP_network::findtour() {
    int i, j, k, tag[Maxsize][Maxsize];
    float tmp;
    for (i = 0; i < cityno; ++i) {
        for (j = 0; j < cityno; ++j) {
            tag[i][j] = 0;
        }
    }

    for (i = 0; i < cityno; ++i) {
        tmp = -10.0;
        for (j = 0; j < cityno; ++j) {
            for (k = 0; k < cityno; ++k) {
                if (outs[i][k] >= tmp && tag[i][k] == 0) {
                    tmp = outs[i][k];
                }
            }
            if (outs[i][j] == tmp && tag[i][j] == 0) {
                tourcity[i] = j;
                tourorder[j] = i;
                for (k = 0; k < cityno; ++k) {
                    tag[i][k] = 1;
                    tag[k][j] = 1;
                }
            }
        }
    }
}

/*=========== Calculate total distance for tour ========= */
void HP_network::calcdist() {
    int i, k, l;
    distnce = 0.0;

    for (i = 0; i < cityno; ++i) {
        k = tourorder[i];
        l = (i == cityno - 1) ? tourorder[0] : tourorder[i + 1];
        distnce += dist[k][l];
    }
}

/* ============== Iterate the network specified number of times =========*/
void HP_network::iterate(int nit, int nprm, float dlt, float tau, float la) {
    int k, b;
    double oldenergy, newenergy, energy_diff;
    b = 1;
    oldenergy = getenergy();
    k = 0;

    do {
        getacts(nprm, dlt, tau);
        getouts(la);
        newenergy = getenergy();

        if (oldenergy - newenergy < 0.0000001) {
            break;
        }

        oldenergy = newenergy;
        k++;
    } while (k < nit);
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
    int cityno = 15;
    float input_vector[Maxsize * Maxsize];
    double dif;

    n2 = cityno * cityno;
    for (i = 0; i < n2; ++i) {
        input_vector[i] = (float)(randomnum(100)/100.0) - 1;
    }

    // create HP_network and operate

    HP_network *TSP_NW = new HP_network;

    TSP_NW->getnwk(cityno, a, b, c, d);
    TSP_NW->asgninpt(input_vector);
    TSP_NW->getouts(lambda);
    TSP_NW->iterate(numit, nprm, dt, tau, lambda);
    TSP_NW->findtour();
    TSP_NW->findtour();
}

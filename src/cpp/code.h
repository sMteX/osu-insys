#ifndef CODE_H
#define CODE_H

#define MAX_SIZE 30

class Neuron {
    protected:
        int city, order;
        float output;
        float activation;
        friend class HP_network;
    public:
        Neuron() {};
        void initializeNeuron(int, int);
}

class HP_network {
    public:
        int cityCount;
        float a, b, c, d, dt, tau, lambda;
        float totalOutput, totalDistance;

        Neuron neurons[MAX_SIZE][MAX_SIZE];
        int dist[MAX_SIZE][MAX_SIZE];
        int tourcity[MAX_SIZE];
        int tourorder[MAX_SIZE];
        float outs[MAX_SIZE][MAX_SIZE];
        float acts[MAX_SIZE][MAX_SIZE];
        float weight[MAX_SIZE * MAX_SIZE][MAX_SIZE * MAX_SIZE];
        float citouts[MAX_SIZE];
        float ordouts[MAX_SIZE];
        float energy;

        HP_network() {};
        void initializeNetwork(int, float, float, float, float, float, float, float);
        void initializeDistances();
        void findTour();
        void assignInputs(float*);
        void calculateTotalDistance();
        void iterate(int, int);
        void calculateActivations(int);
        void calculateOutputs();
        float getEnergy();
};
#endif

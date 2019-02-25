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
        float a, b, c, d, dt, tau, alpha;
        float totalOutput, totalDistance;

        Neuron neurons[MAX_SIZE][MAX_SIZE];
        int distances[MAX_SIZE][MAX_SIZE];
        int tourByCity[MAX_SIZE];
        int tourByOrder[MAX_SIZE];
        float outputs[MAX_SIZE][MAX_SIZE];
        float activations[MAX_SIZE][MAX_SIZE];
        float weight[MAX_SIZE * MAX_SIZE][MAX_SIZE * MAX_SIZE];
        float cityOutputs[MAX_SIZE];
        float orderOutputs[MAX_SIZE];
        float energy;

        HP_network() {};
        void initializeNetwork(int, float, float, float, float, float, float, float);
        void initializeDistances();
        void findTour();
        void assignInputs(float*);
        void calculateTotalDistance();
        void iterate(int);
        void calculateActivations();
        void calculateOutputs();
        float getEnergy();
};
#endif

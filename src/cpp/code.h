#ifndef CODE_H
#define CODE_H

#define Maxsize 30

class neuron {
    protected:
        int cit, ord;
        float output;
        float activation;
        friend class HP_network;
    public:
        neuron() {};
        void getnrn(int, int);
}

class HP_network {
    public:
        int cityno;
        float a, b, c, d, totout, distnce;

        neuron tnrn[Maxsize][Maxsize];
        int dist[Maxsize][Maxsize];
        int tourcity[Maxsize];
        int tourorder[Maxsize];
        float outs[Maxsize][Maxsize];
        float acts[Maxsize][Maxsize];
        float weight[Maxsize * Maxsize][Maxsize * Maxsize];
        float citouts[Maxsize];
        float ordouts[Maxsize];
        float energy;

        HP_network() {};
        void getnwk(int, float, float, float, float);
        void initdist(int);
        void findtour();
        void asgninpt(float*);
        void calcdist();
        void iterate(int, int, float, float, float);
        void getacts(int, float, float);
        void getouts(float);
        float getenergy();
};
#endif

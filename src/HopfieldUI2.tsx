import React, {ReactNode} from 'react';
import {Col, Row} from "reactstrap";
import HopfieldCanvas from "./HopfieldCanvas2";
import HopfieldSettings from "./HopfieldSettings2";
import HopfieldNet from "./HopfieldNet2";
import City from "./City";

export interface ICity {
  index: number;
  x: number;
  y: number;
}

export interface IPath {
  order: number;
  startCityIndex: number;
  endCityIndex: number;
}

export interface ISettings {
  dt: number;
  alpha: number;
  A: number;
  B: number;
  C: number;
  D: number;
  maxIterations: number;
  tau: number;
  advanced: boolean;
}

export const DEFAULT_SETTINGS: ISettings = {
  dt: 0.05,
  alpha: 3,
  A: 0.5,
  B: 0.5,
  C: 0.2,
  D: 0.5,
  maxIterations: 1000,
  tau: 1.0,
  advanced: false,
};

interface IState {
  settings: ISettings;
  cities: ICity[];
  paths: IPath[];
  totalDistance?: number;
}

export default class HopfieldUI extends React.Component<{}, IState> {
  constructor(props: any) {
    super(props);
    this.state = {
      settings: DEFAULT_SETTINGS,
      cities: [],
      paths: [],
    };

    this.setSettings = this.setSettings.bind(this);
    this.addCity = this.addCity.bind(this);
    this.removeCity = this.removeCity.bind(this);
    this.findPaths = this.findPaths.bind(this);
    this.setDefaultCities = this.setDefaultCities.bind(this);
    this.setPaths = this.setPaths.bind(this);
    this.reset = this.reset.bind(this);
  }

  setSettings(newSettings: Partial<ISettings>): void {
    const merged = {
      ...this.state.settings,
      ...newSettings,
    };
    this.setState({
      settings: merged,
    });
  }

  addCity(city: ICity) {
    this.setState(prevState => ({
      cities: [...prevState.cities, city],
    }))
  }

  removeCity(index: number) {
    this.setState(prevState => ({
      cities: prevState.cities.filter(c => c.index !== index)
    }));
  }

  async findPaths(): Promise<void> {
    const cities = this.state.cities.map(({x, y}) => new City(x, y));
    const net = new HopfieldNet(cities, this.state.settings);
    if (this.state.settings.advanced) {
      console.log("Please wait...");
      const { paths, distance, k } = await net.train2();
      console.log(`Finished, found min in iteration ${k}`);
      this.setPaths(paths);
      this.setState({ totalDistance: distance });
    }
    else {
      net.train();
      this.setPaths(net.tourByTime);
      const totalDistance = net.totalDistance;
      this.setState({
        totalDistance: totalDistance,
      });
    }
    // console.table(net.tourByTime);
    // console.table(net.outputs);
    // console.log('------------');
  }

  setPaths(paths: number[]): void {
    const p: IPath[] = [];
    for (let i = 0; i < paths.length; i++) {
      const j = (i === paths.length - 1) ? 0 : i + 1;
      p.push({
        order: i,
        startCityIndex: paths[i],
        endCityIndex: paths[j]
      });
    }
    this.setState({
      paths: p,
    });
  }

  setDefaultCities(cities: ICity[]): void {
    this.setState({
      cities: cities,
    });
  }

  reset(): void {
    this.setState({
      cities: [],
      paths: [],
    })
  }

  render(): ReactNode {
    return (
      <Row>
        <Col md={4}>
          Settings
          <HopfieldSettings setSettings={this.setSettings} findPaths={this.findPaths} setDefaultCities={this.setDefaultCities} totalDistance={this.state.totalDistance} reset={this.reset}/>
        </Col>
        <Col md={8}>
          Canvas
          <HopfieldCanvas addCity={this.addCity} removeCity={this.removeCity} cities={this.state.cities} paths={this.state.paths} />
        </Col>
      </Row>
    );
  }
}

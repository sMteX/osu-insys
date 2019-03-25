import React, {ReactNode} from 'react';
import {Button, Col, Row} from "reactstrap";
import HopfieldCanvas from "./HopfieldCanvas2";
import HopfieldSettings from "./HopfieldSettings2";
import HopfieldNet from "./HopfieldNet2";
import HopfieldHistory from "./HopfieldHistory";
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
  history: IHistoryItem[];
  totalDistance?: number;
}

export interface IHistoryItem {
  index: number;
  cities: ICity[];
  paths: IPath[];
  settings: ISettings;
  distance: number;
}

export default class HopfieldUI extends React.Component<{}, IState> {
  private historyI = 0;

  constructor(props: any) {
    super(props);
    this.state = {
      settings: DEFAULT_SETTINGS,
      cities: [],
      paths: [],
      history: [],
    };

    this.setSettings = this.setSettings.bind(this);
    this.addCity = this.addCity.bind(this);
    this.removeCity = this.removeCity.bind(this);
    this.findPaths = this.findPaths.bind(this);
    this.setDefaultCities = this.setDefaultCities.bind(this);
    this.reset = this.reset.bind(this);
    this.overrideState = this.overrideState.bind(this);
    this.clearHistory = this.clearHistory.bind(this);
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

  findPaths(): void {
    const cities = this.state.cities.map(({x, y}) => new City(x, y));
    const net = new HopfieldNet(cities, this.state.settings);

    let _paths, _distance;
    if (this.state.settings.advanced) {
      console.log("Please wait...");
      const { paths, distance, k } = net.train2();
      console.log(`Finished, found min in iteration ${k}`);

      _paths = HopfieldUI.transformPaths(paths);
      _distance = distance;
    }
    else {
      net.train();
      _distance = net.totalDistance;
      _paths = HopfieldUI.transformPaths(net.tourByTime);
    }

    const item: IHistoryItem = {
      index: this.historyI,
      cities: this.state.cities,
      paths: _paths,
      settings: this.state.settings,
      distance: _distance,
    };
    this.historyI++;
    this.state.history.push(JSON.parse(JSON.stringify(item)));

    this.setState({
      totalDistance: _distance,
      paths: _paths,
    });

  }

  static transformPaths(paths: number[]): IPath[] {
    const p: IPath[] = [];
    for (let i = 0; i < paths.length; i++) {
      const j = (i === paths.length - 1) ? 0 : i + 1;
      p.push({
        order: i,
        startCityIndex: paths[i],
        endCityIndex: paths[j]
      });
    }
    return p;
  }

  setDefaultCities(cities: ICity[]): void {
    this.setState({
      cities: cities,
    });
  }

  reset(): void {
    this.setState({
      totalDistance: undefined,
      cities: [],
      paths: [],
    })
  }

  overrideState(state: IHistoryItem): void {
    this.setState({
      paths: state.paths,
      totalDistance: state.distance,
      cities: state.cities,
      settings: state.settings, // TODO: broken, not connected this.state.settings => <HopfieldSettings>
    });
  }

  clearHistory(): void {
    this.historyI = 0;
    this.setState({
      history: [],
    });
  }

  render(): ReactNode {
    return (
      <Row>
        <Col md={4}>
          Settings
          <HopfieldSettings setSettings={this.setSettings} findPaths={this.findPaths} setDefaultCities={this.setDefaultCities} reset={this.reset}/>
          <Button onClick={this.clearHistory}>Clear history</Button>
          <br />
          {this.state.totalDistance && (<span>Total distance: {this.state.totalDistance}</span>)}
          <HopfieldHistory overrideState={this.overrideState} history={this.state.history.sort((a, b) => b.index - a.index)} />
        </Col>
        <Col md={8}>
          Canvas
          <HopfieldCanvas addCity={this.addCity} removeCity={this.removeCity} cities={this.state.cities} paths={this.state.paths} />
        </Col>
      </Row>
    );
  }
}

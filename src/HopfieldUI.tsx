import React, {ReactNode} from 'react';
import {Button, Col, Row} from "reactstrap";
import HopfieldCanvas from "./HopfieldCanvas";
import HopfieldSettings from "./HopfieldSettings";
import HopfieldNet from "./HopfieldNet";
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
  D: 1.25,
  maxIterations: 1500,
  tau: 1.0,
  advanced: true,
};

export const DEFAULT_CITIES: ICity[] = [
  { index: 0, x: 100, y: 300 },
  { index: 1, x: 200, y: 150 },
  { index: 2, x: 75, y: 200 },
  { index: 3, x: 350, y: 50 },
];

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

  setDefaultCities(): void {
    this.setState({
      cities: DEFAULT_CITIES,
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
      <Row style={{ marginTop: 20 }}>
        <Col md={5}>
          <h4>Nastavení parametrů</h4>
          <HopfieldSettings setSettings={this.setSettings} settings={this.state.settings} /> <br />
          <Button onClick={this.findPaths}>Najít cestu</Button>
          {/*<Button onClick={this.setDefaultCities}>Set default cities</Button> <br />*/}
          <Button onClick={this.reset} style={{ marginLeft: 15 }}>Reset</Button>
          <Button onClick={this.clearHistory} style={{ marginLeft: 15 }}>Vyčistit historii</Button>
          <br />
          {this.state.totalDistance && (<span style={{ marginTop: 10 }}>Celková délka cesty: {this.state.totalDistance.toFixed(3)}</span>)}
          <br />
          {this.state.history.length > 0 && (<>
            <h4>Historie</h4>
            <HopfieldHistory overrideState={this.overrideState} history={this.state.history.sort((a, b) => b.index - a.index)} />
          </>)}
        </Col>
        <Col md={7}>
          <HopfieldCanvas addCity={this.addCity} removeCity={this.removeCity} cities={this.state.cities} paths={this.state.paths} />
        </Col>
      </Row>
    );
  }
}

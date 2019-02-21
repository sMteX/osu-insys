import React, {ReactNode} from 'react';
import {Col, Row} from "reactstrap";
import HopfieldCanvas from "./HopfieldCanvas";
import HopfieldSettings from "./HopfieldSettings";
import HopfieldNet from "./HopfieldNet";
import City from "./City";

export interface ICity {
  index: number;
  x: number;
  y: number;
}

export interface ISettings {
  dt: number;
  alpha: number;
  A: number;
  B: number;
  C: number;
  D: number;
  maxIterations: number;
}

export const DEFAULT_SETTINGS: ISettings = {
  dt: 0.05,
  alpha: 50,
  A: 500,
  B: 500,
  C: 200,
  D: 500,
  maxIterations: 1000,
};

interface IState {
  settings: ISettings;
  cities: ICity[];
  paths: any[];
}

export default class HopfieldUI extends React.Component<{}, IState> {
  constructor(props: any) {
    super(props);
    this.state = {
      settings: DEFAULT_SETTINGS,
      cities: [],
      paths: []
    };

    this.setSettings = this.setSettings.bind(this);
    this.addCity = this.addCity.bind(this);
    this.removeCity = this.removeCity.bind(this);
    this.findPaths = this.findPaths.bind(this);
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
    net.train();
  }

  render(): ReactNode {
    return (
      <Row>
        <Col md={4}>
          Settings
          <HopfieldSettings setSettings={this.setSettings} findPaths={this.findPaths} />
        </Col>
        <Col md={8}>
          Canvas
          <HopfieldCanvas addCity={this.addCity} removeCity={this.removeCity} cities={this.state.cities} paths={this.state.paths} />
        </Col>
      </Row>
    );
  }
}

import React, {ReactNode} from 'react';
import {Col, Row} from "reactstrap";
import HopfieldCanvas from "./HopfieldCanvas";
import HopfieldSettings from "./HopfieldSettings";

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
  cities: any[];
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

  render(): ReactNode {
    return (
      <Row>
        <Col md={4}>
          Settings
          <HopfieldSettings setSettings={this.setSettings} />
        </Col>
        <Col md={8}>
          Canvas
          <HopfieldCanvas cities={this.state.cities} paths={this.state.paths} />
        </Col>
      </Row>
    );
  }
}

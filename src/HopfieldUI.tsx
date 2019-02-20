import React, {ReactNode} from 'react';
import {Col, Row} from "reactstrap";
import HopfieldCanvas from "./HopfieldCanvas";
import HopfieldSettings from "./HopfieldSettings";

interface IState {
  settings: object;
  cities: any[];
  paths: any[];
}

export default class HopfieldUI extends React.Component<{}, IState> {
  render(): ReactNode {
    return (
      <Row>
        <Col md={4}>
          Settings
          <HopfieldSettings settings={this.state.settings} />
        </Col>
        <Col md={8}>
          Canvas
          <HopfieldCanvas cities={this.state.cities} paths={this.state.paths} />
        </Col>
      </Row>
    );
  }
}

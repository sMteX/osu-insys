import React from 'react';
import {Col, Row} from "reactstrap";

export default class HopfieldUI extends React.Component {
  render(): JSX.Element {
    return (
      <Row>
        <Col md={4}>
          Settings
        </Col>
        <Col md={8}>
          Canvas
        </Col>
      </Row>
    );
  }
}
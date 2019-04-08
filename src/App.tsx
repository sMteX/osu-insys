import React, {Component} from 'react';
import {Container, Col} from 'reactstrap';
import HopfieldUI from './HopfieldUI';

class App extends Component {
  render() {
    return (
      <Container fluid>
        <Col md={{
          size: 9,
          offset: 2
        }}>
          <h1>Problém obchodního cestujícího</h1>
          <HopfieldUI />
        </Col>
      </Container>
    );
  }
}

export default App;

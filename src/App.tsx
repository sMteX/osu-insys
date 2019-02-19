import React, {Component} from 'react';
import {Container, Col} from 'reactstrap';
import HopfieldUI from './HopfieldUI';

class App extends Component {
  render() {
    return (
      <Container fluid>
        <Col md={{
          size: 8,
          offset: 2
        }}>
          Hello
          <br />
          <HopfieldUI/>
        </Col>
      </Container>
    );
  }
}

export default App;

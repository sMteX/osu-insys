import React from 'react';
import {ISettings} from './HopfieldUI2';
import {Col, Row} from "reactstrap";

interface IProps {
  setSettings(newSettings: Partial<ISettings>): any;
  settings: ISettings;
}
export default class HopfieldSettings extends React.Component<IProps, {}> {
  constructor(props: any) {
    super(props);

    this.handleSettingsChange = this.handleSettingsChange.bind(this);
  }

  handleSettingsChange(prop: keyof ISettings): (event: React.FormEvent<HTMLInputElement>) => void {
    return (event: React.FormEvent<HTMLInputElement>) => {
      if (prop === 'advanced') {
        const newAdvanced = !this.props.settings.advanced;
        this.props.setSettings({
          advanced: newAdvanced,
        });
      }
      else {
        this.props.setSettings({
          [prop]: Number(event.currentTarget.value),
        })
      }
    }
  }

  render(): React.ReactNode {
    return (
      <div>
        <Row>
          <Col md={4} style={{ textAlign: 'right' }}>
            <label>dt:</label>
          </Col>
          <Col md={8}>
            <input type="number" step={0.01} onChange={this.handleSettingsChange('dt')} value={this.props.settings.dt} />
          </Col>
        </Row>
        <Row>
          <Col md={4} style={{ textAlign: 'right' }}>
            <label>alpha:</label>
          </Col>
          <Col md={8}>
            <input type="number" step={1} onChange={this.handleSettingsChange('alpha')} value={this.props.settings.alpha} />
          </Col>
        </Row>
        <Row>
          <Col md={4} style={{ textAlign: 'right' }}>
            <label>tau:</label>
          </Col>
          <Col md={8}>
            <input type="number" step={0.1} onChange={this.handleSettingsChange('tau')} value={this.props.settings.tau} />
          </Col>
        </Row>
        <Row>
          <Col md={4} style={{ textAlign: 'right' }}>
            <label>A:</label>
          </Col>
          <Col md={8}>
            <input type="number" step={0.05} onChange={this.handleSettingsChange('A')} value={this.props.settings.A} />
          </Col>
        </Row>
        <Row>
          <Col md={4} style={{ textAlign: 'right' }}>
            <label>B:</label>
          </Col>
          <Col md={8}>
            <input type="number" step={0.05} onChange={this.handleSettingsChange('B')} value={this.props.settings.B} />
          </Col>
        </Row>
        <Row>
          <Col md={4} style={{ textAlign: 'right' }}>
            <label>C:</label>
          </Col>
          <Col md={8}>
            <input type="number" step={0.05} onChange={this.handleSettingsChange('C')} value={this.props.settings.C} />
          </Col>
        </Row>
        <Row>
          <Col md={4} style={{ textAlign: 'right' }}>
            <label>D:</label>
          </Col>
          <Col md={8}>
            <input type="number" step={0.05} onChange={this.handleSettingsChange('D')} value={this.props.settings.D} />
          </Col>
        </Row>
        <Row>
          <Col md={4} style={{ textAlign: 'right' }}>
            <label>max. iterací:</label>
          </Col>
          <Col md={8}>
            <input type="number" step={10} onChange={this.handleSettingsChange('maxIterations')} value={this.props.settings.maxIterations} />
          </Col>
        </Row>
        {/*<input type="checkbox" onChange={this.handleSettingsChange('advanced')} checked={this.props.settings.advanced} /> <br />*/}
      </div>
    );
  }
}

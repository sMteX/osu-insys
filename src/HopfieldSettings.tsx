import React from 'react';
import {ISettings, DEFAULT_SETTINGS} from './HopfieldUI';
import {Button} from "reactstrap";

interface IProps {
  setSettings(newSettings: Partial<ISettings>): any;
  findPaths(): any;
}

interface IState extends ISettings {}

export default class HopfieldSettings extends React.Component<IProps, IState> {
  constructor(props: any) {
    super(props);
    this.state = {
      ...DEFAULT_SETTINGS,
    };

    this.handleSettingsChange = this.handleSettingsChange.bind(this);
    this.findPaths = this.findPaths.bind(this);
  }

  handleSettingsChange(prop: keyof ISettings): (event: React.FormEvent<HTMLInputElement>) => void {
    return (event: React.FormEvent<HTMLInputElement>) => {
      // @ts-ignore
      this.setState({
        [prop]: Number(event.currentTarget.value)
      });
      this.props.setSettings({
        [prop]: Number(event.currentTarget.value),
      })
    }
  }

  findPaths(): void {
    this.props.findPaths();
  }

  render(): React.ReactNode {
    return (
      <div>
        <label>dt:</label> <input type="number" step={0.01} onChange={this.handleSettingsChange('dt')} value={this.state.dt} /> <br />
        <label>alpha:</label> <input type="number" step={1} onChange={this.handleSettingsChange('alpha')} value={this.state.alpha} /> <br />
        <label>A:</label> <input type="number" step={0.05} onChange={this.handleSettingsChange('A')} value={this.state.A} /> <br />
        <label>B:</label> <input type="number" step={0.05} onChange={this.handleSettingsChange('B')} value={this.state.B} /> <br />
        <label>C:</label> <input type="number" step={0.05} onChange={this.handleSettingsChange('C')} value={this.state.C} /> <br />
        <label>D:</label> <input type="number" step={0.05} onChange={this.handleSettingsChange('D')} value={this.state.D} /> <br />
        <label>max iterations:</label> <input type="number" step={10} onChange={this.handleSettingsChange('maxIterations')} value={this.state.maxIterations} /> <br />
        <Button onClick={this.findPaths}>Find path</Button>
      </div>
    );
  }
}

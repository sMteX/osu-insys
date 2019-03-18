import React from 'react';
import {ISettings, DEFAULT_SETTINGS, ICity} from './HopfieldUI2';
import {Button} from "reactstrap";

interface IProps {
  setSettings(newSettings: Partial<ISettings>): any;
  setDefaultCities(cities: ICity[]): void;
  reset(): void;
  findPaths(): any;
  totalDistance?: number;
}

interface IState extends ISettings {}

const DEFAULT_CITIES: ICity[] = [
  { index: 0, x: 100, y: 300 },
  { index: 1, x: 200, y: 150 },
  { index: 2, x: 75, y: 200 },
  { index: 3, x: 350, y: 50 },
];

export default class HopfieldSettings extends React.Component<IProps, IState> {
  constructor(props: any) {
    super(props);
    this.state = {
      ...DEFAULT_SETTINGS,
    };

    this.handleSettingsChange = this.handleSettingsChange.bind(this);
    this.setDefaultCities = this.setDefaultCities.bind(this);
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

  setDefaultCities(): void {
    this.props.setDefaultCities(DEFAULT_CITIES);
  }

  render(): React.ReactNode {
    return (
      <div>
        <label>dt:</label> <input type="number" step={0.01} onChange={this.handleSettingsChange('dt')} value={this.state.dt} /> <br />
        <label>alpha:</label> <input type="number" step={1} onChange={this.handleSettingsChange('alpha')} value={this.state.alpha} /> <br />
        <label>tau:</label> <input type="number" step={0.1} onChange={this.handleSettingsChange('tau')} value={this.state.tau} /> <br />
        <label>A:</label> <input type="number" step={0.05} onChange={this.handleSettingsChange('A')} value={this.state.A} /> <br />
        <label>B:</label> <input type="number" step={0.05} onChange={this.handleSettingsChange('B')} value={this.state.B} /> <br />
        <label>C:</label> <input type="number" step={0.05} onChange={this.handleSettingsChange('C')} value={this.state.C} /> <br />
        <label>D:</label> <input type="number" step={0.05} onChange={this.handleSettingsChange('D')} value={this.state.D} /> <br />
        <label>max iterations:</label> <input type="number" step={10} onChange={this.handleSettingsChange('maxIterations')} value={this.state.maxIterations} /> <br />
        <Button onClick={this.props.findPaths}>Find path</Button>
        <Button onClick={this.setDefaultCities}>Set default cities</Button> <br />
        <Button onClick={this.props.reset}>Reset</Button> <br />
        {this.props.totalDistance && (<span>Total distance: {this.props.totalDistance}</span>)}
      </div>
    );
  }
}

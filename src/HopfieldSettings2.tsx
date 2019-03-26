import React from 'react';
import {ISettings, ICity} from './HopfieldUI2';

interface IProps {
  setSettings(newSettings: Partial<ISettings>): any;
  settings: ISettings;
}

export const DEFAULT_CITIES: ICity[] = [
  { index: 0, x: 100, y: 300 },
  { index: 1, x: 200, y: 150 },
  { index: 2, x: 75, y: 200 },
  { index: 3, x: 350, y: 50 },
];

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
        <label>dt:</label> <input type="number" step={0.01} onChange={this.handleSettingsChange('dt')} value={this.props.settings.dt} /> <br />
        <label>alpha:</label> <input type="number" step={1} onChange={this.handleSettingsChange('alpha')} value={this.props.settings.alpha} /> <br />
        <label>tau:</label> <input type="number" step={0.1} onChange={this.handleSettingsChange('tau')} value={this.props.settings.tau} /> <br />
        <label>A:</label> <input type="number" step={0.05} onChange={this.handleSettingsChange('A')} value={this.props.settings.A} /> <br />
        <label>B:</label> <input type="number" step={0.05} onChange={this.handleSettingsChange('B')} value={this.props.settings.B} /> <br />
        <label>C:</label> <input type="number" step={0.05} onChange={this.handleSettingsChange('C')} value={this.props.settings.C} /> <br />
        <label>D:</label> <input type="number" step={0.05} onChange={this.handleSettingsChange('D')} value={this.props.settings.D} /> <br />
        <label>max iterations:</label> <input type="number" step={10} onChange={this.handleSettingsChange('maxIterations')} value={this.props.settings.maxIterations} />
        <input type="checkbox" onChange={this.handleSettingsChange('advanced')} checked={this.props.settings.advanced} /> <br />
      </div>
    );
  }
}

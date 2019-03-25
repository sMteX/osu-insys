import React, {ReactNode} from 'react';
import { IHistoryItem } from './HopfieldUI2';
import {Input} from "reactstrap";

interface IProps {
  overrideState(state: IHistoryItem): void;
  history: IHistoryItem[];
}

export default class HopfieldHistory extends React.Component<IProps, {}> {
  constructor(props: any) {
    super(props);

    this.optionChanged = this.optionChanged.bind(this);
  }

  optionChanged(event: React.FormEvent<HTMLInputElement>): void {
    const i: number = Number(event.currentTarget.value);
    // @ts-ignore
    this.props.overrideState(this.props.history.find(item => item.index === i));
  }

  render(): ReactNode {
    return (
      <Input type="select" size={10} onChange={this.optionChanged}>
        {this.props.history.map(item => (
          <option value={item.index}>
            Cities: {item.cities.length}, length: {item.distance.toFixed(3)}
          </option>
        ))}
      </Input>
    );
  }
}
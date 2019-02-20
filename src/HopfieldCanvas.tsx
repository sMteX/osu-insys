import React from 'react';
import {Circle, Layer, Rect, Stage} from "react-konva";
import * as Konva from "konva";
import {ICity} from "./HopfieldUI";

const LEFT_BUTTON = 0;
const RIGHT_BUTTON = 2;

interface IProps {
  addCity(city: ICity): any;
  removeCity(index: number): any;
  cities: ICity[];
  paths: any[];
}

export default class HopfieldCanvas extends React.Component<IProps, {}> {
  i = 0;

  constructor(props: any) {
    super(props);
    this.handleCanvasClick = this.handleCanvasClick.bind(this);
    this.handleCityClick = this.handleCityClick.bind(this);
  }

  handleCanvasClick(event: Konva.KonvaEventObject<MouseEvent>): void {
    if (event.evt.button === LEFT_BUTTON) {
      this.props.addCity({
        index: this.i,
        x: event.evt.offsetX,
        y: event.evt.offsetY
      });
      this.i++;
    }
  }

  handleCityClick(i: number): (event: Konva.KonvaEventObject<MouseEvent>) => void {
    return (event) => {
      if (event.evt.button === RIGHT_BUTTON) {
        this.props.removeCity(i);
      }
    };
  }

  render(): React.ReactNode {
    return (
      <Stage width={500} height={500} onClick={this.handleCanvasClick} onContextMenu={({ evt }) => evt.preventDefault()}>
        <Layer>
          <Rect
            x={0}
            y={0}
            width={500}
            height={500}
            stroke="black"
          />
          {this.props.cities.map(({index, x, y}) => (
            <Circle
              x={x}
              y={y}
              radius={8}
              fill="red"
              onClick={this.handleCityClick(index)}
            />
          ))}
        </Layer>
      </Stage>
    );
  }
}

import React from 'react';
import {Circle, Layer, Line, Rect, Stage, Text} from "react-konva";
import * as Konva from "konva";
import {ICity, IPath} from "./HopfieldUI";

const LEFT_BUTTON = 0;
const RIGHT_BUTTON = 2;

interface IProps {
  addCity(city: ICity): any;
  removeCity(index: number): any;
  cities: ICity[];
  paths: IPath[];
}

interface IPathWithCoords {
  order: number;
  points: number[];
  length: number;
  lengthCoords: {
    x: number;
    y: number;
  }
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
      if (this.props.paths.length === 0 && event.evt.button === RIGHT_BUTTON) {
        this.props.removeCity(i);
      }
    };
  }

  get pathsWithCoords(): IPathWithCoords[] {
    const paths = this.props.paths.map(path => ({
      order: path.order,
      startX: this.props.cities[path.startCityIndex].x,
      startY: this.props.cities[path.startCityIndex].y,
      endX: this.props.cities[path.endCityIndex].x,
      endY: this.props.cities[path.endCityIndex].y,
    }));
    const lengths = this.props.paths.map(path => {
      const startX = this.props.cities[path.startCityIndex].x;
      const startY = this.props.cities[path.startCityIndex].y;
      const endX = this.props.cities[path.endCityIndex].x;
      const endY = this.props.cities[path.endCityIndex].y;
      const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      return {
        startCityIndex: path.startCityIndex,
        endCityIndex: path.endCityIndex,
        length: length,
      };
    });
    // console.table(lengths);
    let total = 0;
    lengths.forEach(l => {
      total += l.length;
    });
    // console.log(`Total distance: ${total}`);
    return paths.map(path => {
      const length = Math.sqrt(Math.pow(path.endX - path.startX, 2) + Math.pow(path.endY - path.startY, 2));
      const coords = {
        x: path.startX + (path.endX - path.startX) / 2,
        y: path.startY + (path.endY - path.startY) / 2,
      };
      return {
        order: path.order,
        points: [path.startX, path.startY, path.endX, path.endY],
        length: length,
        lengthCoords: coords,
      };
    });
  }

  render(): React.ReactNode {
    const paths = this.pathsWithCoords;
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
          {paths.map(({order, points}) => (
            <Line
              key={order}
              points={points}
              stroke="green"
              strokeWidth={2}
            />
          ))}
          {this.props.cities.map(({index, x, y}) => {
            const shiftX = index >= 10 ? -7 : -3;
            const shiftY = -18;
            return (
              <React.Fragment key={index}>
                <Circle
                  x={x}
                  y={y}
                  radius={8}
                  fill="red"
                  onClick={this.handleCityClick(index)}
                />
                <Text
                  text={index.toString()}
                  x={x + shiftX}
                  y={y + shiftY}
                />
              </React.Fragment>
            )
          })}
        </Layer>
      </Stage>
    );
  }
}

import React from 'react';
import DropDown, {DropDownProps, DropDownState} from './DropDown';

interface AlgProps extends DropDownProps {
    onChange: (alg: string) => void
}

interface DropDownTextState extends DropDownState {
    text: string,
}

interface ClrProps extends DropDownProps {
    onClickPath: () => void,
    onClickTiles: () => void,
    onClickReset: () => void;
}

interface MazeProps extends DropDownProps {
    onClickMaze: () => void,
    onClickMazeHorizontal: () => void,
    onClickMazeVertical: () => void,
    onClickRandomTerrain: () => void
}

interface TileProps extends DropDownProps {
    onClickTileType: (cost: number) => void
}

interface ClickableProps {
    click: () => void;
}

class Clickable extends React.Component<ClickableProps>
{
    render() {
        return (
            <div
                tabIndex={0}
                onKeyPress={this.props.click}
                onClick={this.props.click}
            >
                {this.props.children}
            </div>
        )
    }
}

export class AlgorithmDropDown extends DropDown<AlgProps, DropDownTextState>
{
    constructor(props: AlgProps) {
        super(props);
        this.state = {
            up: true,
            display: 'none',
            text: 'A* Search',
            fade: 'fade-in'
        };
    }

    onChange(key: string, algText: string) {
        this.props.onChange(key);
        this.setState({
            text: algText
        });
    }

    render() {
        return (
            this.renderDropDown(
                this.state.text,
                <div
                    style={this.contentStyle()}
                    className={this.state.fade + ' alg-drop-down-content drop-down-content'}
                >
                    <Clickable click={() => this.onChange('a*', 'A* Search')}>A* Search</Clickable>
                    <Clickable click={() => this.onChange('dijkstra', 'Dijkstra')}>Dijkstra's Algorithm</Clickable>
                    <Clickable click={() => this.onChange('best-first', 'Best First')}>Best First Search</Clickable>
                    <Clickable click={() => this.onChange('bfs', 'Breadth First')}>Breadth First Search</Clickable>
                    <Clickable click={() => this.onChange('dfs', 'Depth First')}>Depth First Search</Clickable>
                </div>
            )
        );
    }
}

export class ClearDropDown extends DropDown<ClrProps, DropDownState>
{
    constructor(props: ClrProps) {
        super(props);
        this.state = {
            up: true,
            display: 'none',
            fade: 'fade-in'
        };
    }

    render() {
        return (
            this.renderDropDown(
                'Reset',
                <div
                    style={this.contentStyle()}
                    className={this.state.fade + ' clr-drop-down-content drop-down-content'}
                >
                    <Clickable click={this.props.onClickPath}>Clear Path</Clickable>
                    <Clickable click={this.props.onClickTiles}>Clear Tiles</Clickable>
                    <Clickable click={this.props.onClickReset}>Reset Grid</Clickable>
                </div>
            )
        );
    }
}

export class MazeDropDown extends DropDown<MazeProps, DropDownState>
{
    constructor(props: MazeProps) {
        super(props);
        this.state = {
            up: true,
            display: 'none',
            fade: 'fade-in'
        };
    }

    render() {
        return (
            this.renderDropDown(
                'Terrain',
                <div
                    style={this.contentStyle()}
                    className={this.state.fade + ' maze-drop-down-content drop-down-content'}
                >
                    <Clickable click={this.props.onClickMaze}>Recursive Maze Division</Clickable>
                    <Clickable click={this.props.onClickMazeHorizontal}>Horizontal Skewed Maze</Clickable>
                    <Clickable click={this.props.onClickMazeVertical}>Vertical Skewed Maze</Clickable>
                    <Clickable click={this.props.onClickRandomTerrain}>Random Terrain</Clickable>
                </div>,
                'maze-drop-down'
            )
        );
    }
}

export class TilesDropDown extends DropDown<TileProps, DropDownTextState>
{
    constructor(props: TileProps) {
        super(props);
        this.state = {
            up: true,
            display: 'none',
            fade: 'fade-in',
            text: 'Wall [∞]'
        };
    }

    onChange(cost: number, text: string) {
        this.props.onClickTileType(cost);
        this.setState({
            text: text
        }, () => this.props.onClickTileType(cost));
    }

    render() {
        return (
            this.renderDropDown(
                this.state.text,
                <div
                    style={this.contentStyle()}
                    className={this.state.fade + ' tiles-drop-down-content drop-down-content'}
                >
                    <Clickable click={() => this.onChange(-1, 'Wall [∞]')}>Wall [∞]</Clickable>
                    <Clickable click={() => this.onChange(2, 'Weight [2]')}>Weight [2]</Clickable>
                    <Clickable click={() => this.onChange(3, 'Weight [3]')}>Weight [3]</Clickable>
                    <Clickable click={() => this.onChange(5, 'Weight [5]')}>Weight [5]</Clickable>
                </div>,
                'tiles-drop-down'
            )
        );
    }
}
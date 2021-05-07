import React, {RefObject} from 'react';
import './Grid.css';
import GridBackground from './GridBackground';
import GridForeground from './GridForeground';
import StatsPanel from './StatsPanel';
import {Node} from '../../pathfinding/algorithms/Node';
import PathfindingSettings from '../PathfindingSettings';
import PathfinderBuilder from '../../pathfinding/algorithms/PathfinderBuilder';
import Pathfinder from '../../pathfinding/algorithms/Pathfinder';
import {createTile, Point, Tile, TileData} from '../../pathfinding/core/Components';
import {euclidean} from '../../pathfinding/algorithms/Heuristics';
import VirtualTimer from '../utility/VirtualTimer';
import TerrainGeneratorBuilder, {RANDOM_TERRAIN} from '../../pathfinding/algorithms/TerrainGeneratorBuilder';

interface IProps {
    tileWidth: number,
    settings: Readonly<PathfindingSettings>,
    onChangeVisualizing: (visualizing: boolean) => void;
}

interface IState {
    time: number,
    length: number,
    cost: number,
    nodes: number,
    algorithm: string,
    weightOpacity: number
}

class PathfindingVisualizer extends React.Component<IProps,IState>
{
    //references to expose background and foreground grids to parent
    private background: RefObject<GridBackground> = React.createRef();
    private foreground: RefObject<GridForeground> = React.createRef();
    private stats: RefObject<StatsPanel> = React.createRef();

    private visualized = false;
    private visualizing = false;
    private visualTimeouts: VirtualTimer[]  = [];
    private generations: Node[] = [];

    private mazeTile: TileData = createTile(true);

    private readonly tilesX: number;
    private readonly tilesY: number;
    private readonly tileWidth: number

    constructor(props: IProps) {
        super(props);
        const w = window.screen.availWidth - (window.outerWidth - window.innerWidth);
        const h = window.screen.availHeight - (window.outerHeight - window.innerHeight);
        this.tileWidth = this.props.tileWidth;
        this.tilesX = Math.floor(w / this.tileWidth) + 1;
        this.tilesY = Math.floor((h - 75 - 30) / this.tileWidth) + 1;
        this.state = {
            time: -1,
            length: -1,
            cost: -1,
            nodes: -1,
            algorithm: '',
            weightOpacity: 1
        }
    }

    shouldComponentUpdate(nextProps: Readonly<IProps>, nextState: Readonly<IState>) {
        const prevState = this.state;
        return prevState.time !== nextState.time ||
            prevState.length !== nextState.length ||
            prevState.cost !== nextState.cost ||
            prevState.nodes !== nextState.nodes ||
            prevState.algorithm !== nextState.algorithm ||
            prevState.weightOpacity !== nextState.weightOpacity;
    }

    changeTile = (data: TileData) => {
        this.mazeTile = data; //enables weighted mazes
        this.foreground.current!.changeTile(data);
    }

    canShowArrows = () => {
        const settings = this.props.settings;
        return settings.showArrows && settings.algorithm !== 'dfs';
    }

    canShowFrontier = () => {
        const settings = this.props.settings;
        return settings.visualizeAlg;
    }

    /**
     * Pause the delayed pathfinding algorithm being performed
     */
    pausePathfinding = () => {
        for(const timeout of this.visualTimeouts) {
            timeout.pause();
        }
    }

    /**
     * Resume the delayed pathfinding algorithm being performed
     * Will reset the timeouts to the last time the timeout was paused/started
     * if not properly called while the timeout is paused
     */
    resumePathfinding = () => {
        for(const timeout of this.visualTimeouts) {
            timeout.resume();
        }
    }

    /**
     * Performs the pathfinding algorithm on the grid and visualizes it
     */
    doPathfinding = () => {
        this.clearPath();
        const settings = this.props.settings;
        const pathfinder = this.getPathfinder(settings);
        const path = this.findPath(pathfinder);
        this.generations = pathfinder.getRecentGenerations();
        if(this.canShowArrows()) {
            this.addArrowGenerations(this.generations);
        }
        if(this.canShowFrontier()) {
            this.visualizeGenerations(this.generations);
        }
        this.drawPath(path);
    }

    /**
     * Performs the pathfinding algorithm on the grid and visualizes it with delays between successive
     * node generations
     * If the visualizer is currently visualizing, the visualization stops instead
     */
    doDelayedPathfinding = () => {
        this.clearVisualization();
        this.clearPath();
        const settings = this.props.settings;
        this.visualized = false;
        const foreground = this.foreground.current!;
        foreground.toggleDisable();
        if(!this.visualizing) { //start visualization if not visualizing
            this.visualizing = true;
            this.props.onChangeVisualizing(this.visualizing);
            const pathfinder = this.getPathfinder(settings);
            const path = this.findPath(pathfinder);
            const promises: Promise<VirtualTimer>[] = []; //to call function when timeouts finish
            this.visualTimeouts = [];
            const baseIncrement = settings.delayInc;
            let delay = 0;
            const visualizeAlg = this.canShowFrontier();
            const showArrows = this.canShowArrows();
            if(showArrows || visualizeAlg) {
                const expandVisualization = visualizeAlg ? this.visualizeGeneration : () => {};
                const expandArrows = showArrows ? this.addArrowGeneration : () => {};
                this.generations = pathfinder.getRecentGenerations();
                this.generations.forEach((generation) => {
                    const promise = new Promise<VirtualTimer>((resolve) => {
                        //each generation gets a higher timeout
                        const timeout = new VirtualTimer(() => {
                            expandArrows(generation);
                            expandVisualization(generation);
                            resolve(timeout);
                        }, delay);
                        this.visualTimeouts.push(timeout);
                    });
                    promises.push(promise);
                    delay += baseIncrement;
                });
            }
            //call functions when timeouts finish
            Promise.all(promises).then(() => {
                this.drawPath(path);
                foreground.toggleDisable();
                this.visualizing = false;
                this.visualized = true;
                this.props.onChangeVisualizing(this.visualizing);
            });
        } else { //stop visualizing if visualizing
            for (const timeout of this.visualTimeouts) {
                timeout.clear();
            }
            this.visualizing = false;
            this.props.onChangeVisualizing(this.visualizing);
        }
    }

    /**
     * Get the pathfinder for the settings
     * @param settings
     */
    private getPathfinder = (settings: PathfindingSettings) => {
        const algorithmKey = settings.algorithm;
        const algorithm = settings.bidirectional && PathfinderBuilder.hasBidirectional(algorithmKey) ?
            PathfinderBuilder.makeBidirectional(algorithmKey) : algorithmKey;
        return new PathfinderBuilder(this.foreground.current!.state.grid)
            .setAlgorithm(algorithm)
            .setHeuristic(settings.heuristicKey)
            .setNavigator(settings.navigatorKey)
            .build();
    }

    /**
     * Find path with a given pathfinder, includes benchmarking
     * @param pathfinder
     */
    private findPath = (pathfinder: Pathfinder) => {
        const foreground = this.foreground.current!;
        const t0 = performance.now();
        const path = pathfinder.findPath(foreground.state.initial, foreground.state.goal);
        const t1 = performance.now();
        const t2 = (t1 - t0);
        this.setState({
            time: t2,
            nodes: pathfinder.getRecentNodes(),
            length: calcLength(foreground.state.initial, path),
            cost: calcCost(foreground.state.grid.get(foreground.state.initial), path),
            algorithm: pathfinder.getAlgorithmName()
        });
        return path;
    }

    /**
     * Draw path on the grid and change length on ui
     * @param path
     */
    private drawPath = (path: Tile[]) => {
        const foreground = this.foreground.current!
        path.unshift(this.foreground.current!.state.grid.get(foreground.state.initial));
        this.foreground.current!.drawPath(path);
    }

    /**
     * Called when child foreground moves a tile
     */
    private onTilesDragged = () => {
        if(this.visualized) {
            this.clearVisualization();
            this.doPathfinding();
            this.visualized = true;
        }
    }

    /**
     * Create terrain on the grid foreground
     */
    createTerrain = (mazeType: number) => {
        if(this.visualizing) {
            return;
        }
        this.clearTiles();
        this.clearPath();
        this.clearVisualization();
        const foreground = this.foreground.current!;
        const end = this.calcEndPointInView();
        const newState = (mazeType !== RANDOM_TERRAIN) ? {
            initial: {
                x: 1, y: 1
            },
            goal: {
                x: end.x-2, y: end.y-2
            }
        } : {
            initial: {
                x: 1, y: ((end.y-1) / 2) >> 0
            },
            goal: {
                x: end.x-2, y: ((end.y-1) / 2) >> 0
            }
        };
        foreground.setState(newState,() => {
            const prevGrid = foreground.state.grid;
            const generator = new TerrainGeneratorBuilder()
                .setDimensions(
                    prevGrid.getWidth(),
                    prevGrid.getHeight()
                )
                .setGeneratorType(mazeType)
                .setIgnorePoints([foreground.state.initial, foreground.state.goal])
                .setTileData(this.mazeTile)
                .build();
            const topLeft = {
                x: 1, y: 1
            };
            const bottomRight = {
                x: end.x-2, y: end.y-2
            };
            const grid = generator.generateTerrain(topLeft, bottomRight);
            foreground.drawGrid(grid);
        });
    }

    /**
     * Calculate the end/goal point in view of the screen
     */
    calcEndPointInView = () => {
        const xEnd = window.innerWidth / this.tileWidth;
        const yEnd = (window.innerHeight - 75 - this.stats.current!.getHeight()) / this.tileWidth;
        const xFloor = Math.floor(xEnd);
        const yFloor = Math.floor(yEnd);
        const xDecimal = xEnd - xFloor;
        const yDecimal = yEnd - yFloor;
        let x = xDecimal > 0.05 ? Math.ceil(xEnd) : xFloor;
        let y = yDecimal > 0.05 ? Math.ceil(yEnd) : yFloor;
        if(x > this.tilesX) {
            x = this.tilesX
        }
        if(y > this.tilesY) {
            y = this.tilesY
        }
        return {
            x: x, y: y
        }
    }

    resetPoints = () => {
        if(!this.visualizing) {
            this.foreground.current!.resetPoints();
        }
    }

    clearPath = () => {
        this.foreground.current!.erasePath();
    }

    clearTiles = () => {
        this.foreground.current!.clearTiles();
    }

    clearTilesChecked = () => {
        if(!this.visualizing) {
            this.foreground.current!.clearTiles();
        }
    }

    clearVisualization = () => {
        this.visualized = false;
        this.background.current!.clear();
    }

    clearVisualizationChecked = () => {
        if(!this.visualizing) {
            this.visualized = false;
            this.background.current!.clear();
        }
    }

    private visualizeGenerations = (generations: Node[]) => {
        this.background.current!.visualizeGenerations(generations);
        this.visualized = true;
    }

    private visualizeGeneration = (generation: Node) => {
        this.background.current!.visualizeGeneration(generation);
    }

    private addArrowGenerations = (generations: Node[]) => {
        this.background.current!.addArrowGenerations(generations);
    }

    private addArrowGeneration = (generation: Node) => {
        this.background.current!.addArrowGeneration(generation);
    }

    render() {
        return (
            <div>
                <StatsPanel ref={this.stats} algorithm={this.state.algorithm}
                            length={this.state.length} cost={this.state.cost}
                            time={this.state.time} nodes={this.state.nodes}
                />
                <div>
                    <GridBackground ref={this.background} tileWidth={this.tileWidth}
                                    tilesX={this.tilesX} tilesY={this.tilesY}
                    />
                    <GridForeground ref={this.foreground} topMargin={75}
                                    onTilesDragged={this.onTilesDragged} tileSize={this.tileWidth}
                                    tilesX={this.tilesX} tilesY={this.tilesY}
                                    weightOpacity={this.state.weightOpacity}
                    />
                </div>
            </div>
        );
    }
}

function calcLength(initial: Point, path: Tile[]) {
    if(path.length === 0) {
        return 0;
    }
    let len = euclidean(initial, path[0].point);
    for (let i = 0; i < path.length - 1; i++) {
        len += euclidean(path[i].point, path[i + 1].point);
    }
    return +(len).toFixed(3);
}

function calcCost(initial: Tile, path: Tile[]) {
    if(path.length === 0) {
        return 0;
    }
    let len = euclidean(initial.point, path[0].point) * path[0].data.pathCost;
    for (let i = 0; i < path.length - 1; i++) {
        len += euclidean(path[i].point, path[i + 1].point) * path[i + 1].data.pathCost;
    }
    return +(len).toFixed(3);
}

export default PathfindingVisualizer;
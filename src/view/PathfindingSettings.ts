interface PathfindingSettings
{
    visualizeAlg: boolean,
    showArrows: boolean,
    delayInc: number,
    algorithm: string,
    heuristicKey: string,
    navigatorKey: string,
    bidirectional: boolean,
}

export function getDefaultSettings(): PathfindingSettings {
    return {
        visualizeAlg: true,
        showArrows: true,
        delayInc: 35,
        algorithm: 'a*',
        heuristicKey: 'manhattan',
        navigatorKey: 'plus',
        bidirectional: false,
    }
}

export default PathfindingSettings;
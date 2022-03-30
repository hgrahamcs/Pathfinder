/*
 * Copyright (c) Joseph Prichard 2022.
 */

import React from 'react';
import './styles/Grid.scss';
import './styles/Panels.scss';
import './styles/Navbar.scss';
import './styles/Tutorial.scss'
import PathfindingApp from './components/PathfindingApp';

class App extends React.Component
{
    render() {
        return (
            <PathfindingApp/>
        );
    }
}

export default App;

import React from 'react';

export interface DropDownProps {
    onClick: () => void
}

export interface DropDownState {
    up: boolean,
    display: string,
    fade: string
}

abstract class DropDown<IProps extends DropDownProps, IState extends DropDownState>
    extends React.Component<IProps, IState>
{
    protected constructor(props: IProps) {
        super(props);
    }

    windowOnClick = () => {
        this.hide();
    }

    /**
     * Binds window listeners.
     * Hides the drop down if clicked anywhere else
     */
    componentDidMount() {
        window.addEventListener('click', this.windowOnClick);
    }

    componentWillUnmount() {
        window.removeEventListener('click', this.windowOnClick);
    }

    show() {
        this.setState({
            up: false,
            display: 'block',
        });
    }

    hide() {
        this.setState({
            display: 'none',
            up: true,
        });
    }

    toggle(e: Event) {
        e.stopPropagation();
        this.props.onClick();
        if(this.isHidden()) {
            this.show();
        } else {
            this.hide();
        }
    }

    isHidden() {
        return this.state.display === 'none';
    }

    contentStyle() {
        return {
            display: this.state.display
        }
    }

    arrowClass() {
        return this.state.up ? 'arrowUp' : 'arrowDown';
    }

    getHighlightClass() {
        return !this.state.up ? 'drop-down-button-down' : 'drop-down-button-up'
    }

    renderDropDown(text: string, content: JSX.Element, dropDownClass?: string) {
        const className = dropDownClass === undefined ? '' : dropDownClass;
        return (
            <div
                tabIndex={0}
                className={'drop-down ' + className}
                onMouseDown={e => e.preventDefault()}
                onKeyPress={(e) => this.toggle(e.nativeEvent)}
                onClick={(e) => this.toggle(e.nativeEvent)}
            >
                <div className={'drop-down-button ' + this.getHighlightClass()}>
                    <div className='drop-down-button-wrapper'>
                        <span className='drop-down-text'>{text}</span>
                        <span className={this.arrowClass()}/>
                    </div>
                </div>
                {content}
            </div>
        );
    }
}

export default DropDown;
import React from 'react';

interface IProps {
    min: number,
    max: number,
    default: number,
    step: number,
    sliderStyle: string,
    onChange: (val: number) => void
}

interface IState {
    value: number
}

class SteppedRangeSlider extends React.Component<IProps, IState>
{
    private mouseUp = true;

    constructor(props: IProps) {
        super(props);
        this.state = {
            value: this.props.default
        }
    }

    /**
     * Trigger callback when slider value is changed
     * @param e
     */
    onChange(e: React.FormEvent<HTMLInputElement>) {
        if(!this.mouseUp) { //to prevent firefox from resetting on release
            const val = Number(e.currentTarget.value);
            this.setState({
                value: val
            }, () => this.props.onChange(val));
        }
    }

    onMouseUp() {
        this.mouseUp = true;
    }

    onMouseDown() {
        this.mouseUp = false;
    }

    render() {
        return (
            <input type='range' list='step-list'
                   value={this.state.value}
                   min={this.props.min} max={this.props.max}
                   step={this.props.step} className={this.props.sliderStyle}
                   onInput={e => this.onChange(e)}
                   onMouseUp={() => this.onMouseUp()}
                   onMouseDown={() => this.onMouseDown()}
                   onTouchEnd={() => this.onMouseUp()}
                   onTouchStart={() => this.onMouseDown()}
            >
            </input>
        );
    }
}

export default SteppedRangeSlider;
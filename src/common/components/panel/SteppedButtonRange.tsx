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

const HOLD_DELAY = 100;

class SteppedButtonRange extends React.Component<IProps, IState>
{
    private interval: NodeJS.Timeout | undefined;
    private callback: (() => void) | undefined;

    private intervals: number = 0;

    constructor(props: IProps) {
        super(props);
        this.state = {
            value: this.props.default
        }
    }

    minus() {
        const val = this.state.value;
        this.setState({
            value: val - this.props.step >= this.props.min ?
                val - this.props.step : val
        }, () => this.props.onChange(val));
    }

    onMinus(e: Event) {
        e.preventDefault();
        this.callback = () => {
            this.intervals++;
            this.minus();
        };
        this.interval = setInterval(this.callback, HOLD_DELAY);
    }

    plus() {
        const val = this.state.value;
        this.setState({
            value: val + this.props.step <= this.props.max ?
                val + this.props.step : val
        }, () => this.props.onChange(val));
    }

    onPlus(e: Event) {
        e.preventDefault();
        this.callback = () => {
            this.intervals++;
            this.plus();
        };
        this.interval = setInterval(this.callback, HOLD_DELAY);
    }

    cancel() {
        if(this.intervals === 0) {
            (this.callback as () => void)();
        }
        clearInterval(this.interval as NodeJS.Timeout);
        this.intervals = 0;
    }

    render() {
        return (
            <div className='button-range-wrapper'>
                <button
                    className='range-button minus'
                    onMouseDown={e => this.onMinus(e.nativeEvent)}
                    onMouseUp={() => this.cancel()}
                    onMouseLeave={() => this.cancel()}
                    onKeyDown={(e) => {
                        if(e.key == 'Enter') {
                            this.minus();
                        }
                    }}
                >
                    -
                </button>
                <div
                    className='range-value'
                >
                    {this.state.value}
                </div>
                <button
                    className='range-button plus'
                    onMouseDown={e => this.onPlus(e.nativeEvent)}
                    onMouseUp={() => this.cancel()}
                    onMouseLeave={() => this.cancel()}
                    onKeyDown={(e) => {
                        if(e.key == 'Enter') {
                            this.plus()
                        }
                    }}
                >
                    +
                </button>
            </div>
        );
    }
}

export default SteppedButtonRange;
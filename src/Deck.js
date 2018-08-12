import React, { Component } from 'react';
import { Animated,
    PanResponder,
    Dimensions,
    LayoutAnimation,
    UIManager,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPEOUT_DURATION = 250;

class Deck extends Component {

    // if prop not sent by parent, default will be used
    static defaultProps = {
        onSwipeRight: () => {},
        onSwipeLeft: () => {},
    };

    constructor(props){
        super(props);
        this.position = new Animated.ValueXY();

        this.panResponder = PanResponder.create({
            // determines whether this panResponder should be responsible for handling a touch
            // return true or false. could have logic here depending
            onStartShouldSetPanResponder: () => { return true },
            // cb every time user drags finger a pixel over -- called many times
            onPanResponderMove: (event, gesture) => {
                // update the position with the total x and y coordinates
                // that the user has dragged (represented by dx and dy)
                this.position.setValue({ x: gesture.dx, y: gesture.dy })
            },
            // cb when user lets go
            onPanResponderRelease: (event, gesture) => {
                if(gesture.dx > SWIPE_THRESHOLD){
                    console.log("swiped right!!")
                    this.forceSwipe('right');
                } else if (gesture.dx < -SWIPE_THRESHOLD){
                    console.log("swiped left!!")
                    this.forceSwipe('left');
                } else {
                    console.log("resetting position!!")
                    this.resetPosition();
                }
            }
        });

        this.state = { index: 0 };
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.data !== this.props.data){
            this.setState({index: 0})
        }
    }

    componentWillUpdate() {
        // need this line for Android
        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
        LayoutAnimation.spring();
    }

    forceSwipe(direction){
        const x = direction === 'right' ? SCREEN_WIDTH : - SCREEN_WIDTH
        // Animated.timing is just like Animated.spring except less gradual animation
        Animated.timing(this.position, {
            toValue: { x, y: 0 },
            // in milliseconds
            duration: SWIPEOUT_DURATION,
        }).start(() => { this.onSwipeComplete(direction)})
    }

    onSwipeComplete(direction){
        const { onSwipeLeft, onSwipeRight, data } = this.props;
        const item = data[this.state.index];
        direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
        // need to reset position before changing cards or else the next
        // card would automatically swipe off
        this.position.setValue({ x: 0, y: 0 });
        this.setState({ index: this.state.index + 1});
    }

    resetPosition(){
        Animated.spring(this.position, {
            toValue: {x: 0, y:0 }
        }).start();
    }

    getCardStyle(){
        const position  = this.position;

        // interpoloation relates one scale with another --
        // here we releate drag along x-axis with degrees of rotation
        // Note that this rotation can happen even though Animated.View
        // only renders once. No state changes and no re-render. Breaks traditional react rules.
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
            outputRange: ['-120deg', '0deg', '120deg']
        })
        return {
            ...position.getLayout(),
            transform: [{rotate }],
        }
    }

    renderCards(){
        if (this.state.index >= this.props.data.length) {
            return this.props.renderNoMoreCards();
        }
        return this.props.data.map((item, i) => {
            // we've already seen the card
            if (i < this.state.index ) { return null };
            if (i === this.state.index) {
                return (
                    <Animated.View
                    key={item.id}
                    {...this.panResponder.panHandlers}
                    style={[this.getCardStyle(), styles.cardStyle]}
                >
                    {this.props.renderCard(item)}
                </Animated.View>
                )
            }
            return (
            // need to use Animated.View or else will be flash
            // between converting from a View to Animated.View when
            // promoted to top card
                <Animated.View
                    key={item.id}
                    style={[styles.cardStyle, {top: 10 * (i - this.state.index)}]}>
                {this.props.renderCard(item)}
                </Animated.View>
            )
        // need to reverse or else the card on top will be the last
        // that won't move
        }).reverse()
    }

    render(){
        return (
            <Animated.View>
                {this.renderCards()}
            </Animated.View>
        )
    }
}

const styles = {
    cardStyle: {
        position: 'absolute',
        width: SCREEN_WIDTH,
    }
}

export default Deck;
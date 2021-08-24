import React from 'react';
import { cleanup, createEvent, fireEvent, render } from '@testing-library/react';
import 'pepjs';

import { ReactCompareSlider, ReactCompareSliderHandle } from '../src';

const getBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

/* eslint-disable @typescript-eslint/no-explicit-any */
beforeAll(() => {
  /**
   * @HACK Big ol' hack to imitate `getBoundingClientRect` to allow for testing
   *       `onPositionChange` callback.
   */
  (window.HTMLElement.prototype as any).getBoundingClientRect = function () {
    return {
      width: parseFloat(this.style.width) || 0,
      height: parseFloat(this.style.height) || 0,
      top: parseFloat(this.style.marginTop) || 0,
      left: parseFloat(this.style.marginLeft) || 0,
    };
  };
});

afterAll(() => {
  (window.HTMLElement.prototype as any).getBoundingClientRect = getBoundingClientRect;
});
/* eslint-enable @typescript-eslint/no-explicit-any */

afterEach(cleanup);

describe('ReactCompareSlider', () => {
  it('Should render with required props.', () => {
    const { getByTestId } = render(
      <ReactCompareSlider
        itemOne={<div data-testid="rcs-one">Foo</div>}
        itemTwo={<div data-testid="rcs-two">Bar</div>}
      />
    );

    expect(getByTestId('rcs-one')).toBeInTheDocument();
    expect(getByTestId('rcs-two')).toBeInTheDocument();
  });

  it('Should render in portrait with custom style.', () => {
    const style = { width: '100%', height: '100%' };
    const { getByTestId } = render(
      <ReactCompareSlider
        style={style}
        itemOne={<div data-testid="rcs-one">Foo</div>}
        itemTwo={<div data-testid="rcs-two">Bar</div>}
        portrait
      />
    );

    expect(getByTestId('rcs-one')).toBeInTheDocument();
    expect(getByTestId('rcs-two')).toBeInTheDocument();
  });

  it('Should render custom handle and style.', () => {
    const style = { width: '100%', height: '100%' };
    const handleTestId = 'youcanthandlethis';
    const Handle = () => <ReactCompareSliderHandle data-testid={handleTestId} />;

    const { getByTestId } = render(
      <ReactCompareSlider
        style={style}
        boundsPadding={100}
        handle={<Handle />}
        itemOne={<div>Foo</div>}
        itemTwo={<div>Bar</div>}
        position={75}
      />
    );

    expect(getByTestId(handleTestId)).toBeInTheDocument();
  });

  it('Should resync position on prop updates.', async () => {
    const handlePositionChange = jest.fn();
    const style = { width: 1024, height: 768 };

    const { rerender } = render(
      <ReactCompareSlider
        boundsPadding={25}
        itemOne={<img src="https://via.placeholder.com/1024x768" style={style} />}
        itemTwo={<img src="https://via.placeholder.com/1024x768" style={style} />}
        onPositionChange={handlePositionChange}
        position={25}
        style={style}
      />
    );

    rerender(
      <ReactCompareSlider
        boundsPadding={75}
        itemOne={<img src="https://via.placeholder.com/1024x768" style={style} />}
        itemTwo={<img src="https://via.placeholder.com/1024x768" style={style} />}
        onPositionChange={handlePositionChange}
        portrait
        position={75}
        style={style}
      />
    );

    expect(handlePositionChange).toHaveBeenCalledWith(75);
  });

  it('Should execute `onPositionChange` callback on main container mouse interactions.', () => {
    const testId = 'testaroo';
    const handlePositionChange = jest.fn();
    const style = { width: 1024, height: 768 };

    const { getByTestId } = render(
      <ReactCompareSlider
        data-testid={testId}
        style={style}
        itemOne={<img src="https://via.placeholder.com/1024x768" style={style} />}
        itemTwo={<img src="https://via.placeholder.com/1024x768" style={style} />}
        onPositionChange={handlePositionChange}
      />
    );

    // const target = {
    //   setPointerCapture: jest.fn(),
    //   hasPointerCapture: jest.fn(),
    //   releasePointerCapture: jest.fn(),
    // };

    const component = getByTestId(testId);

    fireEvent(component, createEvent.pointerDown(component, { buttons: 1 }));
    fireEvent(component, createEvent.pointerMove(component, { buttons: 1 }));
    fireEvent(
      component,
      createEvent.pointerMove(component, { buttons: 1, pageX: 256, pageY: 200 })
    );
    fireEvent(component, createEvent.pointerUp(component, { buttons: 1 }));

    // fireEvent.pointerDown(component, { pageX: 1024, pageY: 256 });
    // fireEvent.pointerMove(component, { pageX: 512, pageY: 512 });
    // fireEvent.pointerUp(component, { pageX: 1024, pageY: 0 });
    expect(handlePositionChange).toHaveBeenCalledTimes(4);
  });

  it('Should only execute `onPositionChange` callback on handle interactions when using `onlyHandleDraggable`.', () => {
    const componentTestId = 'testaroo';
    const handleTestId = 'youcanthandlethis';
    const handlePositionChange = jest.fn();
    const style = { width: 1024, height: 768 };
    const Handle = () => <ReactCompareSliderHandle data-testid={handleTestId} />;

    const { getByTestId } = render(
      <ReactCompareSlider
        data-testid={componentTestId}
        style={style}
        itemOne={<img src="https://via.placeholder.com/1024x768" style={style} />}
        itemTwo={<img src="https://via.placeholder.com/1024x768" style={style} />}
        handle={<Handle />}
        onlyHandleDraggable
        onPositionChange={handlePositionChange}
      />
    );

    const target = {
      setPointerCapture: jest.fn(),
      hasPointerCapture: jest.fn(),
      releasePointerCapture: jest.fn(),
    };

    const component = getByTestId(componentTestId);
    fireEvent.pointerDown(component, { pageX: 250, pageY: 20, target });
    fireEvent.pointerMove(component, { pageX: 100, pageY: 20, target });
    fireEvent.pointerUp(component, { pageX: 100, pageY: 20, target });
    // We expect the position to be called twice on mount.
    expect(handlePositionChange).toHaveBeenCalledTimes(2);

    const handle = getByTestId(handleTestId);
    fireEvent.pointerDown(handle, { buttons: 1, pageX: 250, pageY: 20, target });
    fireEvent.pointerMove(handle, { buttons: 1, pageX: 100, pageY: 20, target });
    fireEvent.pointerUp(handle, { buttons: 1, pageX: 100, pageY: 20, target });
    // mount + mousedown + mousemove.
    expect(handlePositionChange).toHaveBeenCalledTimes(4);
  });
});

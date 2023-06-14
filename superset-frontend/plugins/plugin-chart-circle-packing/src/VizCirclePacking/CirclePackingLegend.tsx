import React, { useEffect, useRef, useState } from 'react';
import debounce from 'lodash/debounce';

import './CirclePackingLegend.css';

function CirclePackingLegend() {
  // Make sure legend always appears at bottom of screen
  const legendEl = useRef(null);
  const [legendBottom, setLegendBottom] = useState(0);

  useEffect(() => {
    // Make sure that legend is always positioned at bottom of screen

    function setLegendY() {
      const { y, height } = legendEl.current.getBoundingClientRect();
      setLegendBottom(window.innerHeight - y - height);
    }

    setLegendY();

    const debouncedSetLegendY = debounce(setLegendY);
    window.addEventListener('resize', debouncedSetLegendY);
    return () => window.removeEventListener('resize', debouncedSetLegendY);
  }, []);

  return (
    <div
      ref={legendEl}
      className="tva-circle-packing-legend"
      style={{ '--legend-bottom': `${legendBottom}px` }}
    >
      <div className="tva-circle-packing-legend__title">Test</div>
      <div className="tva-circle-packing-legend__circle">
        <div className="tva-circle-packing-legend__circle__label label--outer">
          Test
        </div>
        <div className="tva-circle-packing-legend__circle__label label--inner">
          Test
        </div>
      </div>
    </div>
  );
}

export default React.memo(CirclePackingLegend);

import React, { useEffect, useState } from 'react';
// import { hierarchy, pack } from 'd3-hierarchy';
// import { select as d3Select } from 'd3-selection';
// import { scaleLinear } from 'd3-scale';
// import d3 from 'd3';
import groupBy from 'lodash/groupBy';
import minBy from 'lodash/minBy';
import maxBy from 'lodash/maxBy';
import meanBy from 'lodash/meanBy';
// import isEqual from 'lodash/isEqual';

// import 'd3-transition';

// import VizTooltip from '../VizTooltip/VizTooltip';
import CirclePackingLegend from './CirclePackingLegend';

import './VizCirclePacking.css';
// import { SupersetPluginChartCirclePackingProps } from '../types';

const VizCirclePacking = props => {
  const { data, d3hierarchy, d3pack, d3Select, d3scaleLinear } = props;
  // , normalized, filtersUnit, hoverOrgName

  const width = 1200;
  const height = 1200;
  const normalizedCircleRadius = 15;
  const circlePadding = 15;

  // This is not a strictly correct way to use React state since we'll mutate these
  // D3 objects.
  const [circleGroups, setCircleGroups] = useState(null);
  const [outerCircles, setOuterCircles] = useState(null);
  // const [innerCircles, setInnerCircles] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedDatum, setSelectedDatum] = useState(null);
  // const [previousFiltersUnit, setPreviousFiltersUnit] = useState([]);
  const [currentDataUnits, setCurrentDataUnits] = useState([]);

  function createLeaves(enter) {
    const minMaxCodePosition = {};

    const res = enter
      .append('g')
      .attr('class', 'circle-group')
      .attr('transform', d => {
        if (d.children && d.data.gender) {
          const circleSize = d.r * 2;
          minMaxCodePosition[d.data.gender] = {
            min: { x: d.x, y: d.y },
            max: { x: d.x + circleSize, y: d.y + circleSize },
          };
        }

        return `translate(${d.x + 1},${d.y + 1})`;
      });

    // setMinMaxPositionPerCode(minMaxCodePosition);

    return res;
  }

  // function getInnerCircleSize(d, referenceSize) {
  //   return referenceSize * Math.min(1, d.data.activeUsers / d.data.totalUsers);
  // }

  // function createInnerCircles(leaves) {
  //   return leaves
  //     .filter(d => !d.children)
  //     .append('circle')
  //     .attr('class', 'circle-inner')
  //     .attr('r', d => getInnerCircleSize(d, d.r))
  //     .attr('fill', d => (d.data.gender === 'boy' ? `orangered` : 'skyblue'));
  // }

  function createOuterCircles(leaves) {
    return leaves
      .append('circle')
      .attr('class', d => (d.children ? null : 'circle-outer'))
      .attr('r', d => (!Number.isNaN(d.r) ? d.r : 0))
      .attr('fill', d =>
        d.children
          ? 'crimson'
          : d.data.gender === 'boy'
          ? `orangered`
          : 'skyblue',
      )
      .attr('stroke', 'darkgrey')
      .attr('strokeWidth', 0.5)
      .attr('opacity', d => (d.children ? 0.1 : 1))
      .on('mousemove', d => {
        if (!d.children) {
          if (d !== selectedDatum) {
            setSelectedDatum(d.data);
          }

          // setTooltipPosition({ x: e.offsetX, y: e.offsetY });
        }
      })
      .on('mouseleave', () => setSelectedDatum(null));
  }

  function createCirclePackingViz(packed) {
    const svg = d3Select('#tva-viz-circle-packing');

    let leaves = svg
      .selectAll('g')
      // By taking the object as a reference, we always enter/exit all nodes on
      // update, which makes for a more clean transition animation and removes
      // complicated state management between new and existing nodes.
      .data(packed.descendants(), d => d)
      .enter();

    leaves = createLeaves(leaves);
    setCircleGroups(leaves);

    // const inner = createInnerCircles(leaves);
    // setInnerCircles(inner);

    const outer = createOuterCircles(leaves);
    setOuterCircles(outer);
  }

  function updateCirclePackingViz(packed) {
    const transitionDuration = 1000;

    circleGroups
      .data(packed.descendants(), d => d)
      .join(
        enter => {
          const leaves = createLeaves(enter);
          setCircleGroups(leaves);

          // const inner = createInnerCircles(leaves).attr('opacity', 0);
          // inner
          //   // .transition()
          //   // .duration(transitionDuration)
          //   .attr('opacity', 1);
          // setInnerCircles(inner);

          const outer = createOuterCircles(leaves).attr('opacity', 0);
          outer
            // .transition()
            // .duration(transitionDuration)
            .attr('opacity', 1);
          setOuterCircles(outer);

          // if (normalized) {
          //   setTimeout(() => {
          //     toggleNormalizeCircles(inner, outer);
          //   }, transitionDuration * 0.5);
          // }

          return leaves;
        },
        update =>
          update
            // .transition()
            // .duration(transitionDuration)
            .attr('transform', d => `translate(${d.x + 1},${d.y + 1})`),
        exit =>
          exit
            // .transition()
            // .duration(transitionDuration)
            // .attr('opacity', 0)
            .remove(),
      );
  }

  /**
   * Recursively add normalized data to default data
   */
  function zipPackedData(packDefault, packNormalized) {
    packDefault.rNormalized = packNormalized.r;
    packDefault.xNormalized = packNormalized.x;
    packDefault.yNormalized = packNormalized.y;

    if (packDefault.children) {
      packDefault.children.forEach((child, i) =>
        zipPackedData(child, packNormalized.children[i]),
      );
    } else {
      return packDefault;
    }
  }

  // We use this to be able to scale the blobs well on code selection
  // const [minMaxPositionPerCode, setMinMaxPositionPerCode] = useState({});

  // function hoverCircle(hoverDatum) {
  //   if (innerCircles && outerCircles) {
  //     innerCircles.classed(
  //       'unselected',
  //       d => hoverDatum && d.data !== (hoverDatum.data || hoverDatum),
  //     );

  //     outerCircles.classed(
  //       'unselected',
  //       d => hoverDatum && d.data !== (hoverDatum.data || hoverDatum),
  //     );
  //   }
  // }

  // useEffect(() => {
  //   if (circleGroups) {
  //     showFiltersUnitBlobs();
  //   }
  // }, [filtersUnit]);

  useEffect(() => {
    const dataByUnitObj = groupBy(data, 'gender');

    // const filtersUnitChanged = !isEqual(previousFiltersUnit, filtersUnit);

    // const dataUnitsChanged =
    //   filtersUnitChanged &&
    //   Object.keys(dataByUnitObj).some(unit => !currentDataUnits.includes(unit));

    // Only change data if filtersUnit hasn't changed, provided current data is the same as it was.
    // If filtersUnit has changed, handle change inside component,
    // to be able to show different transition animation.
    // BUT: Do change data when filter units changed, but also we have new data because the filter
    // to change overall data has changed.
    // if (data && (!filtersUnitChanged || dataUnitsChanged)) {
    if (data) {
      if (data.length) {
        const minUsers = minBy(data, 'COUNT(state)')['COUNT(state)'];
        const maxUsers = maxBy(data, 'COUNT(state)')['COUNT(state)'];
        const meanUsers = meanBy(data, 'COUNT(state)');
        const avgSpacePerDatum = (height * 0.5) / data.length;
        const minFactor = (meanUsers - minUsers) / meanUsers;
        const maxFactor = maxUsers / meanUsers;

        const getCircleRadius = d3scaleLinear()
          .domain([minUsers, maxUsers])
          .range([avgSpacePerDatum * minFactor, avgSpacePerDatum * maxFactor]);

        const dataByUnit = Object.keys(dataByUnitObj).map(unit => ({
          gender: unit,
          children: dataByUnitObj[unit],
        }));

        const root = { children: dataByUnit };
        // SUm determines the size of the circle radii
        const defaultHierarchy = d3hierarchy(root);
        const normalizedHierarchy = d3hierarchy(root);

        const createPack = d3pack()
          .size([width, height])
          .padding(circlePadding)
          .radius(d => getCircleRadius(d.data['COUNT(state)']));

        const createNormalizedPack = d3pack()
          .size([width, height])
          .padding(circlePadding)
          .radius(() => normalizedCircleRadius);

        const packed = createPack(defaultHierarchy);

        const normalizedPacked = createNormalizedPack(normalizedHierarchy);
        zipPackedData(packed, normalizedPacked);
        // If no viz exists, create one. Else, update existing svg
        if (!circleGroups) {
          createCirclePackingViz(packed);
        } else {
          updateCirclePackingViz(packed);
        }
        // if (filtersUnitChanged) {
        //   showFiltersUnitBlobs(true)
        // }
      } else if (circleGroups) {
        circleGroups
          .data([], d => d)
          .join(exit =>
            exit.transition().duration(1000).attr('opacity', 0).remove(),
          );
      }
      setCurrentDataUnits(Object.keys(dataByUnitObj));
    }

    // setPreviousFiltersUnit(filtersUnit);
  }, [data]);

  // useEffect(() => {
  //   hoverCircle(selectedDatum);
  // }, [selectedDatum, hoverCircle]);

  // useEffect(() => {
  //   hoverCircle(hoverOrgName);
  // }, [hoverOrgName]);

  // useEffect(() => {
  //   if (innerCircles && outerCircles) {
  //     toggleNormalizeCircles(innerCircles, outerCircles);
  //   }
  // }, [normalized]);

  // function showFiltersUnitBlobs(fromNewData = false) {
  //   circleGroups.classed(
  //     'hide',
  //     d => filtersUnit.length && !filtersUnit.includes(d.data.gender),
  //   );

  //   // Transform the circle that contains all units of the selected code

  //   const totalCodesAmount = Object.keys(minMaxPositionPerCode).length;
  //   if (
  //     filtersUnit.length &&
  //     (filtersUnit.length !== totalCodesAmount || fromNewData)
  //   ) {
  //     const minMaxPositions = getMinMaxForCodes(filtersUnit);

  //     if (Object.keys(minMaxPositions).length) {
  //       const selectionRadii = getRadiiForCodes(minMaxPositions);

  //       circleGroups
  //         .filter(d => !d.children && filtersUnit.includes(d.data.gender))
  //         .transition()
  //         .duration(500)
  //         .attr('transform', d => {
  //           const referenceRadius =
  //             selectionRadii.width > selectionRadii.height
  //               ? selectionRadii.width
  //               : selectionRadii.height;

  //           // Difference between svg "radius" and radius of area of selected globs
  //           const differenceRadiusContainer = height * 0.5 - referenceRadius;
  //           const scale =
  //             1 + (differenceRadiusContainer / referenceRadius) * 0.9;

  //           const radiusDifference = {
  //             x: d.parent.r - selectionRadii.width,
  //             y: d.parent.r - selectionRadii.height,
  //           };

  //           const offset = {
  //             x:
  //               d.x -
  //               (minMaxPositions.min.x - width * 0.5) +
  //               radiusDifference.x,
  //             y:
  //               d.y -
  //               (minMaxPositions.min.y - height * 0.5) +
  //               radiusDifference.y,
  //           };

  //           // Scale distance of point from center (-1 to account for the initial distance that is already there)
  //           const scaledOffset = {
  //             x: offset.x + (offset.x - width * 0.5) * (scale - 1),
  //             y: offset.y + (offset.y - height * 0.5) * (scale - 1),
  //           };

  //           return `translate(${scaledOffset.x} ${scaledOffset.y}) scale(${scale})`;
  //         });
  //     }
  //   } else {
  //     circleGroups
  //       .transition()
  //       .duration(500)
  //       .attr('transform', d => `translate(${d.x} ${d.y})`);
  //   }
  // }

  // function getMinMaxForCodes(codes) {
  //   return codes.reduce((prev, nextCode) => {
  //     ['min', 'max'].forEach(i => {
  //       let codeValue = minMaxPositionPerCode[nextCode];

  //       if (codeValue) {
  //         codeValue = codeValue[i];

  //         if (!prev[i]) {
  //           prev[i] = { ...codeValue };
  //         } else {
  //           ['x', 'y'].forEach(coord => {
  //             if (i === 'min') {
  //               prev[i][coord] =
  //                 prev[i][coord] < codeValue[coord]
  //                   ? prev[i][coord]
  //                   : codeValue[coord];
  //             } else {
  //               prev[i][coord] =
  //                 prev[i][coord] > codeValue[coord]
  //                   ? prev[i][coord]
  //                   : codeValue[coord];
  //             }
  //           });
  //         }
  //       }
  //     });

  //     return prev;
  //   }, {});
  // }

  // function getRadiiForCodes(minMax) {
  //   return {
  //     width: (minMax.max.x - minMax.min.x) * 0.5,
  //     height: (minMax.max.y - minMax.min.y) * 0.5,
  //   };
  // }

  // function toggleNormalizeCircles(inner, outer) {
  //   outer
  //     .filter(d => !d.children)
  //     .transition()
  //     .duration(500)
  //     .attr('r', d => (normalized ? d.rNormalized : d.r));

  //   inner
  //     .filter(d => !d.children)
  //     .transition()
  //     .duration(500)
  //     .attr('r', d => getInnerCircleSize(d, normalized ? d.rNormalized : d.r));

  //   // circleGroups
  //   //   .transition()
  //   //   .filter((d) => !d.children)
  //   //   .duration(500)
  //   //   .attr("transform", (d) =>
  //   //     normalized
  //   //       ? `translate(${d.xNormalized + 1},${d.yNormalized + 1})`
  //   //       : `translate(${d.x + 1},${d.y + 1})`
  //   //   );
  // }

  return (
    <div className="tva-viz-circle-packing-wrapper'">
      <svg id="tva-viz-circle-packing" viewBox={`0 0 ${width} ${height}`} />

      {selectedDatum && (
        <div
          className="tva-viz-circle-packing__tooltip"
          // style={{
          //   '--tooltip-x': tooltipPosition.x,
          //   '--tooltip-y': tooltipPosition.y,
          // }}
        >
          {selectedDatum.name}: <strong>{selectedDatum['COUNT(state)']}</strong>
        </div>
      )}
    </div>
  );
};

export default VizCirclePacking;

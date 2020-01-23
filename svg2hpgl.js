// Node 0.11
// USAGE
// node svg2hpgl.js FILENAME.svg OUTPUT.hpgl

const fs = require('fs');
const SVGReader = require('./lib/SVGReader.js');
const Bounds = require('./lib/bounds.js');
const Flatten = require('./lib/flatten.js');

if (process.argv.length < 4) {
  console.log('Usage: node ' + process.argv[1] + ' INPUT.svg OUTPUT.hpgl [options]');
  console.log("Options: --paper=[A|B] --pressure=[1-10] --pen=[1-8] --padding=[0-4000]")
  console.log("Defaults: --paper=A --pressure=1 --pen=4 --padding=1000")
  process.exit(1);
}

const filename = process.argv[2];
const output = process.argv[3];

const options = {
  connectLines: true,
  flatten: false,
  padding: 1000,
  pen: 4,
  plotterHeight: 7840,
  // plotterHeight: 10170,
  plotterWidth: 10170,
  // plotterWidth: 16450,
  pressure: 1,
  removeInvisiblePaths: false,
};

process.argv.forEach(function (arg) {
  var name, value;
  [name, value] = arg.split("=")
  if (name === "--paper") {
    if (value === 'B') {
      options.plotterHeight = 10170;
      options.plotterWidth = 16450;
    } else if (value == 'A') {
      options.plotterHeight = 7840;
      options.plotterWidth = 10170;
    } else {
      throw("Please specify either 'A' or 'B' for --paper");
    }
  }

  if (name === "--pressure") {
    options.pressure = parseInt(value);
  }

  if (name === "--pen") {
    options.pen = parseInt(value);
  }

  if (name === "--padding") {
    options.padding = parseInt(value);
  }
});

fs.readFile(filename, 'utf8', (err, data) => {
  if (err) {
    throw err;
  }
  const hpgl = svg2hpgl(data, options);
  fs.writeFile(output, hpgl, err => {
    if (err) {
      throw err;
    }
    console.log('Saved to ' + output);
  });
});

function svg2hpgl(svg, settings) {
  // Clean off any preceding whitespace
  svg = svg.replace(/^[\n\r \t]/gm, '');
  settings = settings || {};
  settings.scale = settings.scale || 1;
  settings.pen = settings.pen || 2;
  settings.padding = settings.padding || 0;

  settings.offsetX = settings.offsetX || 0;
  settings.offsetY = settings.offsetY || 0;

  let paths = SVGReader.parse(svg, {}).allcolors;
  let hpgl, path;

  const bbox = Bounds(paths);
  const minX = bbox.minX;
  const maxX = bbox.maxX;
  const minY = bbox.minY;
  const maxY = bbox.maxY;

  if (settings.plotterWidth && settings.plotterHeight) {
    const plotterWidth = settings.plotterWidth - (2 * settings.padding);
    const plotterHeight = settings.plotterHeight - (2 * settings.padding);
    const artWidth = maxX - minX;
    const artHeight = maxY - minY;
    const plotterRatio = plotterWidth / plotterHeight;
    if (artWidth / artHeight > plotterRatio) {
      settings.scale = plotterWidth / artWidth;
    } else {
      settings.scale = plotterHeight / artHeight;
    }
    const newWidth = artWidth * settings.scale;
    const newHeight = artHeight * settings.scale;
    settings.offsetX = Math.floor((settings.plotterWidth - newWidth) / 2);
    settings.offsetY = Math.floor((settings.plotterHeight - newHeight) / 2);
    console.log({
      artWidth,
      artHeight,
      newWidth,
      newHeight
    });
  }

  // TODO maybe add a filtering step to get rid of "invisible" triangles
  if (settings.removeInvisiblePaths) {
    paths = paths.filter(function (path) {
      return path.stroke != "none";
    });
  }

  if (settings.flatten) {
    paths = Flatten(paths);
  }

  console.log({x: [minX, maxX], y: [minY, maxY]});
  console.log(settings);

  const scale = function (val) {
    return Math.floor(val * settings.scale);
  };

  hpgl = [
    'IN',
    'SP' + settings.pen
  ];

  if (settings.pressure) {
    hpgl.push('FS' + settings.pressure);
  }

  const isConnected = function (path1, path2) {
    return (path1[path1.length - 1].x === path2[0].x && path1[path1.length - 1].y === path2[0].y);
  };

  let lastCommand = '';

  const write = function (command, append = false) {
    if (lastCommand != command) {
      if (append) {
        hpgl[hpgl.length - 1] += command;
      } else {
        hpgl.push(command);
      }
      lastCommand = command;
    }
  };

  const hpglCoordinate = function (point) {
    return [
      scale(point.x - minX) + settings.offsetX,
      scale(point.y - minY) + settings.offsetY
    ].join(',');
  }

  for (let pathIdx = 0; pathIdx < paths.length; pathIdx++) {
    const connectedLines = (settings.connectLines && pathIdx != 0 && isConnected(paths[pathIdx - 1], paths[pathIdx]));

    path = paths[pathIdx];

    if (!connectedLines) {
      // Seek to index 0 with the pen up
      write('PU' + hpglCoordinate(path[0]));
    }

    // const segmentLength = path.length;

    if (settings.connectLines) {
      if (connectedLines) {
        path.shift();
        // path.shift();
        write(',', true);
      } else {
        write('PD');
      }
      write(path.map(function (segment) {
        return hpglCoordinate(segment)
      }).join(','), true);
    } else {
      for (let segmentIdx = 0; segmentIdx < path.length; segmentIdx++) {
        write('PD' + hpglCoordinate(path[segmentIdx]));
      }
    }
  }

  write('PU0,0');

  return hpgl.join('\n');
}

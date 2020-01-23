const ClipperLib = require('./clipper.js')

function flatten(paths) {
	var mask = [],
			output = [],
			solution_closed_paths,
			solution_lines,
			solution_paths,
			solution_polytree,
			succeeded,
			clipper,
			simplePath,
			total;
			
	
	// the svg is naturally sorted so that all the opaque white paths are written first
	// followed by the black lines which represent the wireframe. this loop should 
	// chunk all the paths together first, use those to 
	
	// top-most shape should be first after reversing
	
	const reversed = paths.slice(0) // .reverse();
	total = reversed.length;
	console.log(total);
	
	paths.slice(0).reverse().some(function(path, i) {
		simplePath = path.map(function(point) {
			return { X: point.x, Y: point.y };
		});
		
		/*
		[ { x: 960.0152, y: 568.5789 },
	  { x: 960.0152, y: 533.979 },
	  { x: 925.4152, y: 533.979 },
	  { x: 960.0152, y: 568.5789 },
	  node: { path: [ [Circular] ],
	    xform: [ 1, 0, 0, 1, 0, 0 ],
	    opacity: undefined,
	    display: undefined,
	    visibility: undefined,
	    fill: 'white',
	    stroke: 'none',
	    color: undefined,
	    fillOpacity: undefined,
	    strokeOpacity: undefined,
	    xformToWorld: [ 1, 0, 0, 1, 0, 0 ] },
	  bounds: { x: 925.4152,
	    y: 533.979,
	    x2: 960.0152,
	    y2: 568.5789,
	    area: 1267.3564399999984,
	    width: 35.60000000000002,
	    height: 35.599899999999934 } ]
		*/
		
		if (path.node.stroke === 'none' && path.node.fill === 'white') {
			// this path is an opaque fill shape.
			// take it and union it with mask, replacing mask with the result
			clipper = new ClipperLib.Clipper();
			clipper.AddPaths([mask], ClipperLib.PolyType.ptSubject, true);
			clipper.AddPaths([simplePath], ClipperLib.PolyType.ptClip, true);
			// solution_paths = new ClipperLib.Paths();
			solution_polytree = new ClipperLib.PolyTree();
			succeeded = clipper.Execute(
				ClipperLib.ClipType.ctUnion,
				solution_polytree,
				ClipperLib.PolyFillType.pftNonZero,
				ClipperLib.PolyFillType.pftNonZero
			);
			// solution_paths = ClipperLib.Clipper.PolyTreeToPaths(solution_polytree);
			solution_closed_paths = ClipperLib.Clipper.ClosedPathsFromPolyTree(solution_polytree);
			mask = solution_closed_paths;
		  console.log(mask, "-");
			// mask.push(simplePath);
		} else {
			// this is a black line.
			// take it, difference it with the mask and add the result to output
			clipper = new ClipperLib.Clipper();
			clipper.AddPaths([simplePath], ClipperLib.PolyType.ptSubject, false);
			clipper.AddPaths(mask, ClipperLib.PolyType.ptClip, true);
			solution_polytree = new ClipperLib.PolyTree();
			succeeded = clipper.Execute(
				ClipperLib.ClipType.ctDifference,
				solution_polytree,
				ClipperLib.PolyFillType.pftNonZero,
				ClipperLib.PolyFillType.pftNonZero
			);
	    solution_lines = ClipperLib.Clipper.OpenPathsFromPolyTree(solution_polytree);
			output = output.concat(solution_lines);
		}
		var percent = (i / total * 100).toFixed(1);
		if (i % 10 === 0) { console.log(percent); }
		return percent > 2;
	});
	
	return output.map(function(path) {
		return path.map(function(point) {
			return { x: point.X, y: point.Y };
		});
	});
}

module.exports = flatten

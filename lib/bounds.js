  function bounds(paths) {
  	let idx = paths.length;
  	let minX = Infinity;
  	let maxX = -Infinity;
  	let minY = Infinity;
  	let maxY = -Infinity;

  	while (idx--) {
  		let subidx = paths[idx].length;
  		const bounds = {x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity, area: 0};

  		// Find lower and upper bounds
  		while (subidx--) {
  			if (paths[idx][subidx].x < bounds.x) {
  				bounds.x = paths[idx][subidx].x;
  			}
  			if (paths[idx][subidx].x < minX) {
  				minX = paths[idx][subidx].x;
  			}

  			if (paths[idx][subidx].y < bounds.y) {
  				bounds.y = paths[idx][subidx].y;
  			}
  			if (paths[idx][subidx].y < minY) {
  				minY = paths[idx][subidx].y;
  			}

  			if (paths[idx][subidx].x > bounds.x2) {
  				bounds.x2 = paths[idx][subidx].x;
  			}
  			if (paths[idx][subidx].x > maxX) {
  				maxX = paths[idx][subidx].x;
  			}

  			if (paths[idx][subidx].y > bounds.y2) {
  				bounds.y2 = paths[idx][subidx].y;
  			}
  			if (paths[idx][subidx].y > maxY) {
  				maxY = paths[idx][subidx].y;
  			}
  		}

  		// Calculate area
  		bounds.width = 1 + bounds.x2 - bounds.x;
  		bounds.height = 1 + bounds.y2 - bounds.y;
  		bounds.area = bounds.width * bounds.height;
  		paths[idx].bounds = bounds;
  	}
    
    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
  }
  
  module.exports = bounds;

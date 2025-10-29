import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const titleNum = document.querySelector('.projects-title');
titleNum.textContent = `${projects.length} Projects`;

//////////////////////////////////// working with d3 ////////////////////////////////////////////

// create circle using arc 
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let arc = arcGenerator({
  startAngle: 0,
  endAngle: 2 * Math.PI,
})

// attr 'd': successive coordinates that the path must go through ==> arc defined variable
// attr 'fill': style color of svg element in html file
d3.select('svg').append('path').attr('d', arc).attr('fill', 'red');
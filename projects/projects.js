import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const titleNum = document.querySelector('.projects-title');
titleNum.textContent = `${projects.length} Projects`;

let rolledData = d3.rollups(
  projects,
  (v) => v.length,
  (d) => d.year,
);

//////////////////////////////////// working with d3 ////////////////////////////////////////////
// create pie chart 

// function that takes data and returns a path string
// creates path for pie slices 
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

/* 
path is how we define svg element 
attr 'd': successive coordinates that the path must go through ==> arc defined variable
attr 'fill': style color of svg element in html file
d3.select('svg').append('path').attr('d', arc).attr('fill', 'red');
*/

let data = rolledData.map(([year, count]) => {
  return { value: count, label: year };
});

// function takes an array of data values and returns an array of objects, represents a slice of the pie and contains the start and end angles for it
let sliceGenerator = d3.pie().value((d) => d.value);  // tell it how to access the values in our data 
let arcData = sliceGenerator(data);
let arcs = arcData.map((d) => arcGenerator(d)); // feed these objects to our arcGenerator() to create the paths for the slices

// lets change the colors of our slices in the pie
let colors = d3.scaleOrdinal(d3.schemeTableau10);
arcs.forEach((arc, idx) => {
    d3.select('svg')
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx)) // colors is now a function that takes an index and returns a color
});

let legend = d3.select('.legend');
data.forEach((d, idx) => {
  legend
    .append('li')
    .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
    .attr('class', 'swatch-list')
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
});

let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  // update query value
  query = event.target.value;

  // filter the projects
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // TODO: render updated projects!
  renderProjects(filteredProjects, projectsContainer, 'h2');
});




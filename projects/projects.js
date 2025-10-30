import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const titleNum = document.querySelector('.projects-title');
titleNum.textContent = `${projects.length} Projects`;

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

/*
let data = rolledData.map(([year, count]) => {
  return { value: count, label: year };
});

// function takes an array of data values and returns an array of objects, represents a slice of the pie and contains the start and end angles for it
let sliceGenerator = d3.pie().value((d) => d.value);  // tell it how to access the values in our data 
let arcData = sliceGenerator(data);
let arcs = arcData.map((d) => arcGenerator(d)); // feed these objects to our arcGenerator() to create the paths for the slices
*/

/*
// create arc dimensions
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
*/

let colors = d3.scaleOrdinal(d3.schemeTableau10);

function renderPieChart(projectsGiven) {
  // re-calculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  // re-calculate data
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year }; // TODO
  });
  // re-calculate slice generator, arc data, arc, etc.
  let newSliceGenerator = d3.pie().value((d) => d.value);;
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  // TODO: clear up paths and legends
  let newSVG = d3.select('svg');
  newSVG.selectAll('path').remove();
  let newlegend = d3.select('.legend');
  newlegend.selectAll('li').remove();

  // update paths and legends, refer to steps 1.4 and 2.2
  newArcs.forEach((arc, idx) => {
    newSVG
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx)) // colors is now a function that takes an index and returns a color
  });

  newData.forEach((d, idx) => {
    newlegend
      .append('li')
      .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
      .attr('class', 'swatch-list')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
});
}

// Call this function on page load
renderPieChart(projects);

let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // re-render legends and pie chart when event triggers
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});

let selectedIndex = -1;
let svg = d3.select('svg');
svg.selectAll('path').remove();

arcs.forEach((arc, i) => {
  svg
    .append('path')
    .attr('d', arc)
    .attr('fill', colors(i))
    .on('click', () => {
      selectedIndex = selectedIndex === i ? -1 : i;

      svg
        .selectAll('path')
        .attr('class', (_, idx) => {
          return `slice ${idx === selectedIndex ? 'selected' : ''}`.trim();
        });

      legend
        .selectAll('li')
        .attr('class', (_, idx) => {
          return `slice ${idx === selectedIndex ? 'selected' : ''}`.trim();
        });
    });
});




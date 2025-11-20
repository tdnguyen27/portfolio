import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

let xScale;
let yScale;

let commitProgress = 100;                                       // 🔴 New 

let data = await loadData();
let commits = processCommits(data);

// Will get updated as user changes slider
let filteredCommits = commits;                                  // 🔴 New 

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

function renderCommitInfo(data, commits) {
  const formatDecimal = d3.format(".2f");
  // Create the dl element
  // const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  const container = d3.select('#stats')
    .attr('class', 'summary-card');      // add class to the outer div

  container.append('h2').text('Summary');

  const dl = container.append('dl').attr('class', 'stats');

  // Add total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Add total commits
  dl.append('dt').text('Total Commits');
  dl.append('dd').text(commits.length);

  dl.append('dt').text('Number of Files');
  dl.append('dd').text(d3.group(data, d => d.file).size);

  dl.append('dt').text('Average Depth');
  dl.append('dd').text(formatDecimal(d3.mean(data, d => d.depth)));

  // Add avg file length 
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (v) => v.line),
    (d) => d.file);

  const averageFileLength = formatDecimal(d3.mean(fileLengths, (d) => d[1]));
  dl.append('dt').text('Average File Length');
  dl.append('dd').text(averageFileLength);

  // add time of day most work is done 
  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }),
    );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  dl.append('dt').text('Most Commonly Works')
  dl.append('dd').text(maxPeriod)
}

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // CHANGE: instead of creating a new svg element, we'll select the existing one.
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('id', 'chart-svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // CHANGE: we don't need to create a new xScale, we can just update the existing one.
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  // REMOVE: the yScale doesn't change when the user changes the slider
  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([7, 22]); // adjust these values based on your experimentation

  const xAxis = d3.axisBottom(xScale);

  // REMOVE: the yAxis doesn't change when the user changes the slider
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // REMOVE: the gridlines don't change when the user changes the slider
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width),
  );

  // CHANGE: we should clear out the existing xAxis and then create a new one.
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis') // new line to mark the g tag
    .call(xAxis);

  // REMOVE: the yAxis doesn't change when the user changes the slider
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis') // just for consistency
    .call(yAxis);

  // CHANGE: we shouldn't need to create a new dots group, we can just select the existing one.
  const dots = svg.append('g').attr('class', 'dots');

  // KEEP: This code already updates existing dots.
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id) // 🔴 New
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // REMOVE: the brush selector doesn't change when the user changes the slider
  createBrushSelector(svg);
}

function updateScatterPlot(data, commits) {         // visualize our edits 
  const width = 1000; // svg element size 
  const height = 600;

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');                        // 🔴 New 

  // d3.extent : find the minimum and maximum date in one go
  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));        // 🔴 New 

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([7, 22]); 

  const xAxis = d3.axisBottom(xScale);

  // Create the axes
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');;
  // (-) sign creates descending order --> larger dots rendered first, smaller dots drawn on top
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id) // 🔴 New
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: true,        // allows changing ret.lines later if needed
        configurable: true,    // allows redefining or deleting the property
        enumerable: false      // makes it HIDDEN when iterating or printing
      });

      return ret;
    });
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function createBrushSelector(svg) {
  svg.call(d3.brush().on('start brush end', brushed));
  // Raise dots and everything after overlay
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) {
    return false;
  }
  const [x0, x1] = selection.map((d) => d[0]); 
  const [y0, y1] = selection.map((d) => d[1]); 
  const x = xScale(commit.datetime); 
  const y = yScale(commit.hourFrac); 
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines</dd>
            <dd>(${formatted})</dd>
        `;
  }
}

/***************************** Narrative Visualization *******************************/
let colors = d3.scaleOrdinal(d3.schemeTableau10);

let timeScale = d3                                      // converts position to datetime 
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress);   // commitProgress is the slider position 

const commitSlider = document.getElementById('commit-progress');
const commitTimeEl = document.getElementById('commit-time');

function onTimeSliderChange(event) {
  // 1. Update commitProgress to the slider value (0–100)
  commitProgress = Number(event.target.value);

  // 2. Convert slider value → Date using the scale's invert
  commitMaxTime = timeScale.invert(commitProgress);

  // 3. Update the <time> element text
  commitTimeEl.textContent = commitMaxTime.toLocaleString('en', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  /* 
    filter commits by comparing commit.datetime with commitMaxTime and only 
    keep those that are less than commitMaxTime
  */
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  // 🔑 Update the scatter plot with filtered commits
  updateScatterPlot(data, filteredCommits);

  updateFileDisplay(filteredCommits);
}

// Attach event listener
commitSlider.addEventListener('input', onTimeSliderChange);

// Call once on page load to show initial time
onTimeSliderChange({ target: commitSlider });

/*
  visualization that shows the relative size of each file in 
  the codebase in lines of code, as well as the type and 
  age of each line.
*/


function updateFileDisplay(filteredCommits) {
  // after initializing filteredCommits
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    })
    .sort((a, b) => b.lines.length - a.lines.length);

  let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join(
      // This code only runs when the div is initially rendered
      (enter) =>
        enter.append('div').call((div) => {
          const dt = div.append('dt')
          dt.append('code'); // file name
          dt.append('small'); // total lines 
          div.append('dd'); // dots container 
        }),
    );

  // This code updates the div info
  filesContainer.select('dt > code').text((d) => d.name);
  filesContainer.select('dt > small').text((d) => `${d.lines.length} lines`);
  filesContainer.select('dd').text('');

  // append one div for each line
  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', (d) => `--color: ${colors(d.type)}`);
}

d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
  );

function onStepEnter(response) {
  // Each .step div has its commit bound as __data__
  const element = response.element;
  const commit = element.__data__;
  if (!commit) return;

  // 1. Use this commit's datetime as the new "max time"
  commitMaxTime = commit.datetime;

  // 2. Keep the slider + <time> display in sync
  commitProgress = timeScale(commitMaxTime);   // maps Date -> [0, 100]
  commitSlider.value = commitProgress;

  commitTimeEl.textContent = commitMaxTime.toLocaleString('en', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  // 3. Filter commits up to this commit's time
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  // 4. Update scatterplot + file visualization
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
}

const scroller = scrollama();
scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
  })
  .onStepEnter(onStepEnter);
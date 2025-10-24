////////////////////////////// Lab 3 ///////////////////////////////////////////

console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

////////////////////////////// Step 3: Nav tag /////////////////////////////////
let pages = [ // create array of dictionary for url link and label 
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact'},
  { url: 'CV/', title: 'Cover Letter'},
  { url: 'https://github.com/tdnguyen27', title: 'GitHub Page'}
];

// create nav element and append to beginning of body 
let nav = document.createElement('nav');
document.body.prepend(nav);

// create a links for the nav element 
for (let p of pages) {
  const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/website/";         // GitHub Pages repo name

  let url = p.url;
  url = !url.startsWith('http') ? BASE_PATH + url : url;
  let title = p.title;

  // element.insertAdjacentHTML('position', 'input')
  // nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  nav.append(a);

  // apply CSS style sheet to .current class 
  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
  } else if (a.host !== location.host) {
    a.target = "_blank";
  };
  
}


///////////////////////////// Step 4: Dark Mode /////////////////////////////
document.body.insertAdjacentHTML(
  'afterbegin',
  `
    <label class="color-scheme">
      Theme:
      <select>
        <option value='light dark'>Automatic</option>
        <option value='light'>Light</option>
        <option value='dark'>Dark</option>
      </select>
    </label>`,
);

let select = document.querySelector('label.color-scheme select');

if ('colorScheme' in localStorage) {
  let usersaved = localStorage.getItem('colorScheme');
  select.value = usersaved;
  document.documentElement.style.setProperty('color-scheme', select.value);
}

select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  document.documentElement.style.setProperty('color-scheme', event.target.value);
  localStorage.colorScheme = event.target.value;
});

/////////////////////////////////////////////// Lab 4 /////////////////////////////////////////////////
// file to load project data from a JSON file and dynamically display it on the Projects page

// in case url fail to get project url 
export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    };
    console.log(response);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

// create render func to dynamically generate and display project content
// project object, containerElement where project will be displayed 
export function renderProjects(project, containerElement, headingLevel = 'h2') {
  // clear prior existing content in container
  containerElement.innerHTML = '';

  for (current in project) {
    const article = document.createElement('article');

    article.innerHTML = `
    <h3>${current.title}</h3>
    <img src="${current.image}" alt="${current.title}">
    <p>${current.description}</p>
    `;

    containerElement.appendChild(article);
    // Ensure containerElement is a valid DOM element in your tests
    // expect(containerElement).toBeInstanceOf(HTMLElement);
  }
}


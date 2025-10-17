////////////////////////////// Lab 3 ///////////////////////////////////////////

console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

////////////////////////////// Step 2 /////////////////////////////////////////
// navLinks = $$("nav a");
// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );
// currentLink?.classList.add('current');


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



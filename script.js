const GITHUB_USER = 'fitzypopper';

// ======================== LANGUAGE COLORS ========================
const LANG_COLORS = {
  Python: '#3572A5',
  Java: '#b07219',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Bash: '#89e051',
  'C++': '#f34b7d',
  C: '#555555',
  Rust: '#dea584',
  Go: '#00ADD8',
  Lua: '#000080',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Dart: '#00B4AB',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Makefile: '#427819',
  Dockerfile: '#384d54',
  'Batch File': '#C1F12E',
  JSON: '#292929',
  YAML: '#cb171e',
  Markdown: '#083fa1',
  VimScript: '#199f4b',
  Assembly: '#6E4C13',
  Zsh: '#120010',
};

function getColor(lang) {
  return LANG_COLORS[lang] || '#8b949e';
}

// ======================== FETCH REPOS ========================
async function fetchRepos() {
  const grid = document.getElementById('projects-grid');
  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated&direction=desc`
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const repos = await res.json();

    // Update repo count
    document.getElementById('repo-count').textContent = repos.length;

    // Filter: skip forks and fully archived unless they have stars
    const visible = repos.filter(
      (r) => !r.fork && (!r.archived || r.stargazers_count > 0)
    );

    if (visible.length === 0) {
      grid.innerHTML = '<p class="loading-spinner">No public repos yet.</p>';
      return;
    }

    grid.innerHTML = '';
    visible.forEach((repo) => {
      const card = document.createElement('div');
      card.className = 'project-card';

      const archivedBadge = repo.archived
        ? '<span class="project-archived">Archived</span>'
        : '';

      card.innerHTML = `
        <div class="project-header">
          <span class="project-name">
            <a href="${repo.html_url}" target="_blank" rel="noopener">${repo.name}</a>
          </span>
          ${archivedBadge}
        </div>
        <p class="project-desc">${repo.description || '<em>No description</em>'}</p>
        <div class="project-meta">
          ${
            repo.language
              ? `<span><span class="project-lang-dot" style="background:${getColor(repo.language)}"></span>${repo.language}</span>`
              : ''
          }
          <span>&#9733; ${repo.stargazers_count}</span>
          <span>&#9741; ${repo.forks_count}</span>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p class="loading-spinner">Failed to load repos. <a href="https://github.com/${GITHUB_USER}" target="_blank">View on GitHub</a></p>`;
    console.error(err);
  }
}

// ======================== MOBILE NAV ========================
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  toggle.addEventListener('click', () => {
    links.classList.toggle('active');
  });

  // Close on link click
  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => links.classList.remove('active'));
  });
}

// ======================== NAVBAR SCROLL ========================
function initScrollNav() {
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    if (current > 80) {
      navbar.style.boxShadow = '0 1px 12px rgba(0,0,0,0.4)';
    } else {
      navbar.style.boxShadow = 'none';
    }
    lastScroll = current;
  });
}

// ======================== SKILL BARS ========================
function initSkillBars() {
  const fills = document.querySelectorAll('.skill-fill');
  fills.forEach((el) => {
    el.style.setProperty('--level', el.dataset.level);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const bars = entry.target.querySelectorAll('.skill-fill');
          bars.forEach((bar, i) => {
            setTimeout(() => bar.classList.add('animated'), i * 80);
          });
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll('.skill-category').forEach((cat) => observer.observe(cat));
}

// ======================== INIT ========================
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollNav();
  initSkillBars();
  fetchRepos();
});

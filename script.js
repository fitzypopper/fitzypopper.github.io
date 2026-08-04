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

function getPagesUrl(repo) {
  if (!repo.has_pages) return null;
  const base = 'https://fitzypopper.dpdns.org';
  return repo.name === 'fitzypopper.github.io' ? `${base}/` : `${base}/${repo.name}/`;
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
          ${
            getPagesUrl(repo)
              ? `<span class="project-pages"><a href="${getPagesUrl(repo)}" target="_blank" rel="noopener">&#128279; Live</a></span>`
              : ''
          }
          <span>&#9733; ${repo.stargazers_count}</span>
          <span>&#9741; ${repo.forks_count}</span>
        </div>
      `;
      grid.appendChild(card);
    });
    initRepoWeb(visible);
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

// ======================== REPO WEB ========================
function initRepoWeb(repos) {
  const container = document.getElementById('web-graph');
  if (!container || typeof d3 === 'undefined') return;

  container.innerHTML = '';

  const width = container.clientWidth;
  const height = container.clientHeight;

  const nodes = [
    {
      id: 'center',
      name: 'fitzypopper',
      url: 'https://github.com/fitzypopper',
      lang: null,
      isCenter: true,
      desc: 'Portfolio & GitHub root',
    },
  ];
  repos.forEach((repo) => {
    nodes.push({
      id: repo.full_name,
      name: repo.name,
      url: getPagesUrl(repo) || repo.html_url,
      lang: repo.language,
      hasPages: !!getPagesUrl(repo),
      desc: repo.description || '',
      stars: repo.stargazers_count,
    });
  });

  const links = nodes
    .filter((n) => !n.isCenter)
    .map((n) => ({ source: 'center', target: n.id }));

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height]);

  const g = svg.append('g');

  const link = g
    .append('g')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke', '#30363d')
    .attr('stroke-opacity', 0.7);

  const node = g
    .append('g')
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('r', (n) => (n.isCenter ? 18 : 9 + Math.min(8, Math.log2(1 + n.stars))))
    .attr('fill', (n) => (n.isCenter ? '#7ee787' : getColor(n.lang)))
    .attr('stroke', '#0d1117')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer');

  const labels = g
    .append('g')
    .selectAll('text')
    .data(nodes)
    .join('text')
    .text((n) => n.name)
    .attr('fill', '#8b949e')
    .attr('font-size', '11px')
    .attr('text-anchor', 'middle')
    .style('pointer-events', 'none');

  const tooltip = d3
    .select(container)
    .append('div')
    .attr('class', 'web-tooltip')
    .style('opacity', 0);

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3.forceLink(links).id((d) => d.id).distance(120).strength(0.35)
    )
    .force('charge', d3.forceManyBody().strength(-380))
    .force('collide', d3.forceCollide().radius(26))
    .force('x', d3.forceX(width / 2).strength(0.08))
    .force('y', d3.forceY(height / 2).strength(0.08));

  simulation.on('tick', () => {
    link
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);
    node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
    labels
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y + (d.isCenter ? 32 : 17));
  });

  node
    .on('mouseover', (event, d) => {
      tooltip
        .html(
          `<strong>${d.name}</strong>` +
            (d.lang ? ` <span class="tooltip-lang">${d.lang}</span>` : '') +
            (d.hasPages ? ' <span class="tooltip-live">Live</span>' : '') +
            `<br/><small>${d.desc || d.url}</small>`
        )
        .style('left', event.pageX + 12 + 'px')
        .style('top', event.pageY - 30 + 'px')
        .style('opacity', 1);
    })
    .on('mouseout', () => tooltip.style('opacity', 0))
    .on('click', (event, d) => window.open(d.url, '_blank'));

  node.call(
    d3
      .drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.sourceEvent.stopPropagation();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      })
  );

  svg.call(
    d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => g.attr('transform', event.transform))
  );
}

// ======================== INIT ========================
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollNav();
  initSkillBars();
  fetchRepos();
});

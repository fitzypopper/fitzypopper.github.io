const GITHUB_USER = 'fitzypopper';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function cacheSet(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}
const FEATURED_REPOS = [
  { name: 'ChatCPU', tag: 'Cpu emulator' },
  { name: 'fitzypopper.github.io', tag: 'Portfolio (You are here)' },
  { name: 'blog', tag: 'Rants mostly' },
];

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

// ======================== FETCH FEATURED ========================
async function fetchFeatured() {
  const grid = document.getElementById('featured-grid');
  try {
    const cacheKey = 'featured';
    let data = cacheGet(cacheKey);
    if (!data) {
      data = await Promise.all(
        FEATURED_REPOS.map(async (f) => {
          const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${f.name}`);
          if (!res.ok) return null;
          const repo = await res.json();
          return { ...f, repo };
        })
      );
      cacheSet(cacheKey, data);
    }

    grid.innerHTML = '';
    data.filter(Boolean).forEach(({ name, tag, repo }) => {
      const pagesUrl = getPagesUrl(repo);
      const card = document.createElement('a');
      card.className = 'featured-card';
      card.href = pagesUrl || repo.html_url;
      card.target = '_blank';
      card.rel = 'noopener';
      card.innerHTML = `
        <h3>${repo.name}</h3>
        <p>${repo.description || '<em>No description</em>'}</p>
        <span class="featured-tag">${tag}</span>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = '<p class="loading-spinner">Failed to load featured repos.</p>';
    console.error(err);
  }
}

// ======================== FETCH REPOS ========================
async function fetchRepos() {
  const grid = document.getElementById('projects-grid');
  try {
    const cacheKey = `repos_${GITHUB_USER}`;
    let repos = cacheGet(cacheKey);
    if (!repos) {
      const res = await fetch(
        `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated&direction=desc`
      );
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      repos = await res.json();
      cacheSet(cacheKey, repos);
    }

    document.getElementById('repo-count').textContent = repos.length;

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
const FOLLOWED_USERS = [
  'fitzypopper',
  'face-hh',
  'rooootdev',
  'Ahmadv999',
];

const USER_COLORS = [
  '#7ee787', // green (you)
  '#79c0ff', // blue
  '#d2a8ff', // purple
  '#ffa657', // orange
  '#ff7b72', // red
  '#a5d6ff', // light blue
  '#f778ba', // pink
  '#56d364', // mint
];

function getUserColor(index) {
  return USER_COLORS[index % USER_COLORS.length];
}

async function fetchAllRepos() {
  const cacheKey = 'repos_all';
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const allRepos = [];
  for (const user of FOLLOWED_USERS) {
    try {
      const res = await fetch(
        `https://api.github.com/users/${user}/repos?per_page=100&sort=updated&direction=desc`
      );
      if (!res.ok) continue;
      const repos = await res.json();
      repos.forEach((r) => { r._owner = user; });
      allRepos.push(...repos);
    } catch (e) {
      console.error(`Failed to fetch repos for ${user}`, e);
    }
  }
  cacheSet(cacheKey, allRepos);
  return allRepos;
}

async function fetchContributors(owner, repo) {
  const cacheKey = `contrib_${owner}_${repo}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=30`
    );
    if (!res.ok) return [];
    const data = await res.json();
    cacheSet(cacheKey, data);
    return data;
  } catch {
    return [];
  }
}

async function initRepoWeb() {
  const container = document.getElementById('web-graph');
  if (!container || typeof d3 === 'undefined') return;

  container.innerHTML = '<div class="loading-spinner">Loading web...</div>';

  const allRepos = await fetchAllRepos();

  const visible = allRepos.filter(
    (r) => !r.fork && (!r.archived || r.stargazers_count > 0)
  );

  // Owner center nodes
  const ownerNodes = {};
  FOLLOWED_USERS.forEach((user, i) => {
    ownerNodes[user] = {
      id: user,
      name: user,
      url: `https://github.com/${user}`,
      isCenter: true,
      color: getUserColor(i),
    };
  });

  // Repo nodes
  const repoNodes = visible.map((repo) => ({
    id: repo.full_name,
    name: repo.name,
    url: getPagesUrl(repo) || repo.html_url,
    lang: repo.language,
    hasPages: !!getPagesUrl(repo),
    desc: repo.description || '',
    stars: repo.stargazers_count,
    owner: repo._owner,
    color: getUserColor(FOLLOWED_USERS.indexOf(repo._owner)),
  }));

  const nodes = [...Object.values(ownerNodes), ...repoNodes];

  // Links: repos to their owner
  const links = repoNodes.map((r) => ({
    source: r.owner,
    target: r.id,
    type: 'owner',
  }));

  // Fetch contributors and link repos to followed users who contributed
  const starredRepos = visible.filter((r) => r.stargazers_count > 0).slice(0, 20);

  await Promise.all(
    starredRepos.map(async (repo) => {
      const contribs = await fetchContributors(repo._owner, repo.name);
      const contribNames = contribs.map((c) => c.login);

      FOLLOWED_USERS.forEach((user) => {
        if (user !== repo._owner && contribNames.includes(user)) {
          links.push({
            source: user,
            target: repo.full_name,
            type: 'contributor',
          });
        }
      });
    })
  );

  container.innerHTML = '';
  const width = container.clientWidth;
  const height = container.clientHeight;

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
    .attr('stroke', (d) => d.type === 'contributor' ? '#d2a8ff' : '#30363d')
    .attr('stroke-opacity', (d) => d.type === 'contributor' ? 0.6 : 0.7)
    .attr('stroke-width', (d) => d.type === 'contributor' ? 1.5 : 1)
    .attr('stroke-dasharray', (d) => d.type === 'contributor' ? '6,3' : 'none');

  const node = g
    .append('g')
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('r', (n) => (n.isCenter ? 16 : 7 + Math.min(7, Math.log2(1 + (n.stars || 0)))))
    .attr('fill', (n) => n.color || '#8b949e')
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
      d3.forceLink(links).id((d) => d.id).distance(100).strength(0.3)
    )
    .force('charge', d3.forceManyBody().strength(-300))
    .force('collide', d3.forceCollide().radius(24))
    .force('x', d3.forceX(width / 2).strength(0.06))
    .force('y', d3.forceY(height / 2).strength(0.06));

  simulation.on('tick', () => {
    link
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);
    node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
    labels
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y + (d.isCenter ? 30 : 16));
  });

  node
    .on('mouseover', (event, d) => {
      tooltip
        .html(
          `<strong>${d.name}</strong>` +
            (d.lang ? ` <span class="tooltip-lang">${d.lang}</span>` : '') +
            (d.hasPages ? ' <span class="tooltip-live">Live</span>' : '') +
            (d.isCenter ? '' : `<br/><small>${d.desc || d.url}</small>`)
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

// ======================== FETCH BLOG ========================
async function fetchBlog() {
  const grid = document.getElementById('blog-grid');
  try {
    const cacheKey = 'blog_posts';
    let posts = cacheGet(cacheKey);
    if (!posts) {
      // Try RSS feed first (no rate limit)
      const feedRes = await fetch('https://fitzypopper.dpdns.org/blog/feed.xml');
      if (feedRes.ok) {
        const text = await feedRes.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/xml');
        const items = doc.querySelectorAll('item');
        posts = Array.from(items).slice(0, 3).map((item) => ({
          title: item.querySelector('title')?.textContent || 'Untitled',
          url: item.querySelector('link')?.textContent || '#',
          date: new Date(item.querySelector('pubDate')?.textContent || '').toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          }),
        }));
        cacheSet(cacheKey, posts);
      } else {
        // Fallback to GitHub API
        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_USER}/blog/contents/_posts`
        );
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        const files = await res.json();
        posts = files
          .filter((f) => f.name.endsWith('.md') || f.name.endsWith('.markdown'))
          .sort((a, b) => b.name.localeCompare(a.name))
          .slice(0, 3)
          .map((f) => {
            const match = f.name.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.(md|markdown)$/);
            if (!match) return null;
            const [, year, month, day, slug] = match;
            return {
              title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              url: `https://fitzypopper.dpdns.org/blog/${year}/${month}/${day}/${slug}/`,
              date: new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              }),
            };
          })
          .filter(Boolean);
        cacheSet(cacheKey, posts);
      }
    }

    if (!posts || posts.length === 0) {
      grid.innerHTML = '<p class="loading-spinner">No posts yet.</p>';
      return;
    }

    grid.innerHTML = '';
    posts.forEach((post) => {
      const card = document.createElement('a');
      card.className = 'blog-card';
      card.href = post.url;
      card.target = '_blank';
      card.rel = 'noopener';
      card.innerHTML = `
        <span class="blog-card-title">${post.title}</span>
        <span class="blog-card-date">${post.date}</span>
        <span class="blog-card-excerpt">Read post &rarr;</span>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p class="loading-spinner">Failed to load posts. <a href="https://fitzypopper.dpdns.org/blog/" target="_blank">Visit blog</a></p>`;
    console.error(err);
  }
}

// ======================== RICKROLL ========================
function initRickroll() {
  const toggle = document.getElementById('theme-toggle');
  const overlay = document.getElementById('rickroll-overlay');
  const close = document.getElementById('rickroll-close');
  const video = document.getElementById('rickroll-video');

  toggle.addEventListener('click', () => {
    overlay.classList.add('active');
    video.muted = false;
    video.play();
  });

  close.addEventListener('click', () => {
    overlay.classList.remove('active');
    video.muted = true;
    video.pause();
    video.currentTime = 0;
  });
}

// ======================== EASTER EGGS ========================
function initEasterEggs() {
  const msg = document.getElementById('easter-egg-msg');

  function showMsg(text) {
    msg.textContent = text;
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 3000);
  }

  // Konami code
  const konamiCode = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];
  let konamiIndex = 0;

  // Type buffer for word triggers
  let typeBuffer = '';

  document.addEventListener('keydown', (e) => {
    // Konami code
    if (e.key === konamiCode[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        showMsg('You found the Konami Code! +30 lives (you still die)');
        document.body.style.transition = 'transform 0.5s';
        document.body.style.transform = 'rotate(360deg)';
        setTimeout(() => {
          document.body.style.transform = '';
          document.body.style.transition = '';
        }, 600);
        konamiIndex = 0;
        return;
      }
    } else {
      konamiIndex = 0;
    }

    // Word triggers
    typeBuffer += e.key.toLowerCase();
    if (typeBuffer.length > 20) typeBuffer = typeBuffer.slice(-20);

    if (typeBuffer.includes('cool')) {
      showMsg("You're pretty cool yourself.");
      typeBuffer = '';
    } else if (typeBuffer.includes('sudo')) {
      showMsg("Nice try. You're not root here.");
      typeBuffer = '';
    } else if (typeBuffer.includes('hello there')) {
      showMsg('General Kenobi!');
      typeBuffer = '';
    } else if (typeBuffer.includes('42')) {
      showMsg('The Answer to Life, the Universe, and Everything.');
      typeBuffer = '';
    } else if (typeBuffer.includes('party')) {
      showMsg('its party time');
      confetti();
      typeBuffer = '';
    } else if (typeBuffer.includes('rm -rf')) {
      showMsg("I'm watching you.");
      typeBuffer = '';
    } else if (typeBuffer.includes('help')) {
      showMsg('Easter eggs: type cool, sudo, hello there, 42, party, rm -rf');
      typeBuffer = '';
    }
  });

  // Click hero name 5 times
  let nameClicks = 0;
  const heroName = document.querySelector('.hero-name');
  if (heroName) {
    heroName.style.cursor = 'pointer';
    heroName.addEventListener('click', () => {
      nameClicks++;
      if (nameClicks === 5) {
        showMsg('ok stop clicking me');
        nameClicks = 0;
      }
    });
  }

  // Click footer 10 times for power user mode
  let footerClicks = 0;
  const footer = document.querySelector('footer');
  if (footer) {
    footer.style.cursor = 'pointer';
    footer.addEventListener('click', () => {
      footerClicks++;
      if (footerClicks === 10) {
        document.body.classList.toggle('power-user');
        showMsg(document.body.classList.contains('power-user') ? 'Power user mode ON' : 'Power user mode OFF');
        footerClicks = 0;
      }
    });
  }

  // Scroll really fast - shake the page + reveal secret section
  let lastScroll = 0;
  let scrollSpeed = 0;
  let fastScrollCount = 0;
  const secretSection = document.getElementById('secret-section');
  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    scrollSpeed = Math.abs(current - lastScroll);
    lastScroll = current;
    if (scrollSpeed > 150) {
      document.body.style.transition = 'transform 0.1s';
      document.body.style.transform = `rotate(${(Math.random() - 0.5) * 2}deg)`;
      setTimeout(() => { document.body.style.transform = ''; }, 100);
      fastScrollCount++;
      if (fastScrollCount >= 5 && secretSection) {
        secretSection.classList.add('revealed');
        showMsg('You found the secret section!');
        fastScrollCount = -999;
      }
    }
  });

  // Tab switch detector
  let tabMsgShown = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !tabMsgShown) {
      tabMsgShown = true;
    } else if (!document.hidden && tabMsgShown) {
      showMsg('Welcome back. We missed you.');
      tabMsgShown = false;
    }
  });

  // "Are you still reading?" - shows after 2 min idle on about
  let idleTimer = null;
  const aboutSection = document.getElementById('about');
  if (aboutSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          idleTimer = setTimeout(() => {
            showMsg('Are you still reading? Go touch some grass.');
          }, 120000);
        } else {
          clearTimeout(idleTimer);
        }
      });
    }, { threshold: 0.5 });
    observer.observe(aboutSection);
  }
}

// Confetti burst
function confetti() {
  for (let i = 0; i < 50; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed;
      top: -10px;
      left: ${Math.random() * 100}vw;
      width: ${6 + Math.random() * 6}px;
      height: ${6 + Math.random() * 6}px;
      background: hsl(${Math.random() * 360}, 80%, 60%);
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      z-index: 99999;
      pointer-events: none;
      animation: confetti-fall ${1 + Math.random() * 2}s linear forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

// Inject confetti keyframes
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
  @keyframes confetti-fall {
    to {
      transform: translateY(110vh) rotate(${360 + Math.random() * 720}deg);
      opacity: 0;
    }
  }
  .power-user .section-title::after {
    content: ' [PRO]';
    color: var(--accent);
    font-size: 0.5em;
  }
`;
document.head.appendChild(confettiStyle);

// ======================== INIT ========================
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollNav();
  initSkillBars();
  initRickroll();
  initEasterEggs();
  fetchFeatured();
  fetchBlog();
  fetchRepos();
  initRepoWeb();
});

/**
 * Wooyeon Video Studio & Archive
 * Interactive Data Dashboard & Player
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure data exists
  if (typeof VIDEOS_DATA === 'undefined') {
    console.error('VIDEOS_DATA is not loaded.');
    return;
  }

  // App State
  const state = {
    videos: [...VIDEOS_DATA],
    currentList: [],
    sortBy: 'views', // 'views' | 'likes' | 'comments' | 'date'
    sortOrder: 'desc', // 'desc' | 'asc'
    filterTag: 'all',
    searchQuery: '',
    viewMode: 'grid', // 'grid' | 'table'
    activeModalVideoIndex: -1,
    bookmarks: new Set(JSON.parse(localStorage.getItem('wooyeon_bookmarks') || '[]'))
  };

  // DOM Elements
  const statsElements = {
    totalVideos: document.getElementById('statTotalVideos'),
    totalViews: document.getElementById('statTotalViews'),
    totalLikes: document.getElementById('statTotalLikes'),
    totalComments: document.getElementById('statTotalComments')
  };

  const videosGrid = document.getElementById('videosGrid');
  const tableViewContainer = document.getElementById('tableViewContainer');
  const videosTableBody = document.getElementById('videosTableBody');
  const emptyState = document.getElementById('emptyState');
  const resultsCount = document.getElementById('resultsCount');
  const searchInput = document.getElementById('searchInput');
  const sortTabs = document.querySelectorAll('.sort-btn');
  const filterChips = document.querySelectorAll('.filter-chip');
  const viewGridBtn = document.getElementById('viewGridBtn');
  const viewTableBtn = document.getElementById('viewTableBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');

  // Modal Elements
  const modalBackdrop = document.getElementById('videoModal');
  const modalIframe = document.getElementById('modalIframe');
  const modalVideoTitle = document.getElementById('modalVideoTitle');
  const modalViews = document.getElementById('modalViews');
  const modalLikes = document.getElementById('modalLikes');
  const modalComments = document.getElementById('modalComments');
  const modalDate = document.getElementById('modalDate');
  const modalYoutubeLink = document.getElementById('modalYoutubeLink');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnPrevVideo = document.getElementById('btnPrevVideo');
  const btnNextVideo = document.getElementById('btnNextVideo');

  // Format numbers (e.g., 2,840,437)
  const formatNum = (num) => Number(num).toLocaleString('ko-KR');

  // Format Date (e.g. 2026.10.21)
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString.slice(0, 10);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  // Check if video is short/reel
  const isShorts = (video) => {
    const t = video.title.toLowerCase();
    return t.includes('#쇼츠') || t.includes('#shorts') || t.includes('#릴스') || t.includes('#reels');
  };

  // Init Stats
  const initStats = () => {
    if (typeof STATS_DATA !== 'undefined') {
      statsElements.totalVideos.textContent = `${formatNum(STATS_DATA.total_videos)}개`;
      statsElements.totalViews.textContent = formatNum(STATS_DATA.total_views);
      statsElements.totalLikes.textContent = formatNum(STATS_DATA.total_likes);
      statsElements.totalComments.textContent = formatNum(STATS_DATA.total_comments);
    }
  };

  // Filter & Sort Logic
  const processVideos = () => {
    let result = [...state.videos];

    // 1. Tag Filtering
    if (state.filterTag === 'mega') {
      result = result.filter(v => v.views >= 10000);
    } else if (state.filterTag === 'canva') {
      result = result.filter(v => v.title.toLowerCase().includes('캔바') || v.title.toLowerCase().includes('canva'));
    } else if (state.filterTag === 'ai') {
      result = result.filter(v => v.title.toLowerCase().includes('ai') || v.title.toLowerCase().includes('인공지능') || v.title.toLowerCase().includes('챗'));
    } else if (state.filterTag === 'shorts') {
      result = result.filter(v => isShorts(v));
    } else if (state.filterTag === 'bookmark') {
      result = result.filter(v => state.bookmarks.has(v.id));
    }

    // 2. Search Query Filtering
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      result = result.filter(v => v.title.toLowerCase().includes(q));
    }

    // 3. Sorting
    result.sort((a, b) => {
      let valA = a[state.sortBy];
      let valB = b[state.sortBy];

      if (state.sortBy === 'date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (state.sortOrder === 'desc') {
        return valB > valA ? 1 : valB < valA ? -1 : 0;
      } else {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      }
    });

    state.currentList = result;
    render();
  };

  // Render Function
  const render = () => {
    const list = state.currentList;
    resultsCount.textContent = formatNum(list.length);

    if (list.length === 0) {
      videosGrid.style.display = 'none';
      tableViewContainer.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    if (state.viewMode === 'grid') {
      videosGrid.style.display = 'grid';
      tableViewContainer.style.display = 'none';
      renderGrid(list);
    } else {
      videosGrid.style.display = 'none';
      tableViewContainer.style.display = 'block';
      renderTable(list);
    }
  };

  // Render Grid Cards
  const renderGrid = (list) => {
    videosGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    list.forEach((video, index) => {
      const card = document.createElement('div');
      card.className = 'video-card';
      card.setAttribute('data-index', index);

      const rank = index + 1;
      let rankClass = 'rank-default';
      let rankText = `#${rank}`;
      if (state.sortBy === 'views' && state.sortOrder === 'desc') {
        if (rank === 1) { rankClass = 'rank-1'; rankText = '🏆 1위'; }
        else if (rank === 2) { rankClass = 'rank-2'; rankText = '🥈 2위'; }
        else if (rank === 3) { rankClass = 'rank-3'; rankText = '🥉 3위'; }
      }

      const isBookmarked = state.bookmarks.has(video.id);

      card.innerHTML = `
        <div class="card-thumbnail-wrap">
          <img class="card-thumbnail" 
               src="https://i.ytimg.com/vi/${video.id}/hqdefault.jpg" 
               alt="${video.title}" 
               loading="lazy" 
               onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60'">
          <div class="rank-badge ${rankClass}">${rankText}</div>
          ${isShorts(video) ? '<div class="badge-shorts">SHORTS</div>' : ''}
          <div class="play-overlay">
            <div class="play-circle">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </div>
        <div class="card-content">
          <h3 class="card-title" title="${video.title}">${escapeHtml(video.title)}</h3>
          <div class="card-meta-metrics">
            <div class="metric-item">
              <span class="metric-label">👀 조회수</span>
              <span class="metric-val" style="color: #38bdf8">${formatNum(video.views)}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">❤️ 좋아요</span>
              <span class="metric-val" style="color: #f43f5e">${formatNum(video.likes)}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">💬 댓글</span>
              <span class="metric-val" style="color: #c084fc">${formatNum(video.comments)}</span>
            </div>
          </div>
          <div class="card-footer">
            <span>📅 ${formatDate(video.date)}</span>
            <button class="btn-bookmark ${isBookmarked ? 'active' : ''}" data-id="${video.id}" title="보관함 저장">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isBookmarked ? '#f43f5e' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
        </div>
      `;

      // Card Click -> Open Player
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-bookmark')) {
          e.stopPropagation();
          toggleBookmark(video.id);
          return;
        }
        openModal(index);
      });

      fragment.appendChild(card);
    });

    videosGrid.appendChild(fragment);
  };

  // Render Table
  const renderTable = (list) => {
    videosTableBody.innerHTML = '';
    const fragment = document.createDocumentFragment();

    list.forEach((video, index) => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-index', index);

      const isBookmarked = state.bookmarks.has(video.id);

      tr.innerHTML = `
        <td class="table-rank">#${index + 1}</td>
        <td class="table-thumb-col">
          <img class="table-thumb" src="https://i.ytimg.com/vi/${video.id}/mqdefault.jpg" alt="${video.title}" loading="lazy">
        </td>
        <td class="table-title-col">
          <div class="table-title">${escapeHtml(video.title)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(video.date)} ${isShorts(video) ? '• <span style="color:#ef4444; font-weight:700">SHORTS</span>' : ''}</div>
        </td>
        <td class="table-num" style="color: #38bdf8;">${formatNum(video.views)}</td>
        <td class="table-num" style="color: #f43f5e;">${formatNum(video.likes)}</td>
        <td class="table-num" style="color: #c084fc;">${formatNum(video.comments)}</td>
        <td style="text-align: center;">
          <button class="btn-bookmark ${isBookmarked ? 'active' : ''}" data-id="${video.id}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isBookmarked ? '#f43f5e' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </td>
      `;

      tr.addEventListener('click', (e) => {
        if (e.target.closest('.btn-bookmark')) {
          e.stopPropagation();
          toggleBookmark(video.id);
          return;
        }
        openModal(index);
      });

      fragment.appendChild(tr);
    });

    videosTableBody.appendChild(fragment);
  };

  // Bookmark Toggle
  const toggleBookmark = (id) => {
    if (state.bookmarks.has(id)) {
      state.bookmarks.delete(id);
    } else {
      state.bookmarks.add(id);
    }
    localStorage.setItem('wooyeon_bookmarks', JSON.stringify([...state.bookmarks]));
    processVideos();
  };

  // Modal Open & Control
  const openModal = (index) => {
    if (index < 0 || index >= state.currentList.length) return;
    state.activeModalVideoIndex = index;
    const video = state.currentList[index];

    modalIframe.src = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`;
    modalVideoTitle.textContent = video.title;
    modalViews.textContent = `${formatNum(video.views)}회`;
    modalLikes.textContent = `${formatNum(video.likes)}개`;
    modalComments.textContent = `${formatNum(video.comments)}개`;
    modalDate.textContent = formatDate(video.date);
    modalYoutubeLink.href = video.url;

    btnPrevVideo.disabled = (index === 0);
    btnNextVideo.disabled = (index === state.currentList.length - 1);

    modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modalBackdrop.classList.remove('open');
    modalIframe.src = '';
    document.body.style.overflow = '';
  };

  // Modal Event Listeners
  btnCloseModal.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (modalBackdrop.classList.contains('open')) {
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowLeft') btnPrevVideo.click();
      else if (e.key === 'ArrowRight') btnNextVideo.click();
    }
  });

  btnPrevVideo.addEventListener('click', () => {
    if (state.activeModalVideoIndex > 0) {
      openModal(state.activeModalVideoIndex - 1);
    }
  });

  btnNextVideo.addEventListener('click', () => {
    if (state.activeModalVideoIndex < state.currentList.length - 1) {
      openModal(state.activeModalVideoIndex + 1);
    }
  });

  // Sort Tabs Event
  sortTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-sort');
      if (state.sortBy === type) {
        state.sortOrder = state.sortOrder === 'desc' ? 'asc' : 'desc';
      } else {
        state.sortBy = type;
        state.sortOrder = 'desc';
      }

      sortTabs.forEach(b => {
        b.classList.remove('active');
        const arrow = b.querySelector('.sort-arrow');
        if (arrow) arrow.textContent = '▼';
      });

      btn.classList.add('active');
      const arrow = btn.querySelector('.sort-arrow');
      if (arrow) arrow.textContent = state.sortOrder === 'desc' ? '▼' : '▲';

      processVideos();
    });
  });

  // Filter Chips Event
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filterTag = chip.getAttribute('data-filter');
      processVideos();
    });
  });

  // Search Input Event
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.searchQuery = e.target.value;
      processVideos();
    }, 200);
  });

  // View Mode Toggles
  viewGridBtn.addEventListener('click', () => {
    viewGridBtn.classList.add('active');
    viewTableBtn.classList.remove('active');
    state.viewMode = 'grid';
    render();
  });

  viewTableBtn.addEventListener('click', () => {
    viewTableBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    state.viewMode = 'table';
    render();
  });

  // Stat Card Quick Jump
  document.getElementById('cardStatViews').addEventListener('click', () => {
    document.querySelector('.sort-btn[data-sort="views"]').click();
  });
  document.getElementById('cardStatLikes').addEventListener('click', () => {
    document.querySelector('.sort-btn[data-sort="likes"]').click();
  });
  document.getElementById('cardStatComments').addEventListener('click', () => {
    document.querySelector('.sort-btn[data-sort="comments"]').click();
  });

  // Export current list to CSV
  exportCsvBtn.addEventListener('click', () => {
    const list = state.currentList;
    if (list.length === 0) return;

    let csvContent = '\uFEFF순위,동영상제목,조회수,좋아요수,댓글수,게시일시,동영상링크\n';
    list.forEach((v, idx) => {
      const cleanTitle = `"${v.title.replace(/"/g, '""')}"`;
      csvContent += `${idx + 1},${cleanTitle},${v.views},${v.likes},${v.comments},${v.date},${v.url}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wooyeon_videos_${state.sortBy}_sorted.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // Scroll to top
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      scrollToTopBtn.classList.add('show');
    } else {
      scrollToTopBtn.classList.remove('show');
    }
  });

  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Utility escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize
  initStats();
  processVideos();
});

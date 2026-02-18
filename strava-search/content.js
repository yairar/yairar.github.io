(function() {
  'use strict';

  // Configuration - adjust these selectors based on Strava's actual DOM structure
  const SELECTORS = {
    activitiesContainer: '.activities, [class*="Activity"], #activity-feed, .feed-container, [class*="feed"]',
    activityEntry: '.activity, [class*="ActivityEntry"], div[class*="feed-entry"], .feed-entry, [class*="Activity--"], div[data-testid*="activity"]',
    activityTitle: '.entry-title, [class*="title"], [class*="ActivityName"], .activity-name, a[href*="/activities/"], h3, .entry-head a'
  };

  let searchInput = null;
  let searchCount = null;
  let currentMatchIndex = 0;
  let matchedElements = [];
  let isLoadingYear = false;
  let loadingCancelled = false;
  let currentMonthIndex = 0;
  let allMonthLinks = [];
  let suppressObserver = false; // pauses MutationObserver during month loading

  function createSearchBox() {
    // Check if search box already exists
    if (document.getElementById('strava-activity-search')) {
      return;
    }

    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'strava-search-container';
    searchContainer.innerHTML = `
      <div class="strava-search-wrapper">
        <input 
          type="text" 
          id="strava-activity-search" 
          placeholder="🔍 Search activities by name..."
          class="strava-search-input"
        />
        <div class="strava-search-controls">
          <button id="strava-prev-match" class="strava-nav-btn" title="Previous match (Shift+Enter)" disabled>↑</button>
          <button id="strava-next-match" class="strava-nav-btn" title="Next match (Enter)" disabled>↓</button>
          <button id="strava-clear-search" class="strava-clear-btn" title="Clear search">✕</button>
        </div>
      </div>
      <div class="strava-year-loader">
        <button id="strava-load-year" class="strava-load-year-btn" title="Search through all months one by one">
          🔍 Search all months
        </button>
        <div id="strava-loading-progress" class="strava-loading-progress" style="display: none;">
          <div class="progress-text">Loading month <span id="progress-current">0</span>/...</div>
          <div class="progress-bar">
            <div id="progress-fill" class="progress-fill"></div>
          </div>
          <button id="strava-cancel-load" class="strava-cancel-btn">Cancel</button>
        </div>
      </div>
      <div class="search-info">
        <span class="search-count"></span>
        <span class="search-tip">💡 Tip: Search works on currently visible activities on this page</span>
      </div>
    `;

    // Find the best place to insert the search box
    const activitiesContainer = findActivitiesContainer();
    if (!activitiesContainer) {
      console.log('[Strava Search] Activities container not found');
      return false;
    }

    // Insert the search box safely
    const parent = activitiesContainer.parentNode;
    
    // Check if parent is valid (not document or null)
    if (!parent || parent === document || parent === document.documentElement) {
      // If parent is invalid, insert as first child of the container
      activitiesContainer.insertBefore(searchContainer, activitiesContainer.firstChild);
    } else {
      // Normal insertion before the container
      parent.insertBefore(searchContainer, activitiesContainer);
    }

    // Get references to elements
    searchInput = document.getElementById('strava-activity-search');
    searchCount = document.querySelector('.search-count');
    const clearButton = document.getElementById('strava-clear-search');
    const prevButton = document.getElementById('strava-prev-match');
    const nextButton = document.getElementById('strava-next-match');
    const loadYearButton = document.getElementById('strava-load-year');
    const cancelLoadButton = document.getElementById('strava-cancel-load');

    // Add event listeners
    searchInput.addEventListener('input', performSearch);
    clearButton.addEventListener('click', clearSearch);
    prevButton.addEventListener('click', () => navigateMatches(-1));
    nextButton.addEventListener('click', () => navigateMatches(1));
    loadYearButton.addEventListener('click', loadFullYear);
    cancelLoadButton.addEventListener('click', cancelYearLoad);
    
    // Add keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          navigateMatches(-1); // Shift+Enter = previous
        } else {
          navigateMatches(1);  // Enter = next
        }
      }
    });
    
    // Add keyboard shortcut (Ctrl+K or Cmd+K)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });

    console.log('[Strava Search] Search box initialized');
    return true;
  }

  function findActivitiesContainer() {
    // Try different possible selectors in order of preference
    const possibleSelectors = [
      '.activities',
      '#activity-feed',
      '[class*="ActivityFeed"]',
      '.feed-container',
      'div[class*="feed"]',
      '.container[class*="activities"]',
      'main .container',
      '.page.container'
    ];
    
    for (const selector of possibleSelectors) {
      const container = document.querySelector(selector);
      if (container) {
        console.log(`[Strava Search] Found container with selector: ${selector}`);
        return container;
      }
    }
    
    // Last resort: find the main content area
    const main = document.querySelector('main') || document.querySelector('.main-content') || document.querySelector('.container');
    if (main) {
      console.log('[Strava Search] Using main content area');
      return main;
    }
    
    return null;
  }

  function getActivityEntries() {
    const activities = [];
    
    // Try different possible selectors for activity entries
    const possibleSelectors = [
      '.activity',
      '.feed-entry',
      'div[class*="ActivityEntry"]',
      'div[class*="feed-entry"]',
      '[class*="Activity--"]',
      'div[data-testid*="activity"]',
      '.entity-details'
    ];
    
    for (const selector of possibleSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`[Strava Search] Found ${elements.length} activities with selector: ${selector}`);
        activities.push(...elements);
        break;
      }
    }
    
    // If we still don't have activities, try a more generic approach
    if (activities.length === 0) {
      console.log('[Strava Search] Trying generic activity detection');
      // Look for elements that contain links to /activities/
      const activityLinks = document.querySelectorAll('a[href*="/activities/"]');
      activityLinks.forEach(link => {
        // Get the parent container (usually 2-3 levels up)
        let parent = link.parentElement;
        let depth = 0;
        while (parent && depth < 5) {
          if (parent.classList.length > 0 && parent.querySelectorAll('a[href*="/activities/"]').length === 1) {
            if (!activities.includes(parent)) {
              activities.push(parent);
            }
            break;
          }
          parent = parent.parentElement;
          depth++;
        }
      });
      console.log(`[Strava Search] Found ${activities.length} activities using generic detection`);
    }
    
    return activities;
  }

  function getActivityName(activityElement) {
    // Try different possible selectors for activity titles
    const possibleSelectors = [
      '.entry-title',
      '[class*="title"]',
      '[class*="ActivityName"]',
      '.activity-name',
      'h3',
      'h2',
      '.entry-head a',
      'strong a',
      'a[href*="/activities/"]'
    ];
    
    for (const selector of possibleSelectors) {
      const titleElement = activityElement.querySelector(selector);
      if (titleElement) {
        const text = (titleElement.textContent || titleElement.innerText || '').trim();
        if (text.length > 0 && !text.includes('View all') && text.length < 200) {
          return text;
        }
      }
    }
    
    // Fallback: try to find any text content that looks like an activity name
    const activityLink = activityElement.querySelector('a[href*="/activities/"]');
    if (activityLink) {
      const text = (activityLink.textContent || activityLink.innerText || '').trim();
      if (text.length > 0 && text.length < 200) {
        return text;
      }
    }
    
    return '';
  }

  function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const activities = getActivityEntries();
    
    if (activities.length === 0) {
      console.log('[Strava Search] No activities found');
      searchCount.textContent = 'No activities found on this page';
      return;
    }

    let visibleCount = 0;
    matchedElements = []; // Reset matched elements
    currentMatchIndex = 0;

    activities.forEach(activity => {
      const activityName = getActivityName(activity);
      
      if (!activityName) {
        return; // Skip if we can't find the name
      }

      const matches = searchTerm === '' || activityName.toLowerCase().includes(searchTerm);

      if (matches) {
        activity.style.display = '';
        activity.classList.remove('strava-search-hidden');
        if (searchTerm) {
          activity.classList.add('strava-search-match');
          matchedElements.push(activity);
        } else {
          activity.classList.remove('strava-search-match');
        }
        visibleCount++;
      } else {
        activity.style.display = 'none';
        activity.classList.add('strava-search-hidden');
        activity.classList.remove('strava-search-match');
      }
    });

    // Update count display
    updateSearchCount(searchTerm, visibleCount, activities.length);
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Scroll to first matching activity if there's a search term
    if (searchTerm && matchedElements.length > 0) {
      setTimeout(() => {
        scrollToElement(matchedElements[0]);
      }, 100);
    }
    
    // Log for debugging
    if (searchTerm) {
      console.log(`[Strava Search] Found ${visibleCount} matches for "${searchTerm}"`);
    }
  }

  function updateSearchCount(searchTerm, visibleCount, totalCount) {
    if (!searchCount) return;

    if (searchTerm) {
      searchCount.textContent = `Showing ${visibleCount} of ${totalCount} activities`;
      searchCount.style.display = 'inline';
    } else {
      searchCount.textContent = `${totalCount} activities on this page`;
      searchCount.style.display = 'inline';
    }
  }

  function clearSearch() {
    if (searchInput) {
      searchInput.value = '';
      performSearch();
      searchInput.focus();
    }
    // Reset "Continue search" button back to original state
    const loadYearButton = document.getElementById('strava-load-year');
    if (loadYearButton) {
      loadYearButton.textContent = '🔍 Search all months';
      loadYearButton.disabled = false;
      currentMonthIndex = 0;
      allMonthLinks = [];
    }
  }

  function navigateMatches(direction) {
    if (matchedElements.length === 0) return;
    
    // Remove pulse from current element
    if (matchedElements[currentMatchIndex]) {
      matchedElements[currentMatchIndex].classList.remove('strava-search-pulse');
    }
    
    // Update index
    currentMatchIndex += direction;
    
    // Wrap around
    if (currentMatchIndex < 0) {
      currentMatchIndex = matchedElements.length - 1;
    } else if (currentMatchIndex >= matchedElements.length) {
      currentMatchIndex = 0;
    }
    
    // Scroll to new match
    scrollToElement(matchedElements[currentMatchIndex]);
    
    // Update count display
    updateNavigationButtons();
  }

  function updateNavigationButtons() {
    const prevButton = document.getElementById('strava-prev-match');
    const nextButton = document.getElementById('strava-next-match');
    
    if (!prevButton || !nextButton) return;
    
    const hasMatches = matchedElements.length > 1;
    
    prevButton.disabled = !hasMatches;
    nextButton.disabled = !hasMatches;
    
    // Update count to show current position
    if (matchedElements.length > 0 && searchInput.value.trim()) {
      const countText = matchedElements.length > 1 
        ? `${currentMatchIndex + 1}/${matchedElements.length} matches`
        : `1 match`;
      searchCount.textContent = countText;
    }
  }

  function scrollToElement(element) {
    if (!element) return;
    
    // Calculate position with offset for sticky search box
    const searchBoxHeight = document.querySelector('.strava-search-container')?.offsetHeight || 0;
    const navbarHeight = 60; // Approximate Strava navbar height
    const offset = searchBoxHeight + navbarHeight + 20; // Add some padding
    
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
    
    // Add temporary pulse animation to highlight the element
    element.classList.add('strava-search-pulse');
    setTimeout(() => {
      element.classList.remove('strava-search-pulse');
    }, 2000);
  }

  async function loadFullYear() {
    if (isLoadingYear) return;

    isLoadingYear = true;
    loadingCancelled = false;

    const loadYearButton = document.getElementById('strava-load-year');
    const progressContainer = document.getElementById('strava-loading-progress');

    if (!loadYearButton || !progressContainer) {
      console.error('[Strava Search] Load Year UI elements not found');
      isLoadingYear = false;
      return;
    }

    // On first run, collect all month links. On resume, reuse existing list.
    if (currentMonthIndex === 0 || allMonthLinks.length === 0) {
      allMonthLinks = Array.from(
        document.querySelectorAll('#interval-graph-columns .interval.selectable a.bar')
      );
      currentMonthIndex = 0;
    }

    if (allMonthLinks.length === 0) {
      progressContainer.style.display = 'flex';
      progressContainer.innerHTML = '<div class="progress-error">❌ Month chart not found. Make sure you are viewing activities by Month.</div>';
      setTimeout(() => resetLoadingUI(), 3000);
      isLoadingYear = false;
      return;
    }

    console.log(`[Strava Search] Found ${allMonthLinks.length} months. Starting from month ${currentMonthIndex + 1}.`);

    loadYearButton.style.display = 'none';
    progressContainer.style.display = 'flex';
    suppressObserver = true; // stop MutationObserver from firing during load

    try {
      for (let i = currentMonthIndex; i < allMonthLinks.length; i++) {
        if (loadingCancelled) {
          console.log('[Strava Search] Loading cancelled');
          break;
        }

        const link = allMonthLinks[i];
        const monthId = link.closest('.interval')?.id || `month-${i + 1}`;
        console.log(`[Strava Search] Clicking month ${i + 1}/${allMonthLinks.length}: ${monthId}`);

        // Update progress bar
        const progressText = progressContainer.querySelector('.progress-text');
        const progressFill = progressContainer.querySelector('.progress-fill');
        if (progressText) progressText.innerHTML = `Searching month <span class="progress-current">${i + 1}</span>/${allMonthLinks.length}...`;
        if (progressFill) progressFill.style.width = `${((i + 1) / allMonthLinks.length) * 100}%`;

        link.click();

        // Wait for Strava to fully load and settle activities for this month
        await sleep(5000);

        // Check if search term matches anything in this month
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        if (searchTerm) {
          const activities = getActivityEntries();
          const hasMatch = activities.some(activity => {
            const name = getActivityName(activity);
            return name.toLowerCase().includes(searchTerm);
          });

          if (hasMatch) {
            currentMonthIndex = i + 1;

            // Hide progress, restore button
            progressContainer.style.display = 'none';
            loadYearButton.style.display = 'inline-block';
            const remaining = allMonthLinks.length - currentMonthIndex;
            if (remaining > 0) {
              loadYearButton.textContent = `▶ Continue search (${remaining} months left)`;
            } else {
              loadYearButton.textContent = '✓ All months searched';
              loadYearButton.disabled = true;
              currentMonthIndex = 0;
            }

            // Run search & scroll BEFORE re-enabling the observer
            // so DOM changes from performSearch don't trigger another navigation
            performSearch();
            await sleep(100);
            suppressObserver = false;

            console.log(`[Strava Search] Match found in month ${i + 1}. Pausing. ${remaining} months remaining.`);
            isLoadingYear = false;
            return;
          }
        }

        currentMonthIndex = i + 1;
      }

      // Reached the end without finding (more) matches
      if (!loadingCancelled) {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        if (searchTerm) {
          performSearch();
        }
        progressContainer.innerHTML = `<div class="progress-success">✓ All ${allMonthLinks.length} months searched!</div>`;
        currentMonthIndex = 0;
        allMonthLinks = [];
        setTimeout(() => resetLoadingUI(), 2000);
      } else {
        resetLoadingUI();
      }

    } catch (error) {
      console.error('[Strava Search] Error loading months:', error);
      if (progressContainer) {
        progressContainer.innerHTML = '<div class="progress-error">Error loading months</div>';
      }
      setTimeout(() => resetLoadingUI(), 2000);
    } finally {
      suppressObserver = false;
      isLoadingYear = false;
    }
  }

  function findNextMonthButton() {
    console.log('[Strava Search] Looking for next month button...');
    
    // Try Strava-specific selectors first
    const possibleSelectors = [
      'button.next-month',
      'a.next-month',
      '.pagination .next',
      '[data-action="next"]',
      'button[aria-label*="next month" i]',
      'a[aria-label*="next month" i]',
      'a[href*="interval_type=month"]',
      '.interval-nav button:last-of-type',
      '.interval-nav a:last-of-type',
      '.view-controls button:last-of-type',
    ];
    
    for (const selector of possibleSelectors) {
      try {
        const el = document.querySelector(selector);
        if (el && !el.disabled && !el.classList.contains('disabled') && el.offsetParent !== null) {
          // Make sure it's not our own extension element
          if (el.closest('.strava-search-container')) continue;
          console.log(`[Strava Search] Found next button: ${selector}`);
          return el;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Fallback: scan all buttons/links, skipping our own
    const allElements = document.querySelectorAll('button, a, [role="button"]');
    for (const el of allElements) {
      // Skip hidden, disabled, or our own extension elements
      if (el.offsetParent === null) continue;
      if (el.disabled) continue;
      if (el.closest('.strava-search-container')) continue;

      const text     = el.textContent.trim();
      const aria     = (el.getAttribute('aria-label') || '').toLowerCase();
      const title    = (el.getAttribute('title') || '').toLowerCase();
      const cls      = (el.className || '').toLowerCase();
      const innerHTML = el.innerHTML.toLowerCase();

      const isNext =
        text === '›' || text === '>' || text === '→' ||
        (aria.includes('next') && aria.includes('month')) ||
        (title.includes('next') && title.includes('month')) ||
        cls.includes('next-month') ||
        innerHTML.includes('chevronright') ||
        innerHTML.includes('chevron-right') ||
        innerHTML.includes('arrowright');

      if (isNext) {
        console.log('[Strava Search] Found next button via scan:', {
          text, aria, title, class: cls
        });
        return el;
      }
    }

    console.log('[Strava Search] No next month button found');
    return null;
  }

  function cancelYearLoad() {
    loadingCancelled = true;
    resetLoadingUI();
  }

  function resetLoadingUI() {
    const loadYearButton = document.getElementById('strava-load-year');
    const progressContainer = document.getElementById('strava-loading-progress');
    
    if (!loadYearButton || !progressContainer) {
      console.log('[Strava Search] Reset UI: Elements not found, skipping reset');
      return;
    }
    
    // Restore original button state
    loadYearButton.style.display = 'inline-block';
    loadYearButton.textContent = '🔍 Search all months';
    loadYearButton.disabled = false;
    progressContainer.style.display = 'none';
    
    // Reset progress HTML to initial state
    progressContainer.innerHTML = `
      <div class="progress-text">Searching month <span class="progress-current">0</span>/...</div>
      <div class="progress-bar">
        <div id="progress-fill" class="progress-fill"></div>
      </div>
      <button id="strava-cancel-load" class="strava-cancel-btn">Cancel</button>
    `;
    
    // Reset month tracking
    currentMonthIndex = 0;
    allMonthLinks = [];

    // Re-attach cancel button listener
    const cancelButton = document.getElementById('strava-cancel-load');
    if (cancelButton) {
      cancelButton.addEventListener('click', cancelYearLoad);
    }
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function observePageChanges() {
    // Watch for dynamically loaded content
    const observer = new MutationObserver((mutations) => {
      // Check if new activities were added
      const hasNewActivities = mutations.some(mutation => 
        mutation.addedNodes.length > 0
      );

      if (hasNewActivities && searchInput && searchInput.value && !suppressObserver) {
        // Reapply search filter
        performSearch();
      }
    });

    const activitiesContainer = findActivitiesContainer();
    if (activitiesContainer) {
      observer.observe(activitiesContainer, {
        childList: true,
        subtree: true
      });
    }

    // Also observe for page navigation
    observer.observe(document.body, {
      childList: true,
      subtree: false
    });
  }

  function initialize() {
    // Wait a bit for Strava's page to fully load
    setTimeout(() => {
      const success = createSearchBox();
      
      if (success) {
        observePageChanges();
        // Initial count display
        performSearch();
      } else {
        // Retry after a longer delay
        console.log('[Strava Search] Retrying initialization...');
        setTimeout(initialize, 2000);
      }
    }, 1000);
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  console.log('[Strava Search] Extension loaded');
})();

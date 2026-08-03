/**
 * In-page section navigation shared by the header and the footer.
 *
 * #explore-menu and #app-download only exist on the home route; #footer is on
 * every page. Both places used to guess: the header used bare `href="#id"`
 * anchors (which did nothing off the home page) and the footer used a 60ms
 * setTimeout after navigating (a race under load). This does neither.
 */

export const scrollToId = (id) => {
  const el = id && document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
};

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

/**
 * Scroll to `id` if it is on the current page. Otherwise go home first and
 * scroll once the route has committed and laid out — two frames, rather than a
 * guessed delay. Pass `id = null` for the top of the home page.
 */
export const jumpToSection = (navigate, pathname, id) => {
  const run = () => (id ? scrollToId(id) : scrollToTop());

  if (id && scrollToId(id)) return;
  if (!id && pathname === '/') {
    run();
    return;
  }

  navigate('/');
  requestAnimationFrame(() => requestAnimationFrame(run));
};

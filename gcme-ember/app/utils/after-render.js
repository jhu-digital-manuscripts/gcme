/**
 * Wait until Ember has finished rendering the change made in the current
 * event handler.
 *
 * Rendering is flushed in the current task, so a callback that runs on the
 * next animation frame sees the new DOM. Waiting for a frame avoids reaching
 * for the run loop just to touch an element that has only just appeared.
 *
 * @returns {Promise<void>}
 */
export default function afterRender() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

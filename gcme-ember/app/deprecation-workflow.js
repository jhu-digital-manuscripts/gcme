import setupDeprecationWorkflow from 'ember-cli-deprecation-workflow';

// After the recent Ember major-version upgrade this app is expected to emit
// deprecation warnings. We start with an empty workflow and
// `throwOnUnhandled: false` so that *every* deprecation is logged to the
// browser console (and the test runner) instead of being silenced. That gives
// us a complete inventory of what still needs to be fixed.
//
// Recommended workflow:
//   1. Run `npm test` (or `npx ember test --server`) and/or exercise the app.
//   2. In the browser console run `deprecationWorkflow.flushDeprecations()`
//      to get a ready-made `workflow` array of every deprecation seen.
//   3. Fix deprecations one at a time. As each is fixed, it stops appearing.
//   4. To silence noise from third-party addons you cannot fix yet, add a
//      matcher below with `handler: 'silence'`, e.g.:
//
//        setupDeprecationWorkflow({
//          workflow: [
//            { handler: 'silence', matchId: 'some.deprecation.id' },
//            { handler: 'throw',   matchId: 'a.deprecation.we.have.fixed' },
//          ],
//        });
//
// Handlers: 'log' (default here — prints the warning), 'silence' (hide it),
// 'throw' (turn it into an error so it cannot be reintroduced).
setupDeprecationWorkflow({
  throwOnUnhandled: false,
  workflow: [],
});

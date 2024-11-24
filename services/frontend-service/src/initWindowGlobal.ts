// we added this because of draft-js library caused "global is not defined"
// see https://stackoverflow.com/questions/72114775/vite-global-is-not-defined, https://github.com/vitejs/vite/issues/2778#issuecomment-810086159
// > The problem is because vite doesn't define a global field in window as webpack does.
// > And some libraries relies on it since webpack is much more older than vite.

(window as any).global ||= window;

export {};

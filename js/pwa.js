if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((registration) => registration.update())
      .catch((err) => {
        console.warn("Service worker non registrato:", err);
      });
  });
}

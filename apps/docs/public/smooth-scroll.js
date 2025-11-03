// Smooth scroll for all links
document.addEventListener("DOMContentLoaded", () => {
  // Handle anchor links (within same page)
  document.querySelectorAll('a[href*="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      // Skip Starlight's tab buttons and other UI elements with role="tab"
      if (anchor.getAttribute("role") === "tab") {
        return;
      }

      const href = anchor.getAttribute("href");
      if (href) {
        const hashIndex = href.indexOf("#");
        if (hashIndex !== -1) {
          const hash = href.substring(hashIndex);
          if (hash !== "#") {
            const id = hash.substring(1);
            const target = document.getElementById(id);
            if (target) {
              e.preventDefault();
              target.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
              if (hashIndex === 0) {
                history.pushState(null, "", hash);
              }
            }
          }
        }
      }
    });
  });

  // Smooth scroll after page loads if there's a hash
  if (window.location.hash) {
    const id = window.location.hash.substring(1);
    const target = document.getElementById(id);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }
});

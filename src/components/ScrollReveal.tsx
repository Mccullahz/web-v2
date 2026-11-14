import { useEffect } from "react";

/**
 * Reveals any element marked with `data-reveal` as it scrolls into view.
 * Mount once near the elements you want revealed. Falls back to showing
 * everything immediately when reduced-motion is preferred or Intersection
 * Observer is unavailable, so content is never left hidden.
 */
export const ScrollReveal: React.FC = () => {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (els.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in-view"));
      return;
    }

    // data-reveal="with-next": a small header that waits for the block under it (the next
    // sibling, or the first revealing element inside it) instead of firing on its own while
    // it's still sitting at the bottom edge of the screen
    const followers = new Map<Element, HTMLElement[]>();
    els.forEach((el) => {
      if (el.dataset.reveal !== "with-next") return;
      const next = el.nextElementSibling;
      const leader = next?.matches("[data-reveal]") ? next : next?.querySelector("[data-reveal]");
      if (leader) followers.set(leader, [...(followers.get(leader) ?? []), el]);
      else el.classList.add("in-view");
    });
    const show = (el: Element) => {
      el.classList.add("in-view");
      followers.get(el)?.forEach((f) => f.classList.add("in-view"));
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    // data-reveal="late": waits until the block is well up the screen (not just peeking in
    // at the bottom), or until the page can't scroll any further, so it can never stay hidden
    const late = els.filter((el) => el.dataset.reveal === "late");
    const checkLate = () => {
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      late.forEach((el) => {
        if (!el.classList.contains("in-view") && (atBottom || el.getBoundingClientRect().top < window.innerHeight * 0.7)) show(el);
      });
    };
    if (late.length) {
      window.addEventListener("scroll", checkLate, { passive: true });
      window.addEventListener("resize", checkLate);
      checkLate();
    }

    els.filter((el) => el.dataset.reveal !== "with-next" && el.dataset.reveal !== "late").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", checkLate);
      window.removeEventListener("resize", checkLate);
    };
  }, []);

  return null;
};

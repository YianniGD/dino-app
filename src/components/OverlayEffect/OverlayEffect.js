import { useMemo, useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
// Removed cn import as it's not needed for a hook
// Removed "./OverlayEffect.css" import as styles will be applied inline

const effects = {
    "type-1": {
        maskImage: `
    radial-gradient(circle at var(--clientX, 50%) var(--clientY, 50%), transparent, 3em, black 5em),
    radial-gradient(circle, black 0.1em, transparent 0.5em),
    radial-gradient(circle, black 0.1em, transparent 0.5em)
  `,
        maskSize: "100% 100%, 1em 1.5em, 1em 1.5em",
        maskPosition: "0 0, 0 0, 0.5em 0.75em",
    },
    "type-2": {
        maskImage: `
    radial-gradient(circle at var(--clientX, 50%) var(--clientY, 50%), transparent, black 8em),
    repeating-linear-gradient(45deg, black 0 0.1em, transparent 0 1.5em),
    repeating-linear-gradient(-45deg, black 0 0.1em, transparent 0 1.5em)
  `,
    },
    "type-3": {
        maskImage: `
    radial-gradient(circle at var(--clientX, 50%) var(--clientY, 50%), transparent, black 7em),
    repeating-linear-gradient(0deg, black 0, transparent 0.025em 1.45em, black 1.5em),
    repeating-linear-gradient(90deg, black 0, transparent 0.025em 1.45em, black 1.5em)
  `,
        maskPosition: `
    0 0,
    0 calc(var(--clientY, 50%) * -0.2),
    calc(var(--clientX, 50%) * -0.2) 0
  `,
    },
    "type-4": {
        maskImage: `
    radial-gradient(circle at var(--clientX, 50%) var(--clientY, 50%), transparent 3em, black 4em),
    repeating-linear-gradient(60deg, black 0 0.3em, transparent 0 1.5em)
  `,
    },
};

export const useOverlayMaskEffect = (effect = "type-2") => {
    const elementRef = useRef(null); // This ref will be attached to the element being masked

    const styles = useMemo(() => effects[effect], [effect]);
    const proxy = { x: 0, y: 0 };

    useGSAP(() => {
        const element = elementRef.current;
        if (!element) return;

        // Ensure the element being masked has relative positioning for correct event handling
        element.style.position = "relative";

        const move = (e) => {
            const rect = element.getBoundingClientRect(); // Use element for rect
            const targetX = e.clientX - rect.left;
            const targetY = e.clientY - rect.top;

            gsap.to(proxy, {
                x: targetX,
                y: targetY,
                duration: 0.3,
                ease: "power1.out",
                onUpdate: () => {
                    element.style.setProperty("--clientX", `${proxy.x}px`);
                    element.style.setProperty("--clientY", `${proxy.y}px`);
                },
            });
        };

        // No need for enter/leave classes as we are directly applying mask styles
        // The mask will be active as long as the styles are applied.

        element.addEventListener("mousemove", move);
        // No need for mouseenter/mouseleave for 'remove' class as we are not using it.

        return () => {
            element.removeEventListener("mousemove", move);
        };
    }, [effect]); // Re-run effect if 'effect' type changes

    return { ref: elementRef, maskStyles: styles };
};

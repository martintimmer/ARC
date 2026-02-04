(() => {
    const activeClass = "flash";

    function flashField(element) {
        if (!element) return;
        element.classList.remove(activeClass);
        void element.offsetWidth;
        element.classList.add(activeClass);
    }

    window.flashField = flashField;
})();

(() => {
    class Prompter {
        constructor(parent) {
            this.parent = parent;
            this.id = parent.dataset.promptId || `prompt-${Math.random().toString(36).slice(2)}`;
            this.text = parent.dataset.promptText || "";
            this.delay = Number(parent.dataset.promptDelay || 1500);
            this.hideDelay = Number(parent.dataset.promptHideDelay || 0);
            this.display = parent.dataset.promptDisplay || "once";
            this.parent.classList.add("prompt-parent");
        }

        canShow() {
            if (this.display === "once" && localStorage.getItem(this.id)) return false;
            if (this.display !== "once" && this.display !== "always" && localStorage.getItem(this.display)) {
                return false;
            }
            return true;
        }

        activate() {
            if (!this.canShow() || !this.text) return;
            this.prompt = document.createElement("span");
            this.prompt.className = "prompt";
            this.prompt.id = this.id;
            this.prompt.textContent = this.text;
            this.parent.appendChild(this.prompt);

            const hide = () => this.deactivate();
            this.parent.addEventListener("click", hide);
            const input = this.parent.querySelector("input, select, textarea");
            if (input) input.addEventListener("focus", hide);

            setTimeout(() => {
                this.prompt.classList.add("show");
                if (this.hideDelay) {
                    setTimeout(hide, this.hideDelay);
                }
            }, this.delay);
        }

        deactivate() {
            if (!this.prompt) return;
            this.prompt.classList.remove("show");
            if (this.display === "once") {
                localStorage.setItem(this.id, "shown");
            } else if (this.display !== "always") {
                localStorage.setItem(this.display, "shown");
            }
        }
    }

    function initPrompters() {
        const elements = document.querySelectorAll("[data-prompt-text]");
        elements.forEach((el) => {
            const prompter = new Prompter(el);
            prompter.activate();
        });
    }

    document.addEventListener("DOMContentLoaded", initPrompters);
})();

(() => {
    const storageKeys = {
        base: "arc-base",
        history: "arc-history",
        theme: "arc-theme"
    };

    const defaultSampleSvg = encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">
            <defs>
                <filter id="n">
                    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
                </filter>
            </defs>
            <rect width="640" height="480" fill="#07080b"/>
            <rect width="640" height="480" filter="url(#n)" opacity="0.28"/>
        </svg>
    `);
    const defaultSampleUrl = `data:image/svg+xml;utf8,${defaultSampleSvg}`;

    const selectors = {
        x1: 'input[name="x1"]',
        y1: 'input[name="y1"]',
        x2: 'input[name="x2"]',
        y2: 'input[name="y2"]',
        round: 'input[name="round"]',
        squeeze: "#squeeze",
        ratios: "#ratios",
        ratioText: "#ratio",
        standardMatch: "#standard-match",
        standardTags: "#standard-tags",
        standardSensors: "#standard-sensors",
        visual: "#visual-ratio",
        errors: "#errors",
        previewWidth: "#preview-width",
        previewHeight: "#preview-height",
        previewLineV: ".preview-line.vertical",
        previewLineH: ".preview-line.horizontal",
        sampleToggle: 'input[name="sample-display"]',
        sampleUrl: 'input[name="sample-url"]',
        cropOptions: 'input[name="crop"]',
        cropPanel: "#croptions",
        resetBtn: "[data-reset]",
        themeToggle: "[data-theme-toggle]",
        textureToggle: "[data-texture-toggle]"
    };

    const state = {
        lastTarget: null,
        textureIndex: 1
    };

    const ratioStandards = [
        {
            ratio: 1.33,
            label: "1.33:1",
            note: "Early film cameras and optical projection",
            sensors: "ARRI 4:3 | RED 4:3 | Sony 4:3 crop",
            streamingSafe: false,
            delivery: "theatrical"
        },
        {
            ratio: 1.37,
            label: "1.37:1",
            note: "Academy cameras with optical sound track",
            sensors: "ARRI 4:3 | RED 4:3 | Sony legacy modes",
            streamingSafe: false,
            delivery: "theatrical"
        },
        {
            ratio: 1.66,
            label: "1.66:1",
            note: "Masked 35mm projection, European cinemas",
            sensors: "ARRI Open Gate | RED Full Frame | Sony FF",
            streamingSafe: "limited",
            delivery: "theatrical"
        },
        {
            ratio: 1.75,
            label: "1.75:1",
            note: "35mm masking for early widescreen",
            sensors: "ARRI Open Gate | RED Full Frame | Sony FF",
            streamingSafe: "limited",
            delivery: "theatrical"
        },
        {
            ratio: 1.85,
            label: "1.85:1",
            note: "Spherical cameras, flat theatrical projection",
            sensors: "ARRI 16:9 | RED 16:9 | Sony 16:9",
            streamingSafe: true,
            delivery: "theatrical"
        },
        {
            ratio: 1.9,
            label: "1.90:1",
            note: "Digital sensors and IMAX-derived delivery",
            sensors: "ARRI LF Open Gate | RED FF | Sony Venice",
            streamingSafe: true,
            delivery: "IMAX"
        },
        {
            ratio: 2.0,
            label: "2.00:1",
            note: "Digital sensors optimized for multiple outputs",
            sensors: "ARRI Open Gate | RED FF | Sony Venice",
            streamingSafe: true,
            delivery: "streaming"
        },
        {
            ratio: 2.2,
            label: "2.20:1",
            note: "65mm capture, 70mm theatrical prints",
            sensors: "ARRI LF Open Gate | RED FF",
            streamingSafe: "limited",
            delivery: "theatrical"
        },
        {
            ratio: 2.35,
            label: "2.35:1",
            note: "35mm anamorphic capture and projection",
            sensors: "ARRI 4:3 Anamorphic | RED 6:5 | Sony Ana",
            streamingSafe: true,
            delivery: "theatrical"
        },
        {
            ratio: 2.39,
            label: "2.39:1",
            note: "Modern anamorphic theatrical delivery standard",
            sensors: "ARRI 4:3 Anamorphic | RED 6:5 | Sony Ana",
            streamingSafe: true,
            delivery: "theatrical"
        },
        {
            ratio: 2.4,
            label: "2.40:1",
            note: "Digital cinema container rounding of scope",
            sensors: "ARRI 4:3 Anamorphic | RED 6:5 | Sony Ana",
            streamingSafe: true,
            delivery: "theatrical"
        },
        {
            ratio: 2.55,
            label: "2.55:1",
            note: "Early anamorphic capture without audio track",
            sensors: "ARRI 4:3 Anamorphic | RED 6:5",
            streamingSafe: false,
            delivery: "theatrical"
        },
        {
            ratio: 2.76,
            label: "2.76:1",
            note: "65mm anamorphic capture, epic roadshows",
            sensors: "ARRI LF Open Gate | RED FF Anamorphic",
            streamingSafe: false,
            delivery: "theatrical"
        },
        {
            ratio: 2.9,
            label: "2.90:1",
            note: "Full 70mm frame with magnetic sound",
            sensors: "ARRI LF Open Gate | RED FF",
            streamingSafe: false,
            delivery: "theatrical"
        },
        {
            ratio: 3.0,
            label: "3.00:1",
            note: "Special-format capture or installation projection",
            sensors: "Custom sensor crops or stitched formats",
            streamingSafe: false,
            delivery: "theatrical"
        }
    ];

    const ratioGuides = {
        streamingSafe: [1.85, 1.9, 2.0, 2.39],
        imaxCentric: [1.9, 1.43],
        anamorphicNative: [2.35, 2.4],
        theatricalOnlyMin: 2.55
    };

    const q = (sel) => document.querySelector(sel);
    const qa = (sel) => Array.from(document.querySelectorAll(sel));

    const els = {};

    function initElements() {
        Object.keys(selectors).forEach((key) => {
            els[key] = q(selectors[key]);
        });
    }

    function parseNumber(value) {
        return value === "" ? NaN : Number(value);
    }

    function isPositiveNumber(value) {
        return /^\d+(\.\d+)?$/.test(value);
    }

    function formatNumber(value) {
        if (!Number.isFinite(value)) return "";
        if (els.round.checked) return Math.round(value).toString();
        const rounded = Math.round(value * 10000) / 10000;
        return rounded.toString();
    }

    function gcd(a, b) {
        if (!b) return a;
        return gcd(b, a % b);
    }

    function reduceRatio(numerator, denominator) {
        if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return "? : ?";
        if (numerator === denominator) return "1 : 1";
        let left = numerator;
        let right = denominator;
        let flipped = false;
        if (left < right) {
            [left, right] = [right, left];
            flipped = true;
        }
        const divisor = gcd(Math.round(left), Math.round(right));
        let reducedLeft = left / divisor;
        let reducedRight = right / divisor;
        if (flipped) [reducedLeft, reducedRight] = [reducedRight, reducedLeft];
        if (reducedLeft === 8 && reducedRight === 5) {
            reducedLeft = 16;
            reducedRight = 10;
        }
        return `${reducedLeft} : ${reducedRight}`;
    }

    function formatStandardLabel(standard) {
        return `1 : ${standard.ratio.toFixed(2)}`;
    }

    function updateStandardMatch(ratio) {
        if (!Number.isFinite(ratio) || ratio <= 0) {
            els.standardMatch.textContent = "";
            els.standardTags.innerHTML = "";
            els.standardSensors.textContent = "";
            return;
        }
        let closest = ratioStandards[0];
        let bestDiff = Math.abs(ratio - closest.ratio);
        for (let i = 1; i < ratioStandards.length; i += 1) {
            const diff = Math.abs(ratio - ratioStandards[i].ratio);
            if (diff < bestDiff) {
                bestDiff = diff;
                closest = ratioStandards[i];
            }
        }
        const pct = (bestDiff / closest.ratio) * 100;
        const pctText = pct < 0.05 ? "Exact match" : `${pct.toFixed(2)}% off`;
        els.standardMatch.textContent = `Closest: ${formatStandardLabel(closest)} · ${closest.note} · ${pctText}`;
        els.standardSensors.textContent = closest.sensors ? `Sensors: ${closest.sensors}` : "";
        renderTags(ratio, closest);
    }

    function renderTags(ratio, closest) {
        const tags = [];
        if (ratioGuides.streamingSafe.includes(closest.ratio)) {
            tags.push({ label: "Streaming-Safe", className: "streaming" });
        } else if (closest.streamingSafe === "limited") {
            tags.push({ label: "Streaming-Limited", className: "legacy" });
        } else if (closest.streamingSafe === false) {
            tags.push({ label: "Streaming-Risky", className: "legacy" });
        }

        if (Math.abs(closest.ratio - 1.9) < 0.01) {
            tags.push({ label: "IMAX-Centric", className: "imax" });
        } else if (ratioGuides.imaxCentric.includes(closest.ratio)) {
            tags.push({ label: "IMAX Option", className: "imax" });
        }

        if (ratio >= 2.35 && ratio <= 2.4) {
            tags.push({ label: "Anamorphic-Native", className: "anamorphic" });
        }

        if (ratio >= ratioGuides.theatricalOnlyMin) {
            tags.push({ label: "Theatrical-Only", className: "theatrical" });
        }

        if (ratio < 1.5) {
            tags.push({ label: "Legacy Frame", className: "legacy" });
        }

        els.standardTags.innerHTML = "";
        tags.forEach((tag) => {
            const span = document.createElement("span");
            span.className = `tag ${tag.className}`;
            span.textContent = tag.label;
            els.standardTags.appendChild(span);
        });
    }

    function getSqueezeFactor() {
        const value = Number(els.squeeze.value || 1);
        return Number.isFinite(value) && value > 0 ? value : 1;
    }

    function solve(width, height, numerator, denominator) {
        if (width !== null && width !== undefined) {
            return width / (numerator / denominator);
        }
        if (height !== null && height !== undefined) {
            return height * (numerator / denominator);
        }
        return NaN;
    }

    function updateVisual(numerator, denominator, targetWidth, targetHeight) {
        const visual = els.visual;
        if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
            return;
        }
        const ratio = numerator / denominator;
        const max = 520;
        let width = max;
        let height = max;
        if (ratio >= 1) {
            height = Math.max(220, Math.round(max / ratio));
        } else {
            width = Math.max(320, Math.round(max * ratio));
        }
        visual.style.width = `${width}px`;
        visual.style.height = `${height}px`;
        visual.style.lineHeight = `${height}px`;
        const maxDim = Math.max(targetWidth || 0, targetHeight || 0);
        if (Number.isFinite(targetWidth) && Number.isFinite(targetHeight) && maxDim > 0) {
            const widthPct = Math.min(100, Math.max(8, Math.round((targetWidth / maxDim) * 100)));
            const heightPct = Math.min(100, Math.max(8, Math.round((targetHeight / maxDim) * 100)));
            els.previewLineH.style.width = `${widthPct}%`;
            els.previewLineV.style.height = `${heightPct}%`;
        } else {
            els.previewLineH.style.width = "100%";
            els.previewLineV.style.height = "100%";
        }
        if (Number.isFinite(targetWidth) && Number.isFinite(targetHeight)) {
            els.previewWidth.textContent = `${formatNumber(targetWidth)}w`;
            els.previewHeight.textContent = `${formatNumber(targetHeight)}h`;
        } else {
            els.previewWidth.textContent = "";
            els.previewHeight.textContent = "";
        }
    }

    function showError(message) {
        els.errors.textContent = message || "";
    }

    function updatePresetSelection(x1, y1) {
        const value = `${x1}x${y1}`;
        const match = Array.from(els.ratios.options).find((option) => option.value === value);
        if (match) {
            els.ratios.value = value;
        }
    }

    function storeBase(x1, y1) {
        localStorage.setItem(storageKeys.base, JSON.stringify({ x1, y1 }));
    }

    function addHistory(entry) {
        const history = JSON.parse(localStorage.getItem(storageKeys.history) || "[]");
        history.unshift(entry);
        const trimmed = history.slice(0, 6);
        localStorage.setItem(storageKeys.history, JSON.stringify(trimmed));
        window.dispatchEvent(new Event("arc-history"));
    }

    function compute(target) {
        const x1Raw = els.x1.value.trim();
        const y1Raw = els.y1.value.trim();
        const x2Raw = els.x2.value.trim();
        const y2Raw = els.y2.value.trim();

        if (![x1Raw, y1Raw, x2Raw, y2Raw].every((val) => val === "" || isPositiveNumber(val))) {
            showError("Please enter numbers only.");
            return;
        }

        const x1 = parseNumber(x1Raw);
        const y1 = parseNumber(y1Raw);
        const x2 = parseNumber(x2Raw);
        const y2 = parseNumber(y2Raw);

        if (!Number.isFinite(x1) || !Number.isFinite(y1)) {
            showError("Base width and height are required.");
            return;
        }

        showError("");
        storeBase(x1, y1);
        updatePresetSelection(x1, y1);
        const squeeze = getSqueezeFactor();
        const effectiveY1 = y1 / squeeze;
        els.ratioText.textContent = reduceRatio(x1, effectiveY1);
        updateStandardMatch(x1 / effectiveY1);
        updateVisual(x1, effectiveY1, x2, y2);

        if (!target) return;

        if (target === els.x1 || target === els.y1) {
            if (Number.isFinite(y2)) {
                const newX2 = solve(null, y2, x1, effectiveY1);
                els.x2.value = formatNumber(newX2);
                flashField(els.x2);
            }
        } else if (target === els.x2) {
            if (Number.isFinite(x2)) {
                const newY2 = solve(x2, null, x1, effectiveY1);
                els.y2.value = formatNumber(newY2);
                flashField(els.y2);
            }
        } else if (target === els.y2) {
            if (Number.isFinite(y2)) {
                const newX2 = solve(null, y2, x1, effectiveY1);
                els.x2.value = formatNumber(newX2);
                flashField(els.x2);
            }
        }

        updateVisual(x1, effectiveY1, parseNumber(els.x2.value), parseNumber(els.y2.value));

        addHistory({
            time: new Date().toISOString(),
            x1,
            y1,
            x2: els.x2.value.trim(),
            y2: els.y2.value.trim(),
            squeeze
        });
    }

    function resetValues() {
        const stored = JSON.parse(localStorage.getItem(storageKeys.base) || "{}");
        const x1 = stored.x1 || 1920;
        const y1 = stored.y1 || 1080;
        els.x1.value = x1;
        els.y1.value = y1;
        els.x2.value = "";
        els.y2.value = "";
        compute(null);
    }

    function updateSampleVisibility() {
        if (els.sampleToggle.checked) {
            els.cropPanel.classList.remove("hidden");
            showSample();
        } else {
            els.cropPanel.classList.add("hidden");
            hideSample();
        }
    }

    function hideSample() {
        const img = els.visual.querySelector("img");
        if (img) img.remove();
        els.visual.classList.remove("has-sample");
    }

    function showSample() {
        let img = els.visual.querySelector("img");
        if (!img) {
            img = document.createElement("img");
            img.alt = "Preview";
            els.visual.appendChild(img);
        }
        img.src = els.sampleUrl.value.trim() || defaultSampleUrl;
        img.style.objectFit = getCropMode() === "crop" ? "cover" : "contain";
        els.visual.classList.add("has-sample");
    }

    function getCropMode() {
        const selected = qa(selectors.cropOptions).find((input) => input.checked);
        return selected ? selected.value : "letterbox";
    }

    function updateSampleFit() {
        const img = els.visual.querySelector("img");
        if (img) {
            img.style.objectFit = getCropMode() === "crop" ? "cover" : "contain";
        }
    }

    function handleInput(evt) {
        state.lastTarget = evt.target;
        compute(evt.target);
    }

    function initTheme() {
        const toggle = els.themeToggle;
        const root = document.documentElement;
        const stored = localStorage.getItem(storageKeys.theme);
        const initial = stored || root.dataset.theme || "auto";
        root.dataset.theme = initial;
        setThemeLabel(initial);

        toggle.addEventListener("click", () => {
            const next = root.dataset.theme === "auto" ? "dark" : root.dataset.theme === "dark" ? "light" : "auto";
            root.dataset.theme = next;
            localStorage.setItem(storageKeys.theme, next);
            setThemeLabel(next);
        });
    }

    function setThemeLabel(mode) {
        const label = mode.charAt(0).toUpperCase() + mode.slice(1);
        els.themeToggle.textContent = `Theme: ${label}`;
    }

    function initTexture() {
        const toggle = els.textureToggle;
        const body = document.body;
        state.textureIndex = Number(body.dataset.texture || 1);
        toggle.textContent = `Texture: ${state.textureIndex}`;
        toggle.addEventListener("click", () => {
            state.textureIndex = state.textureIndex >= 3 ? 1 : state.textureIndex + 1;
            body.dataset.texture = state.textureIndex.toString();
            toggle.textContent = `Texture: ${state.textureIndex}`;
        });
    }

    function initEvents() {
        [els.x1, els.y1, els.x2, els.y2].forEach((input) => {
            input.addEventListener("input", handleInput);
        });

        els.round.addEventListener("change", () => compute(state.lastTarget || els.x2));
        els.squeeze.addEventListener("change", () => compute(state.lastTarget || els.x2));

        els.ratios.addEventListener("change", () => {
            const [x1, y1] = els.ratios.value.split("x").map(Number);
            els.x1.value = x1;
            els.y1.value = y1;
            els.x2.value = "";
            els.y2.value = "";
            compute(els.x1);
        });

        els.resetBtn.addEventListener("click", resetValues);

        els.sampleToggle.addEventListener("change", updateSampleVisibility);
        els.sampleUrl.addEventListener("input", showSample);
        qa(selectors.cropOptions).forEach((input) => {
            input.addEventListener("change", updateSampleFit);
        });
    }

    function initYear() {
        const year = document.getElementById("current-year");
        if (year) year.textContent = new Date().getFullYear().toString();
    }

    function init() {
        initElements();
        initTheme();
        initTexture();
        initEvents();
        initYear();
        updateSampleVisibility();
        resetValues();
    }

    document.addEventListener("DOMContentLoaded", init);
})();

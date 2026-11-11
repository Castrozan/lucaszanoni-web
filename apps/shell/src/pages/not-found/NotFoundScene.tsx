export function NotFoundScene() {
  return (
    <div className="not-found-scene" aria-hidden="true">
      <svg viewBox="0 0 640 460" fill="none" focusable="false">
        <defs>
          <pattern
            id="not-found-grid"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <path d="M36 0H0V36" stroke="var(--ls-color-border)" />
          </pattern>
        </defs>
        <rect
          x="24"
          y="24"
          width="592"
          height="388"
          fill="url(#not-found-grid)"
          opacity="0.65"
        />
        <path
          d="M24 48V24H48M592 24H616V48M616 388V412H592M48 412H24V388"
          stroke="var(--ls-color-text-faint)"
        />
        <path
          d="M64 88H176L204 60H258"
          stroke="var(--ls-color-border)"
          strokeDasharray="4 6"
        />
        <circle cx="64" cy="88" r="4" fill="var(--ls-color-accent)" />
        <text x="34" y="322" className="not-found-numeral">
          4
        </text>
        <rect
          x="254"
          y="113"
          width="150"
          height="212"
          rx="75"
          stroke="var(--ls-color-accent)"
          strokeWidth="32"
          transform="rotate(14 329 219)"
        />
        <text x="426" y="322" className="not-found-numeral">
          4
        </text>
        <path
          d="M48 368H194L216 390H246M402 390H432L454 368H592"
          stroke="var(--ls-color-text-muted)"
          strokeWidth="2"
          strokeDasharray="6 8"
        />
        <path
          d="M234 383L246 390L234 397M580 361L592 368L580 375"
          stroke="var(--ls-color-text-muted)"
          strokeWidth="2"
        />
        <path
          d="M280 374H366"
          stroke="var(--ls-color-accent)"
          strokeWidth="3"
        />
        <g className="not-found-traveler">
          <path
            d="M308 358V372M336 358V372"
            stroke="var(--ls-color-text-primary)"
            strokeWidth="4"
          />
          <rect
            x="294"
            y="312"
            width="56"
            height="48"
            rx="4"
            fill="var(--ls-color-text-primary)"
          />
          <path
            d="M310 328V338M334 328V338"
            stroke="var(--ls-color-background)"
            strokeWidth="5"
          />
          <path
            d="M316 347H328"
            stroke="var(--ls-color-background)"
            strokeWidth="2"
          />
        </g>
        <g className="not-found-question">
          <path
            d="M390 308V294H406V308H398V316M398 322V326"
            stroke="var(--ls-color-accent-secondary)"
            strokeWidth="3"
          />
        </g>
        <path
          d="M524 67V91M512 79H536"
          stroke="var(--ls-color-accent-secondary)"
          strokeWidth="2"
        />
        <circle cx="564" cy="114" r="6" stroke="var(--ls-color-text-faint)" />
        <text x="320" y="448" className="not-found-scene-caption">
          YOU ARE HERE. PROBABLY.
        </text>
      </svg>
    </div>
  );
}

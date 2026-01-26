/**
 * SplitChars – wraps each character of `text` in an individual <span>
 * so GSAP can animate them one by one.
 *
 * Props:
 *   text      – the string to split
 *   className – optional class on the outer <span>
 *   charClass – class applied to every character <span> (usually styles.char)
 */
export default function SplitChars({ text, className, charClass }) {
    return (
        <span className={className} aria-label={text}>
            {text.split('').map((ch, i) => (
                <span
                    key={i}
                    className={charClass}
                    aria-hidden="true"
                    style={{
                        display: ch === ' ' ? 'inline-block' : undefined,
                        minWidth: ch === ' ' ? '0.35em' : undefined,
                    }}
                >
                    {ch}
                </span>
            ))}
        </span>
    )
}

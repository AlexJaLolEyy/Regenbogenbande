export interface BubbleLayout {
    /** Bubble is on the right side */
    isRight: boolean;
    /** Same speaker as the previous bubble (avatar/name are hidden) */
    sameAsPrev: boolean;
}

/**
 * Computes chat bubble sides for a quote. The side flips only when the speaker
 * changes, so consecutive messages from one user stay on the same side.
 *
 * @param speakers one entry per message: the speaker's user id, or null for context messages
 * @param resetOnContext if true, a context message ends the current speaker "run"
 */
export function computeBubbleLayout(speakers: (string | null)[], resetOnContext = false): BubbleLayout[] {
    let side = false;
    let last: string | null = null;
    return speakers.map((speaker) => {
        if (speaker === null) {
            if (resetOnContext) last = null;
            return { isRight: side, sameAsPrev: false };
        }
        const sameAsPrev = last === speaker;
        if (last !== null && !sameAsPrev) side = !side;
        last = speaker;
        return { isRight: side, sameAsPrev };
    });
}

"use client";

import type { ReactNode } from "react";
import { fill } from "@/content/template";
import { useArabic } from "@/l10n/arabic";
import { isArabic } from "@/l10n/bidi";
import { BidiText } from "@/l10n/SupportiveText";
import l10n from "@/l10n/l10n.module.css";
import { messageTemplate } from "@/tutor/messages";
import styles from "./Stage.module.css";

/**
 * The quiet way back to a skipped question or practice (#623), as one catalogue sentence with a
 * link inside it (#705): the template's `{slot}` is where `children` (the link) goes; the text
 * around it is the English, or the owner's Arabic on an `rtl` text element.
 */
export function ReturnOffer({ k, slot, value, children }: { k: string; slot: string; value: string; children: ReactNode }) {
  const { translate } = useArabic();
  const template = messageTemplate(k);
  const text = translate(template);
  const [before = "", after = ""] = text.split(`{${slot}}`);
  const arabic = text !== template && isArabic(text);
  const part = (s: string) => (arabic ? <BidiText text={fill(s, { [slot]: value })} /> : fill(s, { [slot]: value }));
  const body = (
    <>
      {part(before)}
      {children}
      {part(after)}
    </>
  );
  return (
    <p className={styles.returnOffer}>
      {arabic ? (
        <span dir="rtl" lang="ar" className={`${l10n.ar} ${l10n.inline}`}>
          {body}
        </span>
      ) : (
        body
      )}
    </p>
  );
}

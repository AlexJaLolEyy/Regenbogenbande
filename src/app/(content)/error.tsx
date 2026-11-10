"use client";

import { Button } from "@heroui/react";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Etwas ist schiefgelaufen</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Das hat nicht geklappt. Versuch es nochmal, oder lade die Seite neu.
      </p>
      <Button variant="flat" onPress={reset}>
        Erneut versuchen
      </Button>
    </div>
  );
}

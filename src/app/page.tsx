import { getSession } from "@/src/lib/auth-utils";
import { getEffectiveRole } from "@/src/lib/auth-utils-shared";
import { HomeView } from "@/src/lib/components/home/home-view";
import { getPicturesForList } from "@/src/lib/db/selects/pictures";
import { getQuotesForList } from "@/src/lib/db/selects/quotes";
import { getVideosForList } from "@/src/lib/db/selects/videos";

export default async function Home() {
    const session = await getSession();
    const isGuest = getEffectiveRole(session) === "guest";

    // Guest-aware selects only: guests see public items and public counts.
    const opts = { limit: 4, sort: "newest" } as const;
    const [videos, pictures, quotes] = await Promise.all([
        getVideosForList(session, opts),
        getPicturesForList(session, opts),
        getQuotesForList(session, opts),
    ]);

    return (
        <HomeView
            isGuest={isGuest}
            counts={{ videos: videos.total, pictures: pictures.total, quotes: quotes.total }}
            recent={{ videos: videos.items, pictures: pictures.items, quotes: quotes.items }}
        />
    );
}

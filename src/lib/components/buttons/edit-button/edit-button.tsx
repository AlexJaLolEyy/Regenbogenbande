
export default function EditButton({ title, href }: { title: string, href?: string }

    ) {
        return (
            // TODO: add custom icon + Link back to site -> option with onclick="location.href=..."
            <button title={title}>
                <a href={href}></a>
            </button>
        )
    }
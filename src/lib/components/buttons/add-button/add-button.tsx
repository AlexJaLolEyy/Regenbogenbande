
export default function AddButton({ title, href }: { title: string, href?: string }

) {
    return (
        // TODO: add custom icon -> option with onclick="location.href=..."
        <button title={title}>
            <a href={href}></a>
        </button>
    )
}
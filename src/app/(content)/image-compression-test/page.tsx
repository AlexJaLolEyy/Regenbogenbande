"use client";

import { useState } from "react";

interface CompressionResult {
    format: string;
    quality: number;
    size: number;
    sizeFormatted: string;
    reduction: string;
    path: string;
}

interface TestResult {
    testId: string;
    original: {
        name: string;
        type: string;
        size: number;
        sizeFormatted: string;
        width: number;
        height: number;
    };
    results: CompressionResult[];
}

export default function ImageCompressionTestPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TestResult | null>(null);
    const [error, setError] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        if (selectedFile) {
            setPreview(URL.createObjectURL(selectedFile));
        } else {
            setPreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setResult(null);
        setError("");

        try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch("/api/image-compress-test", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Test failed");
            }

            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    // Group results by format
    const groupedResults = result?.results.reduce((acc, r) => {
        const key = r.format;
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
    }, {} as Record<string, CompressionResult[]>);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 pt-24">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">🖼️ Image Compression Test</h1>
                <p className="text-gray-400 mb-8">
                    Upload an image (PNG or JPEG) and test different compression strategies.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* File Input */}
                    <div className="bg-gray-800 rounded-xl p-6">
                        <label className="block text-sm font-medium mb-2">Select Image</label>
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleFileChange}
                            className="w-full p-3 bg-gray-700 rounded-lg"
                        />
                        {file && (
                            <div className="mt-4 flex items-start gap-4">
                                {preview && (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-32 h-32 object-cover rounded-lg"
                                    />
                                )}
                                <div>
                                    <p className="text-sm text-gray-400">{file.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">{file.type}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!file || loading}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-colors"
                    >
                        {loading ? "Testing..." : "Run Compression Tests"}
                    </button>
                </form>

                {/* Error */}
                {error && (
                    <div className="mt-6 p-4 bg-red-900/30 border border-red-500 rounded-xl">
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="mt-8 space-y-6">
                        <h2 className="text-2xl font-bold">Results</h2>

                        {/* Original Info */}
                        <div className="bg-gray-800 rounded-xl p-6">
                            <h3 className="font-medium text-gray-400 mb-2">Original Image</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Size</p>
                                    <p className="text-xl font-bold">{result.original.sizeFormatted}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Dimensions</p>
                                    <p className="text-xl font-bold">
                                        {result.original.width} × {result.original.height}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Type</p>
                                    <p className="text-lg font-medium">{result.original.type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Name</p>
                                    <p className="text-sm truncate">{result.original.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Comparison Table */}
                        <div className="bg-gray-800 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Format</th>
                                        <th className="px-4 py-3 text-left">Quality</th>
                                        <th className="px-4 py-3 text-left">Size</th>
                                        <th className="px-4 py-3 text-left">Reduction</th>
                                        <th className="px-4 py-3 text-left">Preview</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.results.map((r, i) => (
                                        <tr key={i} className="border-t border-gray-700">
                                            <td className="px-4 py-3 font-medium">{r.format}</td>
                                            <td className="px-4 py-3">{r.quality}%</td>
                                            <td className="px-4 py-3">{r.sizeFormatted}</td>
                                            <td
                                                className={`px-4 py-3 ${r.reduction.startsWith("-")
                                                        ? "text-red-400"
                                                        : r.reduction === "0%"
                                                            ? "text-gray-400"
                                                            : "text-green-400"
                                                    }`}
                                            >
                                                {r.reduction}
                                            </td>
                                            <td className="px-4 py-3">
                                                <a
                                                    href={r.path}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-purple-400 hover:text-purple-300"
                                                >
                                                    View →
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Visual Comparison by Format */}
                        {groupedResults && Object.entries(groupedResults).map(([format, items]) => (
                            <div key={format} className="space-y-4">
                                <h3 className="text-xl font-bold">{format}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {items.map((r, i) => (
                                        <a
                                            key={i}
                                            href={r.path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-gray-800 rounded-xl overflow-hidden hover:ring-2 ring-purple-500 transition-all"
                                        >
                                            <img
                                                src={r.path}
                                                alt={`${r.format} Q${r.quality}`}
                                                className="w-full aspect-square object-cover bg-gray-700"
                                            />
                                            <div className="p-3">
                                                <p className="text-sm font-medium">Q{r.quality}</p>
                                                <p className="text-xs text-gray-400">{r.sizeFormatted}</p>
                                                <p
                                                    className={`text-xs ${r.reduction.startsWith("-")
                                                            ? "text-red-400"
                                                            : "text-green-400"
                                                        }`}
                                                >
                                                    {r.reduction}
                                                </p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

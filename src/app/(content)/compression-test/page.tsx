"use client";

import { useState } from "react";

const CRF_PRESETS = {
    ultra: { crf: 18, description: "Near lossless, huge files" },
    high: { crf: 20, description: "High quality (~-30% size)" },
    quality: { crf: 22, description: "Good quality (~-50% size)" },
    balanced: { crf: 24, description: "Balanced (~-65% size)" },
    standard: { crf: 26, description: "Standard (~-75% size)" },
    aggressive: { crf: 28, description: "Aggressive (~-85% size)" },
};

type PresetName = keyof typeof CRF_PRESETS;
type Mode = "presets" | "adaptive";

interface CompressionResult {
    preset: string;
    crf: number;
    size: number;
    sizeFormatted: string;
    reduction: string;
    path: string;
    processingTime: number;
}

interface TestResult {
    testId: string;
    original: {
        name: string;
        size: number;
        sizeFormatted: string;
    };
    results: CompressionResult[];
}

interface AdaptiveResult {
    testId: string;
    original: {
        name: string;
        size: number;
        sizeMB: string;
    };
    result: {
        size: number;
        sizeMB: string;
        reduction: string;
        crf: number | "original";
        method: string;
        path: string;
    };
    attempts: Array<{
        crf: number | "original";
        size: number;
        sizeMB: number;
        reduction: number;
        status: string;
    }>;
    qualityMode: boolean;
}

export default function CompressionTestPage() {
    const [mode, setMode] = useState<Mode>("presets");
    const [file, setFile] = useState<File | null>(null);
    const [selectedPresets, setSelectedPresets] = useState<PresetName[]>(["quality", "balanced", "standard"]);
    const [qualityMode, setQualityMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState("");
    const [presetResult, setPresetResult] = useState<TestResult | null>(null);
    const [adaptiveResult, setAdaptiveResult] = useState<AdaptiveResult | null>(null);
    const [error, setError] = useState("");

    const handlePresetToggle = (preset: PresetName) => {
        setSelectedPresets((prev) =>
            prev.includes(preset) ? prev.filter((p) => p !== preset) : [...prev, preset]
        );
    };

    const handlePresetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || selectedPresets.length === 0) return;

        setLoading(true);
        setProgress(`Compressing with ${selectedPresets.length} presets... This may take a while.`);
        setPresetResult(null);
        setAdaptiveResult(null);
        setError("");

        try {
            const formData = new FormData();
            formData.append("video", file);
            formData.append("presets", selectedPresets.join(","));

            const response = await fetch("/api/compress-test", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Compression test failed");
            }

            setPresetResult(data);
            setProgress("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            setProgress("");
        } finally {
            setLoading(false);
        }
    };

    const handleAdaptiveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setProgress(`Running adaptive compression${qualityMode ? " (Quality Mode)" : ""}...`);
        setPresetResult(null);
        setAdaptiveResult(null);
        setError("");

        try {
            const formData = new FormData();
            formData.append("video", file);
            formData.append("qualityMode", qualityMode.toString());

            const response = await fetch("/api/compress-adaptive", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Adaptive compression failed");
            }

            setAdaptiveResult(data);
            setProgress("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            setProgress("");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 pt-24">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">🎬 Video Compression Test</h1>
                <p className="text-gray-400 mb-8">
                    Upload a video and test different compression strategies.
                </p>

                {/* Mode Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setMode("presets")}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${mode === "presets"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                    >
                        📊 Compare Presets
                    </button>
                    <button
                        onClick={() => setMode("adaptive")}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${mode === "adaptive"
                            ? "bg-green-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                    >
                        🤖 Adaptive (Smart)
                    </button>
                </div>

                {/* File Input - Shared */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                    <label className="block text-sm font-medium mb-2">Select Video</label>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full p-3 bg-gray-700 rounded-lg"
                    />
                    {file && (
                        <p className="mt-2 text-sm text-gray-400">
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                    )}
                </div>

                {/* Preset Mode */}
                {mode === "presets" && (
                    <form onSubmit={handlePresetSubmit} className="space-y-6">
                        <div className="bg-gray-800 rounded-xl p-6">
                            <label className="block text-sm font-medium mb-4">Select Compression Presets</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {(Object.entries(CRF_PRESETS) as [PresetName, typeof CRF_PRESETS.ultra][]).map(
                                    ([name, { crf, description }]) => (
                                        <label
                                            key={name}
                                            className={`flex items-start p-4 rounded-lg cursor-pointer transition-all ${selectedPresets.includes(name)
                                                ? "bg-purple-600/30 border-2 border-purple-500"
                                                : "bg-gray-700 border-2 border-transparent hover:border-gray-500"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPresets.includes(name)}
                                                onChange={() => handlePresetToggle(name)}
                                                className="mt-1 mr-3"
                                            />
                                            <div>
                                                <span className="font-medium capitalize">{name}</span>
                                                <span className="text-sm text-gray-400 ml-2">CRF {crf}</span>
                                                <p className="text-xs text-gray-500 mt-1">{description}</p>
                                            </div>
                                        </label>
                                    )
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!file || selectedPresets.length === 0 || loading}
                            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-colors"
                        >
                            {loading ? "Compressing..." : `Test ${selectedPresets.length} Presets`}
                        </button>
                    </form>
                )}

                {/* Adaptive Mode */}
                {mode === "adaptive" && (
                    <form onSubmit={handleAdaptiveSubmit} className="space-y-6">
                        <div className="bg-gray-800 rounded-xl p-6">
                            <h3 className="font-medium mb-4">Adaptive Compression Settings</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Automatically chooses the best compression level based on your video.
                                Starts with CRF 24, falls back to CRF 26 if needed.
                            </p>

                            <label className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={qualityMode}
                                    onChange={(e) => setQualityMode(e.target.checked)}
                                    className="w-5 h-5"
                                />
                                <div>
                                    <span className="font-medium">Quality Mode</span>
                                    <p className="text-sm text-gray-400">
                                        Use CRF 20 for high-detail content (shaders, cinematics)
                                    </p>
                                </div>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={!file || loading}
                            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-colors"
                        >
                            {loading ? "Processing..." : "Run Adaptive Compression"}
                        </button>
                    </form>
                )}

                {/* Progress */}
                {progress && (
                    <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500 rounded-xl">
                        <p className="text-blue-300">{progress}</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-6 p-4 bg-red-900/30 border border-red-500 rounded-xl">
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                {/* Preset Results */}
                {presetResult && (
                    <div className="mt-8 space-y-6">
                        <h2 className="text-2xl font-bold">Results</h2>

                        <div className="bg-gray-800 rounded-xl p-6">
                            <h3 className="font-medium text-gray-400 mb-2">Original Video</h3>
                            <p className="text-xl font-bold">{presetResult.original.sizeFormatted}</p>
                            <p className="text-sm text-gray-500">{presetResult.original.name}</p>
                        </div>

                        <div className="bg-gray-800 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Preset</th>
                                        <th className="px-4 py-3 text-left">CRF</th>
                                        <th className="px-4 py-3 text-left">Size</th>
                                        <th className="px-4 py-3 text-left">Reduction</th>
                                        <th className="px-4 py-3 text-left">Time</th>
                                        <th className="px-4 py-3 text-left">Preview</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {presetResult.results.map((r) => (
                                        <tr key={r.preset} className="border-t border-gray-700">
                                            <td className="px-4 py-3 font-medium capitalize">{r.preset}</td>
                                            <td className="px-4 py-3">{r.crf}</td>
                                            <td className="px-4 py-3">{r.sizeFormatted}</td>
                                            <td className={`px-4 py-3 ${r.reduction.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                                                {r.reduction}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">{(r.processingTime / 1000).toFixed(1)}s</td>
                                            <td className="px-4 py-3">
                                                {r.path ? (
                                                    <a href={r.path} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                                                        View →
                                                    </a>
                                                ) : (
                                                    <span className="text-red-400">Failed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {presetResult.results.filter((r) => r.path).map((r) => (
                                <div key={r.preset} className="bg-gray-800 rounded-xl overflow-hidden">
                                    <video controls className="w-full aspect-video bg-black">
                                        <source src={r.path} type="video/mp4" />
                                    </video>
                                    <div className="p-4">
                                        <h4 className="font-bold capitalize">{r.preset}</h4>
                                        <p className="text-sm text-gray-400">
                                            CRF {r.crf} • {r.sizeFormatted} • {r.reduction}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Adaptive Results */}
                {adaptiveResult && (
                    <div className="mt-8 space-y-6">
                        <h2 className="text-2xl font-bold">Adaptive Compression Result</h2>

                        {/* Summary Card */}
                        <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-xl p-6 border border-green-500/50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-sm text-gray-400">Original</p>
                                    <p className="text-2xl font-bold">{adaptiveResult.original.sizeMB} MB</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Final Size</p>
                                    <p className="text-2xl font-bold text-green-400">{adaptiveResult.result.sizeMB} MB</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Reduction</p>
                                    <p className={`text-2xl font-bold ${adaptiveResult.result.reduction.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                                        {adaptiveResult.result.reduction}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Method Used */}
                        <div className="bg-gray-800 rounded-xl p-6">
                            <h3 className="font-medium text-gray-400 mb-2">Compression Method Used</h3>
                            <p className="text-lg">
                                <span className="font-bold text-yellow-400">
                                    {adaptiveResult.result.crf === 'original' ? 'Original File' : `CRF ${adaptiveResult.result.crf}`}
                                </span>
                            </p>
                            <p className="text-sm text-gray-400 mt-2">{adaptiveResult.result.method}</p>
                            {adaptiveResult.qualityMode && (
                                <span className="inline-block mt-2 px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm">
                                    Quality Mode
                                </span>
                            )}
                        </div>

                        {/* Attempts Log */}
                        <div className="bg-gray-800 rounded-xl p-6">
                            <h3 className="font-medium text-gray-400 mb-4">Compression Attempts</h3>
                            <div className="space-y-2">
                                {adaptiveResult.attempts.map((attempt, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between p-3 rounded-lg ${attempt.status === 'success' ? 'bg-green-900/30' :
                                            attempt.status === 'inflated' ? 'bg-red-900/30' : 'bg-yellow-900/30'
                                            }`}
                                    >
                                        <span>CRF {attempt.crf}</span>
                                        <span>{attempt.sizeMB.toFixed(2)} MB</span>
                                        <span className={
                                            attempt.reduction < 0 ? 'text-red-400' : 'text-green-400'
                                        }>
                                            {attempt.reduction.toFixed(1)}%
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs ${attempt.status === 'success' ? 'bg-green-600' :
                                            attempt.status === 'inflated' ? 'bg-red-600' : 'bg-yellow-600'
                                            }`}>
                                            {attempt.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Video Preview */}
                        <div className="bg-gray-800 rounded-xl overflow-hidden">
                            <video controls className="w-full aspect-video bg-black">
                                <source src={adaptiveResult.result.path} type="video/mp4" />
                            </video>
                            <div className="p-4">
                                <h4 className="font-bold">Final Result</h4>
                                <p className="text-sm text-gray-400">
                                    {adaptiveResult.result.crf === 'original' ? 'Original' : `CRF ${adaptiveResult.result.crf}`} • {adaptiveResult.result.sizeMB} MB • {adaptiveResult.result.reduction}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


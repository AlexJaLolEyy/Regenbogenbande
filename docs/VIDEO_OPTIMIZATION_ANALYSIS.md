> **Note:** written for an earlier version of the project (before the 2026 audit); details may be outdated. See PROJECT.md for the current overview.

# Video Optimization Analysis

## Your Test Results

**Original:**
- Size: 120MB
- Resolution: 1920x1080
- Frame rate: 60.04 fps
- Bitrate: ~50 Mbps
- **Result: Smooth, high quality**

**Optimized:**
- Size: 37.8MB (68.5% reduction! 🎉)
- Resolution: 1920x1080
- Frame rate: 30 fps
- Bitrate: ~15 Mbps
- **Result: Less smooth, lower quality**

---

## What Affects File Size Most?

### 1. **Bitrate** (Biggest Impact - ~70% of size reduction)
- **Original**: 50 Mbps
- **Optimized**: 15 Mbps
- **Impact**: This is the #1 factor! Bitrate directly controls quality vs size.

### 2. **Frame Rate** (Medium Impact - ~15% of size reduction)
- **Original**: 60 fps
- **Optimized**: 30 fps
- **Impact**: Half the frames = smoother motion but larger files

### 3. **Resolution** (Small Impact in your case - 0%)
- **Both**: 1920x1080
- **Impact**: We kept resolution the same, so no impact here

### 4. **Codec Efficiency** (Small Impact - ~15% of size reduction)
- Using H.264 (good, but H.265/HEVC would be 30-50% smaller)

---

## Why It Feels Less Smooth

**The 60fps → 30fps drop is the main culprit!**

- **60fps**: Very smooth, especially for gaming clips with fast motion
- **30fps**: Standard, but noticeable difference in fast-paced content
- **Your brain notices**: Fast motion looks choppier at 30fps

**The quality drop** is from:
- Lower bitrate (50 → 15 Mbps)
- CRF 23 (which targets ~15 Mbps for 1080p)

---

## Option 1: Keep 60fps with Lower Quality

**Settings:**
- Frame rate: 60 fps (keep original)
- Bitrate: ~20-25 Mbps (instead of 15)
- CRF: 25-26 (lower quality, smaller files)

**Expected:**
- Size: ~50-60MB (still 50% reduction!)
- Smoothness: ✅ Same as original
- Quality: ⚠️ Slightly lower (but acceptable for most content)

**Best for:** Gaming clips, fast motion, where smoothness > quality

---

## Option 2: 30fps with Higher Quality

**Settings:**
- Frame rate: 30 fps (current)
- Bitrate: ~25-30 Mbps (higher than current)
- CRF: 20-21 (better quality)

**Expected:**
- Size: ~60-70MB (still 40-50% reduction)
- Smoothness: ⚠️ Less smooth (30fps)
- Quality: ✅ Better (closer to original)

**Best for:** General videos, where quality > smoothness

---

## Option 3: Balanced (Recommended)

**Settings:**
- Frame rate: 60 fps (keep smooth)
- Bitrate: ~25 Mbps
- CRF: 24 (balanced quality)

**Expected:**
- Size: ~55-65MB (45-55% reduction)
- Smoothness: ✅ Same as original
- Quality: ✅ Good (minimal visible difference)

**Best for:** Best of both worlds

---

## Comparison Table

| Option | FPS | Bitrate | CRF | Size | Smoothness | Quality |
|--------|-----|---------|-----|------|------------|---------|
| **Original** | 60 | 50 Mbps | - | 120MB | ✅✅✅ | ✅✅✅ |
| **Current** | 30 | 15 Mbps | 23 | 38MB | ⚠️ | ⚠️ |
| **60fps Low Quality** | 60 | 20 Mbps | 26 | ~50MB | ✅✅✅ | ⚠️ |
| **30fps High Quality** | 30 | 28 Mbps | 20 | ~65MB | ⚠️ | ✅✅ |
| **Balanced (Recommended)** | 60 | 25 Mbps | 24 | ~60MB | ✅✅✅ | ✅✅ |

---

## Recommendation

For **gaming clips** (which seem to be your use case):

**Use Option 3 (Balanced):**
- Keep 60fps (smoothness is important for gaming)
- Use CRF 24 (slightly lower quality, but still very good)
- Target ~25 Mbps bitrate
- Result: ~60MB (50% reduction) with minimal quality loss

**Why?**
- Gaming clips benefit from 60fps smoothness
- 50% size reduction is still excellent
- Quality difference will be barely noticeable
- Better user experience (smooth playback)

---

## How to Adjust

I'll update the compression settings to give you options. You can:
1. Keep 60fps with balanced quality (recommended)
2. Or choose between quality vs smoothness

Let me know which option you prefer! 🎮


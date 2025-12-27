# VideoPlayer Zone Logic Analysis

## Overview
The VideoPlayer component displays interactive zones (hotspots) on top of videos. These zones are defined in `src/data/final_zones.json` and are rendered as SVG polygons/polylines that overlay the video content.

---

## 1. Data Structure

### final_zones.json Structure
```json
{
  "baseWidth": 1920,      // Base resolution width for coordinate system
  "baseHeight": 1080,     // Base resolution height for coordinate system
  "videos": {
    "1_amfgsl.mp4": {     // Video filename as key
      "zones": [
        {
          "id": 1,                    // Unique zone identifier
          "label": "VT 32",           // Display label shown on hover
          "points": [                 // Array of coordinate points
            { "x": 819, "y": 530 },
            { "x": 841, "y": 519 },
            // ... more points
          ],
          "visible": true             // Whether zone is shown
        }
      ]
    }
  }
}
```

### Zone Properties
- **id**: Unique identifier for the zone
- **label**: Text displayed in the hover tooltip (e.g., "VT 32", "VT 33")
- **points**: Array of `{x, y}` coordinates defining the zone shape
  - Coordinates are in base resolution (1920x1080)
  - Minimum 3 points for a polygon (closed shape)
  - Less than 3 points renders as a polyline (open shape)
- **visible**: Boolean flag to show/hide the zone

---

## 2. Zone Loading & Initialization

### Initial State Setup (Lines 54-65)
```javascript
const [zonesByVideo, setZonesByVideo] = useState(() => {
    const raw = zonesData.videos || {};
    const normalized = {};
    Object.keys(raw).forEach((key) => {
        const zones = (raw[key]?.zones || []).map((zone) => ({
            ...zone,
            visible: zone.visible !== false  // Default to true if not specified
        }));
        normalized[key] = { zones };
    });
    return normalized;
});
```

**Process:**
1. Loads zones from `final_zones.json`
2. Normalizes the data structure
3. Ensures `visible` defaults to `true` if not explicitly set to `false`
4. Creates a lookup object keyed by video filename

---

## 3. Video-to-Zone Matching

### Video Key Extraction (Lines 541-546)
```javascript
const currentVideoKey = useMemo(() => {
    if (!currentVideoSrc) return "unknown";
    const clean = currentVideoSrc.split("?")[0];  // Remove query params
    const parts = clean.split("/");
    return parts[parts.length - 1] || "unknown";  // Extract filename
}, [currentVideoSrc]);
```

**Matching Logic:**
1. Extracts the current video's source URL
2. Removes query parameters (e.g., `?v=123`)
3. Extracts the filename from the URL path
4. Uses this filename as the key to look up zones in `zonesByVideo`

**Example:**
- Video URL: `https://res.cloudinary.com/.../1_amfgsl.mp4?auto=format`
- Extracted key: `"1_amfgsl.mp4"`
- Matches zones from: `zonesByVideo["1_amfgsl.mp4"]`

### Current Zones Retrieval (Line 547)
```javascript
const currentZones = zonesByVideo[currentVideoKey]?.zones || [];
```
- Gets zones for the current video
- Returns empty array if no zones found

---

## 4. Zone Rendering

### SVG Overlay Container (Lines 883-998)
Zones are rendered in an absolute-positioned SVG overlay that sits on top of the video:

```javascript
<div
    ref={hotspotOverlayRef}
    className="absolute inset-0 z-30"
    onClick={handleOverlayClick}
    onPointerMove={handleOverlayPointerMove}
    onPointerUp={handleOverlayPointerUp}
>
    <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
        preserveAspectRatio="none"
    >
        {/* Zones rendered here */}
    </svg>
</div>
```

**Key Features:**
- **ViewBox**: Uses base resolution (1920x1080) for coordinate system
- **preserveAspectRatio="none"**: Allows zones to scale with video container
- **z-30**: Renders above video but below controls

### Zone Shape Rendering (Lines 896-975)

#### Polygon (3+ points) - Closed Shape
```javascript
{zone.points.length >= 3 ? (
    <polygon
        points={pointList}  // "x1,y1 x2,y2 x3,y3 ..."
        fill={/* conditional fill color */}
        stroke={/* conditional stroke color */}
        strokeWidth={isSelected || isHovered ? 4 : 2}
        onPointerEnter={() => setHoveredZoneId(zone.id)}
        onPointerLeave={() => setHoveredZoneId(null)}
    />
) : (
    // Polyline for < 3 points
)}
```

#### Polyline (< 3 points) - Open Shape
- Used when zone has fewer than 3 points
- Renders as a line/point instead of a closed polygon

### Visual States

#### Normal State (Not Hovered, Not Selected)
- **Fill**: `rgba(16,185,129,0.12)` - Light green, semi-transparent
- **Stroke**: `rgba(16,185,129,0.5)` - Green border
- **Stroke Width**: 2px

#### Hovered State
- **Fill**: `rgba(30,64,175,0.35)` - Blue, more opaque
- **Stroke**: `rgba(30,64,175,0.9)` - Bright blue border
- **Stroke Width**: 4px
- **Tooltip**: Shows zone label (e.g., "VT 32")

#### Selected State (Edit Mode)
- **Fill**: `rgba(139,92,246,0.28)` - Purple
- **Stroke**: `rgba(139,92,246,0.95)` - Bright purple border
- **Stroke Width**: 4px
- **Control Points**: Shows draggable points for editing

#### Hover-Only Mode (Non-Edit)
- Zones are invisible until hovered
- Fill: `rgba(16,185,129,0)` - Transparent
- Stroke: `rgba(16,185,129,0)` - Transparent
- Only appears on hover

---

## 5. Coordinate System & Scaling

### Base Resolution
- **BASE_WIDTH**: 1920px (from zonesData.baseWidth)
- **BASE_HEIGHT**: 1080px (from zonesData.baseHeight)

### Coordinate Transformation
Zones use absolute coordinates in the base resolution (1920x1080). The SVG scales these coordinates to match the actual video container size using:
- `viewBox="0 0 1920 1080"` - Defines coordinate system
- `preserveAspectRatio="none"` - Allows non-uniform scaling
- SVG automatically scales to container dimensions

### Point Conversion (Lines 573-579)
When editing zones, mouse coordinates are converted to base resolution:
```javascript
const getBasePointFromEvent = (event) => {
    const rect = getOverlayRect();
    if (!rect) return null;
    const baseX = ((event.clientX - rect.left) / rect.width) * BASE_WIDTH;
    const baseY = ((event.clientY - rect.top) / rect.height) * BASE_HEIGHT;
    return { x: Math.round(baseX), y: Math.round(baseY) };
};
```

**Formula:**
- `baseX = (mouseX / containerWidth) * 1920`
- `baseY = (mouseY / containerHeight) * 1080`

---

## 6. Interactive Features

### Hover Interaction
1. **Pointer Enter**: Sets `hoveredZoneId` to zone.id
2. **Pointer Leave**: Clears `hoveredZoneId`
3. **Tooltip Display**: Shows zone label at cursor position (Lines 978-991)

### Edit Mode (when `editZones === true`)
- **Add Points**: Click in video to add points to selected zone
- **Drag Points**: Click and drag individual points
- **Drag Zone**: Click and drag entire zone
- **Delete Points**: Alt+Click on a point
- **Delete Zone**: Use delete button in toolbar

### Zone Visibility
- Zones with `visible: false` are not rendered (Line 901-903)
- Can be toggled in edit mode

---

## 7. Zone State Management

### State Variables
- `zonesByVideo`: Main state object storing all zones by video key
- `selectedZoneId`: Currently selected zone for editing
- `hoveredZoneId`: Currently hovered zone
- `hoverPosition`: Mouse position for tooltip placement
- `draggingPoint`: Active point being dragged
- `draggingZone`: Active zone being dragged

### State Updates
All zone modifications update `zonesByVideo` state:
```javascript
setZonesByVideo((prev) => {
    const next = { ...prev };
    const currentList = next[currentVideoKey]?.zones || [];
    const updated = currentList.map((zone) => {
        // Modify zone
    });
    next[currentVideoKey] = { zones: updated };
    return next;
});
```

---

## 8. Zone Lifecycle

### On Video Change (Lines 555-558)
```javascript
useEffect(() => {
    setSelectedZoneId(null);
    setHoveredZoneId(null);
}, [currentVideoKey]);
```
- Clears selected/hovered zones when video changes
- Ensures zones match the current video

### Zone Filtering (Line 901-903)
```javascript
if (zone.visible === false) {
    return null;  // Don't render hidden zones
}
```

---

## 9. Export/Import Functionality

### Download Zones (Lines 758-773)
- Exports current `zonesByVideo` state as JSON
- Includes `baseWidth`, `baseHeight`, and all video zones
- Downloads as "zones.json"

### Import Zones (Lines 732-756)
- Reads JSON file
- Normalizes imported data
- Updates `zonesByVideo` state
- Resets selected/hovered zones

---

## 10. Key Functions Summary

| Function | Purpose |
|----------|---------|
| `getBasePointFromEvent()` | Converts mouse coordinates to base resolution |
| `handleOverlayClick()` | Adds points to selected zone in edit mode |
| `handlePointPointerDown()` | Initiates point dragging or deletion |
| `handleZonePointerDown()` | Initiates zone dragging |
| `handleOverlayPointerMove()` | Updates drag positions and hover tooltip |
| `addZone()` | Creates a new zone for current video |
| `deleteSelectedZone()` | Removes selected zone |
| `downloadZones()` | Exports zones to JSON file |
| `handleImportZones()` | Imports zones from JSON file |

---

## 11. Visual Rendering Flow

```
1. Video plays → Extract video filename from src URL
2. Lookup zones → zonesByVideo[currentVideoKey]
3. Filter zones → Remove zones where visible === false
4. Render SVG → Create polygon/polyline for each zone
5. Apply styles → Based on hover/selected state
6. Show tooltip → If hovered and not in edit mode
```

---

## 12. Example Zone Definition

```json
{
  "id": 1,
  "label": "VT 32",
  "points": [
    { "x": 819, "y": 530 },
    { "x": 841, "y": 519 },
    { "x": 852, "y": 528 },
    { "x": 850, "y": 494 },
    { "x": 905, "y": 472 },
    { "x": 961, "y": 520 },
    { "x": 963, "y": 561 },
    { "x": 983, "y": 582 },
    { "x": 903, "y": 623 }
  ],
  "visible": true
}
```

This creates a 9-point polygon that:
- Forms a closed shape around a building/area
- Shows "VT 32" label on hover
- Uses green fill/stroke when visible
- Scales automatically with video container

---

## Summary

The zone system provides:
- **Interactive hotspots** overlaid on videos
- **Coordinate-based positioning** using 1920x1080 base resolution
- **Video-specific zones** matched by filename
- **Visual feedback** through hover/selection states
- **Edit capabilities** for creating/modifying zones
- **Export/import** for zone data management

Zones are rendered as SVG shapes that scale proportionally with the video container, maintaining their relative positions regardless of screen size.


"""Generate extension icons using Python Pillow (or fallback to simple PNG)."""
import os
import struct
import zlib

def create_png(width, height, pixels):
    """Create a PNG file from raw pixel data (RGBA)."""
    def chunk(chunk_type, data):
        c = chunk_type + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    
    # PNG signature
    sig = b'\x89PNG\r\n\x1a\n'
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)  # 8-bit RGBA
    ihdr = chunk(b'IHDR', ihdr_data)
    # IDAT
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # filter none
        for x in range(width):
            idx = (y * width + x) * 4
            raw_data += bytes(pixels[idx:idx+4])
    compressed = zlib.compress(raw_data)
    idat = chunk(b'IDAT', compressed)
    # IEND
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

def draw_icon(size):
    """Draw a green rounded-rect icon with a lightning bolt."""
    pixels = [0] * (size * size * 4)  # RGBA
    
    bg_r, bg_g, bg_b = 0x86, 0xB8, 0x17  # Brand green
    fg_r, fg_g, fg_b = 0xFF, 0xFF, 0xFF  # White
    
    cx, cy = size / 2, size / 2
    radius = size * 0.15
    
    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4
            
            # Rounded rectangle background
            in_rect = True
            margin = size * 0.05
            if x < margin or x >= size - margin or y < margin or y >= size - margin:
                in_rect = False
            else:
                # Check corners
                for corner_x, corner_y in [(margin + radius, margin + radius), 
                                           (size - margin - radius, margin + radius),
                                           (margin + radius, size - margin - radius), 
                                           (size - margin - radius, size - margin - radius)]:
                    dx = abs(x - corner_x)
                    dy = abs(y - corner_y)
                    if dx < radius and dy < radius:
                        if (dx - radius)**2 + (dy - radius)**2 > radius**2:
                            in_rect = False
                            break
            
            # Lightning bolt (simplified triangle shape)
            bolt_left = cx - size * 0.12
            bolt_right = cx + size * 0.12
            bolt_top = cy - size * 0.25
            bolt_mid_top = cy + size * 0.02
            bolt_mid_left = cx - size * 0.04
            bolt_mid_right = cx + size * 0.04
            bolt_bottom = cy + size * 0.25
            
            in_bolt = False
            # Upper part of bolt (left-leaning)
            if bolt_top <= y <= bolt_mid_top:
                frac = (y - bolt_top) / (bolt_mid_top - bolt_top) if bolt_mid_top != bolt_top else 0
                left_edge = bolt_left + frac * (bolt_right * 0.3 - bolt_left)
                right_edge = bolt_right * 0.7 - frac * (bolt_right * 0.2)
                if left_edge <= x <= right_edge:
                    in_bolt = True
            # Lower part of bolt (right-leaning) 
            if bolt_mid_top <= y <= bolt_bottom:
                frac = (y - bolt_mid_top) / (bolt_bottom - bolt_mid_top) if bolt_bottom != bolt_mid_top else 0
                left_edge = bolt_right * 0.3 + frac * (bolt_left * 1.1 - bolt_right * 0.3)
                right_edge = bolt_right * 0.5 + frac * (bolt_right * 1.12 - bolt_right * 0.5)
                if left_edge <= x <= right_edge:
                    in_bolt = True
            
            if in_bolt:
                pixels[idx] = fg_r
                pixels[idx+1] = fg_g
                pixels[idx+2] = fg_b
                pixels[idx+3] = 255
            elif in_rect:
                pixels[idx] = bg_r
                pixels[idx+1] = bg_g
                pixels[idx+2] = bg_b
                pixels[idx+3] = 255
            else:
                pixels[idx] = 0
                pixels[idx+1] = 0
                pixels[idx+2] = 0
                pixels[idx+3] = 0
    
    return pixels

# Generate icons
icon_dir = os.path.dirname(os.path.abspath(__file__))
for size in [16, 48, 128]:
    pixels = draw_icon(size)
    png_data = create_png(size, size, pixels)
    filepath = os.path.join(icon_dir, f'icon{size}.png')
    with open(filepath, 'wb') as f:
        f.write(png_data)
    print(f"Created {filepath} ({len(png_data)} bytes)")

print("Done! Icons generated.")
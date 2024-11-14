from cairosvg import svg2png
from PIL import Image
import os

def convert_svg_to_png(svg_path, png_path, size):
    try:
        # Convert SVG to PNG using cairosvg
        svg2png(url=svg_path, write_to=png_path, output_width=size, output_height=size)
        
        # Open the PNG and ensure proper alpha channel
        img = Image.open(png_path)
        img = img.convert('RGBA')
        img.save(png_path, 'PNG')
        return True
    except Exception as e:
        print(f"Error converting {svg_path}: {str(e)}")
        return False

def main():
    # Convert all icons
    icon_sizes = {
        'icon-192': 192,
        'icon-512': 512,
        'icon-192-maskable': 192,
        'icon-512-maskable': 512
    }

    success = True
    for icon_name, size in icon_sizes.items():
        svg_path = f'static/images/{icon_name}.svg'
        png_path = f'static/images/{icon_name}.png'
        if os.path.exists(svg_path):
            if convert_svg_to_png(svg_path, png_path, size):
                print(f'Successfully converted {icon_name} to PNG')
            else:
                success = False
                print(f'Failed to convert {icon_name} to PNG')

    return success

if __name__ == "__main__":
    main()

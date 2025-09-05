"""
Versatile Text-to-ASCII Art Converter
A command-line tool for converting text to banners and images to ASCII art.
"""

import argparse
import os
import sys
import time
from pathlib import Path
from typing import List, Tuple, Optional

try:
    import pyfiglet
    from PIL import Image, ImageSequence
except ImportError as e:
    print(f"Error: Missing required dependency - {e}")
    print("Please install requirements using: pip install -r requirements.txt")
    sys.exit(1)


class ASCIIConverter:
    """Main class for ASCII art conversion operations."""
    
    # Character sets for different ASCII art styles
    CHARACTER_SETS = {
        'simple': ' .:-=+*#%@',
        'detailed': '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`.',
        'blocks': ' ░▒▓█'
    }
    
    def __init__(self):
        self.clear_command = 'cls' if os.name == 'nt' else 'clear'
    
    def text_to_banner(self, text: str, font: str = 'slant') -> str:
        """
        Convert text to ASCII banner using pyfiglet.
        
        Args:
            text: Input text to convert
            font: Figlet font to use
            
        Returns:
            ASCII banner as string
        """
        try:
            figlet = pyfiglet.Figlet(font=font)
            return figlet.renderText(text)
        except Exception as e:
            print(f"Error generating banner: {e}")
            # Fallback to default font
            figlet = pyfiglet.Figlet()
            return figlet.renderText(text)
    
    def image_to_ascii(self, image_path: str, width: int = 80, 
                      charset: str = 'simple', color: bool = False) -> str:
        """
        Convert an image to ASCII art.
        
        Args:
            image_path: Path to the image file
            width: Output width in characters
            charset: Character set to use for conversion
            color: Whether to output colored ASCII
            
        Returns:
            ASCII art as string
        """
        try:
            # Open and process image
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Calculate new dimensions maintaining aspect ratio
                aspect_ratio = img.height / img.width
                new_height = int(width * aspect_ratio * 0.55)  # 0.55 compensates for character height/width ratio
                
                # Resize image
                img = img.resize((width, new_height), Image.Resampling.LANCZOS)
                
                # Get character set
                chars = self.CHARACTER_SETS.get(charset, self.CHARACTER_SETS['simple'])
                
                ascii_art = []
                
                for y in range(img.height):
                    line = []
                    for x in range(img.width):
                        pixel = img.getpixel((x, y))
                        
                        if color:
                            # For colored output, use RGB values
                            r, g, b = pixel
                            # Convert to grayscale for character selection
                            gray = int(0.299 * r + 0.587 * g + 0.114 * b)
                            char_index = int((gray / 255) * (len(chars) - 1))
                            char = chars[char_index]
                            
                            # Apply ANSI color codes
                            colored_char = f"\033[38;2;{r};{g};{b}m{char}\033[0m"
                            line.append(colored_char)
                        else:
                            # Grayscale conversion
                            if isinstance(pixel, (list, tuple)):
                                gray = int(0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2])
                            else:
                                gray = pixel
                            
                            # Map brightness to character
                            char_index = int((gray / 255) * (len(chars) - 1))
                            line.append(chars[char_index])
                    
                    ascii_art.append(''.join(line))
                
                return '\n'.join(ascii_art)
                
        except FileNotFoundError:
            raise FileNotFoundError(f"Image file not found: {image_path}")
        except Exception as e:
            raise Exception(f"Error processing image: {e}")
    
    def gif_to_animated_ascii(self, gif_path: str, width: int = 80, 
                             charset: str = 'simple', color: bool = False, 
                             frame_delay: float = 0.1) -> None:
        """
        Convert GIF to animated ASCII art and display it.
        
        Args:
            gif_path: Path to the GIF file
            width: Output width in characters
            charset: Character set to use
            color: Whether to output colored ASCII
            frame_delay: Delay between frames in seconds
        """
        try:
            with Image.open(gif_path) as gif:
                frames = []
                
                print("Processing GIF frames...")
                
                # Process each frame
                for frame_num, frame in enumerate(ImageSequence.Iterator(gif)):
                    # Convert frame to RGB
                    if frame.mode != 'RGB':
                        frame = frame.convert('RGB')
                    
                    # Save frame temporarily and convert to ASCII
                    temp_frame_path = f"temp_frame_{frame_num}.png"
                    frame.save(temp_frame_path)
                    
                    try:
                        ascii_frame = self.image_to_ascii(temp_frame_path, width, charset, color)
                        frames.append(ascii_frame)
                    finally:
                        # Clean up temporary file
                        if os.path.exists(temp_frame_path):
                            os.remove(temp_frame_path)
                
                print(f"Processed {len(frames)} frames. Starting animation...")
                print("Press Ctrl+C to stop the animation.")
                
                # Display animation
                try:
                    while True:
                        for frame in frames:
                            os.system(self.clear_command)
                            print(frame)
                            time.sleep(frame_delay)
                except KeyboardInterrupt:
                    print("\nAnimation stopped.")
                    
        except Exception as e:
            raise Exception(f"Error processing GIF: {e}")


def is_image_file(file_path: str) -> bool:
    """Check if the given path is an image file."""
    if not os.path.isfile(file_path):
        return False
    
    image_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp'}
    return Path(file_path).suffix.lower() in image_extensions


def main():
    """Main function with argument parsing and execution logic."""
    parser = argparse.ArgumentParser(
        description="Versatile Text-to-ASCII Art Converter",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "HELLO WORLD"                    # Convert text to banner
  %(prog)s image.jpg                        # Convert image to ASCII
  %(prog)s image.png --width 100 --color   # Colored ASCII with custom width
  %(prog)s animation.gif --animated         # Animated GIF to ASCII
        """
    )
    
    parser.add_argument('input', 
                       help='Input text string or path to image/GIF file')
    
    parser.add_argument('--width', '-w', 
                       type=int, 
                       default=80,
                       help='Output width in characters (default: 80)')
    
    parser.add_argument('--charset', '-c',
                       choices=['simple', 'detailed', 'blocks'],
                       default='simple',
                       help='Character set for ASCII conversion (default: simple)')
    
    parser.add_argument('--color',
                       action='store_true',
                       help='Generate colored ASCII art (for images only)')
    
    parser.add_argument('--animated', '-a',
                       action='store_true',
                       help='Process GIF as animation')
    
    parser.add_argument('--font', '-f',
                       default='slant',
                       help='Font for text banner (default: slant)')
    
    parser.add_argument('--frame-delay',
                       type=float,
                       default=0.1,
                       help='Delay between animation frames in seconds (default: 0.1)')
    
    args = parser.parse_args()
    
    # Initialize converter
    converter = ASCIIConverter()
    
    try:
        # Determine if input is a file path or text
        if is_image_file(args.input):
            # Image/GIF mode
            if args.animated and args.input.lower().endswith('.gif'):
                # Animated GIF
                converter.gif_to_animated_ascii(
                    args.input, 
                    args.width, 
                    args.charset, 
                    args.color,
                    args.frame_delay
                )
            else:
                # Static image
                if args.color and not sys.stdout.isatty():
                    print("Warning: Color output may not display properly when redirected to file.")
                
                ascii_art = converter.image_to_ascii(
                    args.input, 
                    args.width, 
                    args.charset, 
                    args.color
                )
                print(ascii_art)
        else:
            # Text banner mode
            if args.color:
                print("Warning: Color option is only available for image conversion.")
            
            banner = converter.text_to_banner(args.input, args.font)
            print(banner)
            
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
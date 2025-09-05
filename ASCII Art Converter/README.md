# ASCII Art Converter

## 🧘 Zen Level: 1-2 hours
*Simple concept, satisfying results*

## Overview
A versatile command-line tool that transforms text into stylized banners and converts images (including animated GIFs) into ASCII art. Perfect for creating eye-catching GitHub README headers and artistic terminal displays.

## Features
- **Text to Banner**: Convert any text into ASCII art banners using multiple fonts
- **Image to ASCII**: Transform images into character-based art with customizable width and character sets
- **Animated GIFs**: Process GIFs frame-by-frame for animated ASCII art
- **Color Support**: Generate colored ASCII art that preserves original image colors
- **Multiple Character Sets**: Choose from simple, detailed, or block-style character mappings

## Tech Stack
- **Python 3.7+**
- **PIL (Pillow)**: Image processing and manipulation
- **pyfiglet**: Text-to-banner conversion with multiple fonts
- **argparse**: Command-line interface

## Installation
```bash
pip install pillow pyfiglet
```

## Usage Examples

### Text Banners
```bash
python ascii_converter.py "DIGITAL ZEN"
python ascii_converter.py "Hello World" --font big
```

### Image Conversion
```bash
# Basic ASCII art
python ascii_converter.py photo.jpg

# Colored ASCII with custom width
python ascii_converter.py photo.png --width 100 --color

# Different character sets
python ascii_converter.py image.jpg --charset detailed
python ascii_converter.py logo.png --charset blocks
```

### Animated GIFs
```bash
# Convert GIF to animated ASCII
python ascii_converter.py animation.gif --animated

# Adjust animation speed
python ascii_converter.py fast.gif --animated --frame-delay 0.05
```

## Character Sets
- **Simple**: ` .:-=+*#%@` - Clean, minimal appearance
- **Detailed**: Full character range for high-resolution ASCII art
- **Blocks**: `░▒▓█` - Unicode block characters for solid appearance

## Mindful Moment
Building this taught me the beauty of **pixel-to-character mapping** and how something as simple as brightness values can create art. The most satisfying part was seeing photos transform into recognizable ASCII representations - it's like watching digital alchemy happen in real-time. The animated GIF feature adds an extra layer of delight, turning static code into living, breathing art.

## Sample Output
```
 ____  _       _ _        _ _____
|  _ \(_) __ _(_) |_ __ _| |__  /___ _ __
| | | | |/ _` | | __/ _` | | / // _ \ '_ \
| |_| | | (_| | | || (_| | |/ /|  __/ | | |
|____/|_|\__, |_|\__\__,_|_/____\___|_| |_|
         |___/
```

*One of many banner fonts available for text conversion*

***
*Created as a peaceful coding break - sometimes the simplest projects bring the most joy* ✨
